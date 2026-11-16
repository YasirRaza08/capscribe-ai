import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.api.routes import router as api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Professional AI Video Captioning & Subtitle Studio REST API",
    version=settings.APP_VERSION,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize persistent SQLite database
@app.on_event("startup")
def on_startup():
    init_db()
    print(f"[{settings.APP_NAME}] Backend initialized successfully.")
    print(f"[{settings.APP_NAME}] FFmpeg path: {settings.ffmpeg_path}")
    print(f"[{settings.APP_NAME}] FFprobe path: {settings.ffprobe_path}")

# Register routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "brand": settings.BRAND_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
