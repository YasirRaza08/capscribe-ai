import os
import shutil
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Load environment variables from backend/.env or root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
RENDERS_DIR = DATA_DIR / "renders"
SUBTITLES_DIR = DATA_DIR / "subtitles"
THUMBNAILS_DIR = DATA_DIR / "thumbnails"
DB_PATH = DATA_DIR / "studio.db"

# Local bin directory for portable static binaries (FFmpeg, FFprobe)
ROOT_DIR = BASE_DIR.parent
BIN_DIR = ROOT_DIR / "bin"

class Settings(BaseModel):
    APP_NAME: str = "CapScribe AI"
    APP_VERSION: str = "1.0.0"
    BRAND_NAME: str = "CapScribe"
    BRAND_TAGLINE: str = "Professional AI Video Captioning & Subtitle Studio"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-capscribe-dev-key-change-in-prod-2026")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Storage & Upload limits
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_VIDEO_EXTENSIONS: set[str] = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}
    
    # AI Whisper, Gemini & Groq Config
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Supabase (Optional cloud adapter; fallback to local SQLite)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # FFmpeg / FFprobe path resolution
    @property
    def ffmpeg_path(self) -> str:
        local_ffmpeg = BIN_DIR / "ffmpeg.exe"
        if local_ffmpeg.exists():
            return str(local_ffmpeg)
        sys_ffmpeg = shutil.which("ffmpeg")
        if sys_ffmpeg:
            return sys_ffmpeg
        return str(local_ffmpeg)

    @property
    def ffprobe_path(self) -> str:
        local_ffprobe = BIN_DIR / "ffprobe.exe"
        if local_ffprobe.exists():
            return str(local_ffprobe)
        sys_ffprobe = shutil.which("ffprobe")
        if sys_ffprobe:
            return sys_ffprobe
        return str(local_ffprobe)

settings = Settings()

# Ensure directories exist
for directory in [DATA_DIR, UPLOADS_DIR, RENDERS_DIR, SUBTITLES_DIR, THUMBNAILS_DIR, BIN_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
