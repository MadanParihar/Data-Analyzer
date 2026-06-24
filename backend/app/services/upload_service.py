import pandas as pd
import sqlite3
import os
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.core.config import get_settings

settings = get_settings()

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId

class UploadService:
    def __init__(self):
        self.upload_dir = os.path.abspath("uploads")
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir, exist_ok=True)

    def get_local_path(self, path: str) -> str:
        """
        Takes any path (windows, linux, absolute, relative) and returns 
        the absolute path within the current environment's upload directory.
        """
        if not path:
            return ""
        # Get just the filename (e.g., "db_123.sqlite")
        filename = os.path.basename(path)
        return os.path.join(self.upload_dir, filename)

    def sanitize_name(self, name: str) -> str:
        """Sanitize table and column names: lowercase, replace spaces/special chars with underscores."""
        clean = re.sub(r'[^a-zA-Z0-9_]', '_', name).lower()
        clean = re.sub(r'_+', '_', clean).strip('_')
        if not clean or not clean[0].isalpha():
            clean = "t_" + clean
        return clean

    async def persist_db_to_mongo(self, db_path: str, upload_id: str, mongo_db: AsyncIOMotorDatabase):
        """
        Saves the SQLite file to MongoDB GridFS.
        """
        local_path = self.get_local_path(db_path)
        if not os.path.exists(local_path):
            print(f"File {local_path} does not exist for persistence.")
            return

        bucket = AsyncIOMotorGridFSBucket(mongo_db)
        
        # 1. Clean up old version if exists
        try:
             async for cursor in bucket.find({"filename": upload_id}):
                 await bucket.delete(cursor["_id"])
        except:
             pass

        # 2. Upload to GridFS
        with open(local_path, "rb") as f:
            await bucket.upload_from_stream(
                upload_id,  # Using upload_id as the "filename" for easy lookup
                f,
                metadata={"uploadId": upload_id, "updatedAt": datetime.utcnow()}
            )
        print(f"Persisted {local_path} to GridFS for uploadId: {upload_id}")

    async def retrieve_db_from_mongo(self, db_path: str, upload_id: str, mongo_db: AsyncIOMotorDatabase) -> bool:
        """
        Retrieves binary data from MongoDB GridFS and writes it back to a local SQLite file if missing.
        """
        local_path = self.get_local_path(db_path)
        if os.path.exists(local_path):
            return True

        bucket = AsyncIOMotorGridFSBucket(mongo_db)
        
        try:
            # Look for the file by its "filename" (which we set to upload_id)
            cursor = await bucket.find({"filename": upload_id}).to_list(length=1)
            if not cursor:
                print(f"No GridFS file found for uploadId: {upload_id}")
                return False

            with open(local_path, "wb") as f:
                await bucket.download_to_stream(cursor[0]["_id"], f)
            
            print(f"Restored {local_path} from GridFS for uploadId: {upload_id}")
            return True
        except Exception as e:
            print(f"GridFS Restore failed: {e}")
            return False

    def _read_file_to_dataframes(self, file_path: str, original_name: str) -> List[Tuple[str, pd.DataFrame]]:
        ext = os.path.splitext(original_name)[1].lower()
        base_name = os.path.splitext(original_name)[0]

        results = []
        if ext in ['.xlsx', '.xls']:
            try:
                # Use a context manager so the file handle is released before the
                # caller deletes the temp file (avoids WinError 32 on Windows).
                with pd.ExcelFile(file_path) as xls:
                    if len(xls.sheet_names) == 1:
                        table_name = self.sanitize_name(base_name)
                        df = pd.read_excel(xls, sheet_name=xls.sheet_names[0])
                        results.append((table_name, df))
                    else:
                        for sheet in xls.sheet_names:
                            table_name = self.sanitize_name(f"{base_name}_{sheet}")
                            df = pd.read_excel(xls, sheet_name=sheet)
                            results.append((table_name, df))
            except ImportError as e:
                # Missing optional engine (openpyxl for .xlsx, xlrd for .xls)
                engine = "openpyxl" if ext == '.xlsx' else "xlrd"
                raise RuntimeError(
                    f"Reading '{original_name}' needs the '{engine}' package, which is not installed "
                    f"in the backend environment. Install backend requirements (pip install -r requirements.txt)."
                ) from e
        elif ext == '.json':
            table_name = self.sanitize_name(base_name)
            df = pd.read_json(file_path)
            if not df.empty:
                has_nested = any(df[col].apply(lambda x: isinstance(x, (dict, list))).any() for col in df.columns)
                if has_nested:
                    df = pd.json_normalize(pd.read_json(file_path).to_dict(orient="records"))
            results.append((table_name, df))
        else:
            table_name = self.sanitize_name(base_name)
            df = pd.read_csv(file_path)
            results.append((table_name, df))
            
        return results

    def _insert_chunk_to_sqlite(self, df: pd.DataFrame, table_name: str, conn: sqlite3.Connection):
        """Helper to clean and insert a dataframe chunk into SQLite."""
        # Clean columns
        df.columns = [self.sanitize_name(col) for col in df.columns]
        
        # Drop completely empty rows and convert types
        df = df.dropna(how='all').convert_dtypes()
        
        # Insert
        df.to_sql(table_name, conn, if_exists='append', index=False, method="multi")

    async def process_csv_to_sqlite(self, csv_paths: List[str], original_names: List[str], master_db_path: str = None) -> Tuple[str, List[str]]:
        """
        Converts list of files to a single SQLite DB.
        """
        if not master_db_path:
            timestamp = int(datetime.utcnow().timestamp())
            local_db_path = os.path.join(self.upload_dir, f"db_{timestamp}.sqlite")
        else:
            local_db_path = self.get_local_path(master_db_path)

        conn = sqlite3.connect(local_db_path)
        # Optimization PRAGMAs
        conn.execute("PRAGMA synchronous = OFF")
        conn.execute("PRAGMA journal_mode = MEMORY")

        table_names = []

        try:
            # Existing tables in the target DB. When appending to an existing
            # database we must NOT clobber them — pick a unique name on collision
            # so old data is always preserved (accumulate).
            existing = set()
            try:
                cur = conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                )
                existing = {row[0] for row in cur.fetchall()}
            except Exception:
                existing = set()

            for file_path, original_name in zip(csv_paths, original_names):
                dataframes = self._read_file_to_dataframes(file_path, original_name)
                for table_name, df in dataframes:
                    final_name = table_name
                    suffix = 2
                    while final_name in existing:
                        final_name = f"{table_name}_{suffix}"
                        suffix += 1
                    existing.add(final_name)

                    df = self._coerce_for_sqlite(df)
                    df.to_sql(final_name, conn, if_exists='replace', index=False)
                    table_names.append(final_name)
                    print(f"Processed {original_name} -> {final_name}")

        finally:
            conn.close()

        return local_db_path, table_names

    def _coerce_for_sqlite(self, df: pd.DataFrame) -> pd.DataFrame:
        """Make a DataFrame safe to write to a raw sqlite3 connection.
        Datetime columns are stored as ISO strings (Python 3.12 removed the
        default sqlite3 datetime adapters), which keeps dates sortable/filterable."""
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].astype(str)
        return df

    async def process_excel_to_sqlite(self, excel_paths: List[str], original_names: List[str], master_db_path: str = None) -> Tuple[str, List[str]]:
        """
        Converts Excel files (.xlsx, .xls) to SQLite tables by streaming sheets.
        """
        if not master_db_path:
            timestamp = int(datetime.utcnow().timestamp())
            local_db_path = os.path.join(self.upload_dir, f"db_{timestamp}.sqlite")
        else:
            local_db_path = self.get_local_path(master_db_path)

        conn = sqlite3.connect(local_db_path)
        conn.execute("PRAGMA synchronous = OFF")
        conn.execute("PRAGMA journal_mode = MEMORY")
        
        table_names = []

        try:
            for excel_path, original_name in zip(excel_paths, original_names):
                xls = pd.ExcelFile(excel_path)
                
                for sheet_name in xls.sheet_names:
                    temp_csv_path = None # Place for future temp file logic if needed
                    try:
                        # Sanitize table name: filename_sheetname
                        clean_sheet = self.sanitize_name(sheet_name)
                        base_file = self.sanitize_name(os.path.splitext(original_name)[0])
                        table_name = f"{base_file}_{clean_sheet}"
                        
                        conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
                        
                        # Read Excel sheet in chunks
                        if excel_path.endswith('.xlsx'):
                            import openpyxl
                            wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
                            ws = wb[sheet_name]
                            
                            rows_iter = ws.iter_rows(values_only=True)
                            header = next(rows_iter)
                            if not header: continue
                            
                            chunk = []
                            for row in rows_iter:
                                chunk.append(row)
                                if len(chunk) >= 5000:
                                    df_chunk = pd.DataFrame(chunk, columns=header)
                                    self._insert_chunk_to_sqlite(df_chunk, table_name, conn)
                                    chunk = []
                            
                            if chunk:
                                df_chunk = pd.DataFrame(chunk, columns=header)
                                self._insert_chunk_to_sqlite(df_chunk, table_name, conn)
                            wb.close()
                        else:
                            # Fallback for .xls
                            df = pd.read_excel(xls, sheet_name=sheet_name)
                            self._insert_chunk_to_sqlite(df, table_name, conn)
                            
                        table_names.append(table_name)
                        print(f"Processed Excel {original_name} [{sheet_name}] -> {table_name}")
                    
                    except Exception as sheet_err:
                        print(f"Error processing sheet {sheet_name} in {original_name}: {sheet_err}")
                    
                    finally:
                        if temp_csv_path and os.path.exists(temp_csv_path):
                            os.remove(temp_csv_path)

                # Release the workbook handle so the temp file can be deleted (Windows).
                xls.close()

        finally:
            conn.close()

        return local_db_path, table_names

    def get_database_state(self, db_path: str) -> Dict[str, Any]:
        """
        Returns {schema: str, databaseState: Dict}
        """
        local_path = self.get_local_path(db_path)
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Database file not found: {local_path}")

        conn = sqlite3.connect(local_path)
        cursor = conn.cursor()
        
        try:
            # Get Schema
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL")
            schemas = [row[0] for row in cursor.fetchall()]
            full_schema = ";\n\n".join(schemas)

            # Get State (Preview)
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [row[0] for row in cursor.fetchall()]
            
            database_state = {}
            for table in tables:
                # Count
                cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                count = cursor.fetchone()[0]
                
                # Preview
                df = pd.read_sql_query(f'SELECT * FROM "{table}" LIMIT 5', conn)
                df = df.replace([float('inf'), float('-inf'), float('nan')], None)
                rows = df.to_dict(orient='records')
                
                database_state[table] = {
                    "total": count,
                    "rows": rows
                }
            
            return {
                "schema": full_schema,
                "databaseState": database_state
            }

        finally:
            conn.close()

    @staticmethod
    def _truncate(value, limit: int = 40) -> str:
        s = str(value)
        return s if len(s) <= limit else s[:limit] + "..."

    def get_llm_schema(self, db_path: str, max_columns: int = 40, max_values: int = 5) -> str:
        """LLM-facing schema: the CREATE TABLE DDL plus a compact block of distinct
        sample values per column.

        Showing real values lets the model pick correct literals, casing, and date
        formats in WHERE clauses instead of guessing. Capped to bound size/latency.
        """
        local_path = self.get_local_path(db_path)
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Database file not found: {local_path}")

        # Read-only connection — schema introspection never writes.
        conn = sqlite3.connect(f"file:{local_path}?mode=ro", uri=True)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL")
            ddl = ";\n\n".join(row[0] for row in cursor.fetchall())

            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [row[0] for row in cursor.fetchall()]

            sample_blocks = []
            for table in tables:
                cursor.execute(f'PRAGMA table_info("{table}")')
                columns = [r[1] for r in cursor.fetchall()][:max_columns]
                lines = []
                for col in columns:
                    try:
                        cursor.execute(
                            f'SELECT DISTINCT "{col}" FROM "{table}" '
                            f'WHERE "{col}" IS NOT NULL LIMIT {max_values}'
                        )
                        values = [self._truncate(v) for (v,) in cursor.fetchall()]
                    except Exception:
                        values = []
                    if values:
                        lines.append(f'  - {col}: {", ".join(values)}')
                if lines:
                    sample_blocks.append(f'Table "{table}" sample values:\n' + "\n".join(lines))

            if sample_blocks:
                return ddl + "\n\n-- Sample values --\n" + "\n\n".join(sample_blocks)
            return ddl
        finally:
            conn.close()


upload_service = UploadService()
