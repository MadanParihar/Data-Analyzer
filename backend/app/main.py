import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings, DEV_JWT_SECRET
from app.db.mongo import db
from app.api import auth, upload, sandbox, analyze, history, dashboard, notes, data

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS: restrict to the configured origins. Note that allow_credentials=True is
# incompatible with a "*" wildcard per the CORS spec, so origins are explicit.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    if settings.JWT_SECRET == DEV_JWT_SECRET:
        logger.warning(
            "JWT_SECRET is using the insecure development default. "
            "Set a strong JWT_SECRET environment variable before deploying."
        )
    await db.connect_to_database()

@app.on_event("shutdown")
async def shutdown_event():
    db.close_database_connection()

@app.get("/")
def root():
    return {"message": "Welcome to Data Analyzer API"}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(sandbox.router, prefix="/api", tags=["sandbox"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(data.router, prefix="/api", tags=["data"])
