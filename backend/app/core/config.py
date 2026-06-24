from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

# Insecure placeholder used only when JWT_SECRET is not provided via the
# environment. main.py logs a loud warning when this default is in effect.
DEV_JWT_SECRET = "dev-insecure-change-me"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Analyzer API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = "data-analyzer"

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", DEV_JWT_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # CORS: comma-separated list of allowed origins
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174"
    )

    # Uploads
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "50"))

    # Google Gemini
    GOOGLE_API_KEY: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
