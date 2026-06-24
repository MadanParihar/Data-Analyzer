from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from typing import List
from app.services.upload_service import upload_service
from app.db.mongo import get_database
from app.models.log import UploadLog
from app.core.security import create_access_token, get_current_user
from app.core.config import get_settings
from app.models.user import UserResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from datetime import datetime

settings = get_settings()

ALLOWED_EXTENSIONS = {".csv", ".sqlite", ".db", ".xlsx", ".xls", ".json"}
_CHUNK_SIZE = 1024 * 1024  # 1 MB

def _validate_extension(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

def _save_upload_streamed(upload: UploadFile, file_path: str):
    """Stream an upload to disk in chunks, aborting (HTTP 413) past the limit.

    Streaming keeps memory flat for large files, and the running byte count
    enforces MAX_UPLOAD_MB before the file is ever loaded into pandas.
    """
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    total = 0
    with open(file_path, "wb") as buffer:
        while True:
            chunk = upload.file.read(_CHUNK_SIZE)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                buffer.close()
                try:
                    os.remove(file_path)
                except OSError:
                    pass
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds the maximum allowed size of {settings.MAX_UPLOAD_MB} MB.",
                )
            buffer.write(chunk)

router = APIRouter()

@router.post("/upload-db")
async def upload_db(
    files: List[UploadFile] = File(..., alias="database"), 
    clean: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # 1. Save temp files
    temp_paths = []
    original_names = []
    
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")

        for file in files:
            _validate_extension(file.filename)
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{timestamp}_{file.filename}"
            # Ensure upload_dir exists
            if not os.path.exists(upload_service.upload_dir):
                os.makedirs(upload_service.upload_dir)
            
            file_path = os.path.join(upload_service.upload_dir, filename)

            _save_upload_streamed(file, file_path)

            temp_paths.append(file_path)
            original_names.append(file.filename)

        # 2. Process to SQLite
        master_db_path = None
        all_table_names = []
        
        csv_data = [(p, n) for p, n in zip(temp_paths, original_names) if n.lower().endswith(('.csv', '.xlsx', '.xls', '.json'))]
        
        if csv_data:
            paths, names = zip(*csv_data)
            master_db_path, tables = await upload_service.process_csv_to_sqlite(list(paths), list(names), master_db_path)
            all_table_names.extend(tables)

        if not master_db_path:
             raise HTTPException(status_code=400, detail="No valid supported files processed")

        # 3. Get State
        state = upload_service.get_database_state(master_db_path)
        
        # 4. Cleanup Temp Files (best-effort — must not fail a successful upload)
        for p in temp_paths:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError as cleanup_err:
                print(f"Temp cleanup skipped for {p}: {cleanup_err}")

        # 5. Log to MongoDB
        new_upload = UploadLog(
            filename=os.path.basename(master_db_path),
            originalName=f"Merged ({len(files)} files)" if len(files) > 1 else original_names[0],
            path=master_db_path,
            userId=str(current_user["_id"])
        )
        
        res = await db.uploads.insert_one(new_upload.dict(by_alias=True, exclude={"id"}))
        upload_id = str(res.inserted_id)

        # 6. PERSIST to MongoDB (Binary for Render)
        await upload_service.persist_db_to_mongo(master_db_path, upload_id, db)

        return {
            "status": "success",
            "message": f"Successfully processed {len(files)} files.",
            "schema": state["schema"],
            "filename": new_upload.filename,
            "path": master_db_path,
            "databaseState": state["databaseState"],
            "uploadId": upload_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from bson import ObjectId

@router.post("/append")
async def append_db(
    database: UploadFile = File(...),
    uploadId: str = Form(...),
    clean: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # Find the existing upload session
        upload_log = await db.uploads.find_one({"_id": ObjectId(uploadId), "userId": str(current_user["_id"])})
        if not upload_log:
            raise HTTPException(status_code=404, detail="Upload session not found")

        master_db_path = upload_log.get("path")
        if not master_db_path:
            raise HTTPException(status_code=404, detail="Database path not found in logs")

        # PERSISTENCE: Restore from MongoDB if missing locally
        restored = await upload_service.retrieve_db_from_mongo(master_db_path, uploadId, db)
        if not restored:
             raise HTTPException(status_code=404, detail="Database file not found on server or in backup")

        # Save temp file
        _validate_extension(database.filename)
        timestamp = int(datetime.utcnow().timestamp())
        filename = f"{timestamp}_{database.filename}"
        if not os.path.exists(upload_service.upload_dir):
            os.makedirs(upload_service.upload_dir)
        
        file_path = os.path.join(upload_service.upload_dir, filename)

        _save_upload_streamed(database, file_path)

        # Append to SQLite
        if database.filename.lower().endswith(('.csv', '.xlsx', '.xls', '.json')):
            _, table_names = await upload_service.process_csv_to_sqlite(
                csv_paths=[file_path], 
                original_names=[database.filename], 
                master_db_path=master_db_path
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format for append")
        
        # Get State
        state = upload_service.get_database_state(master_db_path)
        
        # PERSISTENCE: Update the binary storage in MongoDB
        await upload_service.persist_db_to_mongo(master_db_path, uploadId, db)

        # Cleanup (best-effort — must not fail a successful append)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError as cleanup_err:
            print(f"Temp cleanup skipped for {file_path}: {cleanup_err}")

        return {
            "status": "success",
            "message": f"Successfully appended {database.filename}",
            "schema": state["schema"],
            "databaseState": state["databaseState"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Append Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
