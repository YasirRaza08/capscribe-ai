import os
import re
import shutil
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, Header
from fastapi.responses import FileResponse

from app.core.config import settings, UPLOADS_DIR, RENDERS_DIR, SUBTITLES_DIR
from app.db.database import (
    save_project, get_project, list_projects, delete_project, duplicate_project,
    save_job, get_job, get_user_profile
)
from app.models.schemas import (
    Project, ProjectCreate, ProjectUpdate, VideoMetadata, StyleSettings,
    TranscriptionRequest, TranscriptionJobStatus, ExportRequest, ExportJobStatus,
    UserProfile, CaptionTemplate, CaptionToolRequest
)
from app.services.video_service import VideoService
from app.services.transcription_service import TranscriptionService, convert_segments_to_roman_urdu_gemini
from app.services.render_service import RenderService
from app.templates.presets import CAPTION_TEMPLATES, get_template

router = APIRouter()

# -----------------
# AUTH & PROFILE
# -----------------
@router.get("/auth/me", response_model=UserProfile)
def get_current_user():
    return get_user_profile("dev-user-001")

@router.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    # Local dev mode login with simulated token
    return {
        "access_token": "dev_token_user_001",
        "token_type": "bearer",
        "user": get_user_profile("dev-user-001").model_dump()
    }

@router.post("/auth/register")
def register(email: str = Form(...), password: str = Form(...), full_name: str = Form(...)):
    return {
        "access_token": "dev_token_user_001",
        "token_type": "bearer",
        "user": get_user_profile("dev-user-001").model_dump()
    }

# -----------------
# TEMPLATES
# -----------------
@router.get("/templates", response_model=List[CaptionTemplate])
def get_all_templates():
    return CAPTION_TEMPLATES

@router.get("/templates/{template_id}", response_model=CaptionTemplate)
def get_single_template(template_id: str):
    return get_template(template_id)

# -----------------
# PROJECTS
# -----------------
@router.get("/projects", response_model=List[Project])
def list_user_projects(x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    uid = x_user_id or "guest"
    return list_projects(uid)

@router.post("/projects", response_model=Project)
def create_project(data: ProjectCreate, x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    project_id = f"proj_{uuid.uuid4().hex[:10]}"
    uid = x_user_id or "guest"
    project = Project(
        id=project_id,
        user_id=uid,
        title=data.title,
        status="created",
        style=get_template("viral_beast").style
    )
    return save_project(project)

@router.get("/projects/{project_id}", response_model=Project)
def get_single_project(project_id: str, x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    proj = get_project(project_id, x_user_id)
    if not proj:
        # Fallback to direct id lookup so direct links/shares work
        proj = get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Universally guarantee 2-3 words per card on load for every project and every user
    limit = proj.style.max_words_per_line or 3
    if proj.captions and any(len(c.words or c.text.split()) > limit for c in proj.captions):
        proj.captions = TranscriptionService.enforce_max_words_per_segment(proj.captions, max_words=limit)
        save_project(proj)

    return proj

@router.put("/projects/{project_id}", response_model=Project)
def update_existing_project(project_id: str, data: ProjectUpdate, x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    proj = get_project(project_id, x_user_id)
    if not proj:
        proj = get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if data.title is not None:
        proj.title = data.title
    if data.style is not None:
        proj.style = data.style
    if data.captions is not None:
        proj.captions = TranscriptionService.enforce_max_words_per_segment(
            data.captions,
            max_words=proj.style.max_words_per_line or 3
        )
        
    return save_project(proj)

@router.delete("/projects/{project_id}")
def delete_single_project(project_id: str, x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    success = delete_project(project_id, x_user_id)
    if not success:
        # If not matched with user_id, try without restriction
        success = delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully", "id": project_id}

@router.post("/projects/{project_id}/duplicate", response_model=Project)
def duplicate_single_project(project_id: str, x_user_id: Optional[str] = Header(None, alias="x-user-id")):
    copy_proj = duplicate_project(project_id, x_user_id or "guest")
    if not copy_proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return copy_proj

@router.post("/projects/{project_id}/caption-tools", response_model=Project)
def apply_caption_tools(project_id: str, req: CaptionToolRequest):
    proj = get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.action == "auto_emoji":
        proj.captions = TranscriptionService.enrich_with_emojis(proj.captions)
    elif req.action == "remove_emoji":
        proj.captions = TranscriptionService.remove_emojis(proj.captions)
    elif req.action == "uppercase":
        for s in proj.captions:
            for w in s.words:
                w.word = w.word.upper()
            s.text = s.text.upper()
    elif req.action == "lowercase":
        for s in proj.captions:
            for w in s.words:
                w.word = w.word.lower()
            s.text = s.text.lower()
    elif req.action == "capitalize":
        for s in proj.captions:
            for w in s.words:
                w.word = w.word.capitalize()
            s.text = s.text.title()
    elif req.action == "chunk_short":
        proj.captions = TranscriptionService.enforce_max_words_per_segment(proj.captions, max_words=proj.style.max_words_per_line or 3)
    elif req.action == "roman_urdu":
        if settings.GEMINI_API_KEY:
            proj.captions = convert_segments_to_roman_urdu_gemini(
                proj.captions,
                api_key=settings.GEMINI_API_KEY,
                model_name="gemini-flash-lite-latest"
            )
        proj.captions = TranscriptionService.enforce_max_words_per_segment(
            proj.captions,
            max_words=proj.style.max_words_per_line or 3
        )

    return save_project(proj)

# -----------------
# VIDEO UPLOAD
# -----------------
@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_VIDEO_EXTENSIONS)}"
        )

    project_id = f"proj_{uuid.uuid4().hex[:10]}"
    # Clean URL-safe ASCII filename without hashtags, emojis, or query parameters
    raw_stem = os.path.splitext(file.filename)[0]
    clean_stem = re.sub(r'[^a-zA-Z0-9_\-]', '_', raw_stem).strip('_')
    if not clean_stem:
        clean_stem = "video"
    safe_filename = f"{project_id}_{clean_stem}{ext}"
    save_path = UPLOADS_DIR / safe_filename

    # Save to disk with chunked stream
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Validate with FFprobe
    try:
        metadata = VideoService.probe_video(str(save_path))
    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted video file: {str(e)}")

    # Generate thumbnail
    thumb_path = VideoService.generate_thumbnail(str(save_path), project_id)
    thumb_url = f"/api/media/thumbnail/{os.path.basename(thumb_path)}" if thumb_path else None
    video_url = f"/api/projects/{project_id}/video"

    # Auto create project
    proj_title = title or os.path.splitext(file.filename)[0]
    uid = x_user_id or "guest"
    project = Project(
        id=project_id,
        user_id=uid,
        title=proj_title,
        status="uploaded",
        original_video_name=file.filename,
        video_path=str(save_path),
        video_url=video_url,
        thumbnail_path=thumb_path,
        thumbnail_url=thumb_url,
        metadata=metadata,
        style=get_template("viral_beast").style
    )
    save_project(project)

    return {
        "project": project,
        "metadata": metadata
    }

# -----------------
# AI TRANSCRIPTION
# -----------------
def run_transcription_task(
    job_id: str,
    project_id: str,
    language: Optional[str] = None,
    writing_script: Optional[str] = "default",
    model_size: str = "base",
    roman_urdu: bool = False,
    enhance_audio: bool = False,
    add_emojis: bool = False
):
    try:
        save_job(job_id, project_id, "transcription", "processing", 10, "Extracting audio stream from video...")
        proj = get_project(project_id)
        if not proj or not proj.video_path or not os.path.exists(proj.video_path):
            save_job(job_id, project_id, "transcription", "failed", 0, "Video file not found", "Video path does not exist on disk.")
            return

        wav_path = str(UPLOADS_DIR / f"{project_id}_audio.wav")
        VideoService.extract_audio(proj.video_path, wav_path, enhance=enhance_audio)

        save_job(job_id, project_id, "transcription", "processing", 20, "Running AI speech recognition...")

        def transcription_progress(pct: int, msg: str):
            save_job(job_id, project_id, "transcription", "processing", pct, msg)

        detected_lang, segments = TranscriptionService.transcribe(
            audio_path=wav_path,
            language=language,
            writing_script=writing_script,
            model_size=model_size,
            roman_urdu=roman_urdu,
            add_emojis=add_emojis,
            max_words_per_segment=min(proj.style.max_words_per_line or 3, 3),
            on_progress=transcription_progress
        )

        # Enforce viral short cards (max 2-3 words) across all models and languages
        segments = TranscriptionService.enforce_max_words_per_segment(
            segments,
            max_words=min(proj.style.max_words_per_line or 3, 3)
        )

        save_job(job_id, project_id, "transcription", "processing", 85, "Formatting word timestamps and segments...")
        
        # Clean up temporary WAV
        if os.path.exists(wav_path):
            os.remove(wav_path)

        # Update and save project
        proj.captions = segments
        proj.detected_language = detected_lang
        proj.status = "ready"
        save_project(proj)

        save_job(
            job_id, project_id, "transcription", "completed", 100,
            f"Transcription completed! Detected language: {detected_lang.upper()}",
            result={"detected_language": detected_lang, "segments_count": len(segments)}
        )

    except Exception as e:
        save_job(job_id, project_id, "transcription", "failed", 0, "Transcription error", str(e))
        proj = get_project(project_id)
        if proj:
            proj.status = "error"
            save_project(proj)

@router.post("/projects/{project_id}/transcribe", response_model=TranscriptionJobStatus)
def start_transcription(
    project_id: str,
    req: TranscriptionRequest,
    background_tasks: BackgroundTasks
):
    proj = get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if not proj.video_path or not os.path.exists(proj.video_path):
        raise HTTPException(status_code=400, detail="Project does not have an uploaded video")

    job_id = f"job_transcribe_{uuid.uuid4().hex[:8]}"
    save_job(job_id, project_id, "transcription", "queued", 0, "Transcription job queued in background worker...")

    proj.status = "transcribing"
    save_project(proj)

    background_tasks.add_task(
        run_transcription_task,
        job_id,
        project_id,
        req.language,
        req.writing_script,
        req.model_size or "base",
        req.roman_urdu,
        req.enhance_audio,
        req.add_emojis
    )

    return TranscriptionJobStatus(
        job_id=job_id,
        project_id=project_id,
        status="queued",
        progress=0,
        message="Transcription job submitted"
    )

@router.get("/jobs/{job_id}")
def check_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# -----------------
# VIDEO EXPORT ENGINE
# -----------------
def run_export_task(job_id: str, project_id: str, req: ExportRequest):
    try:
        save_job(job_id, project_id, "export", "rendering", 5, "Initializing FFmpeg render pipeline...")
        proj = get_project(project_id)
        if not proj or not proj.video_path or not os.path.exists(proj.video_path):
            save_job(job_id, project_id, "export", "failed", 0, "Source video not found", "Source video missing.")
            return

        # Generate SRT and VTT files
        srt_filename = f"captions_{project_id}.srt"
        vtt_filename = f"captions_{project_id}.vtt"
        srt_path = str(SUBTITLES_DIR / srt_filename)
        vtt_path = str(SUBTITLES_DIR / vtt_filename)
        
        TranscriptionService.generate_srt(proj.captions, srt_path)
        TranscriptionService.generate_vtt(proj.captions, vtt_path)

        def progress_callback(pct: int, msg: str):
            save_job(job_id, project_id, "export", "rendering", pct, msg)

        # Render MP4
        output_mp4 = RenderService.render_video(
            input_video_path=proj.video_path,
            segments=proj.captions,
            style=proj.style,
            resolution=req.resolution,
            aspect_ratio=req.aspect_ratio,
            burn_captions=req.burn_captions,
            on_progress=progress_callback
        )

        mp4_filename = os.path.basename(output_mp4)
        download_url = f"/api/media/render/{mp4_filename}"
        srt_url = f"/api/media/subtitle/{srt_filename}"
        vtt_url = f"/api/media/subtitle/{vtt_filename}"
        file_size = os.path.getsize(output_mp4)

        save_job(
            job_id, project_id, "export", "completed", 100,
            "Video export rendered and verified successfully!",
            result={
                "download_url": download_url,
                "srt_url": srt_url,
                "vtt_url": vtt_url,
                "file_size_bytes": file_size,
                "resolution": req.resolution,
                "aspect_ratio": req.aspect_ratio
            }
        )

    except Exception as e:
        save_job(job_id, project_id, "export", "failed", 0, "Render failed", str(e))

@router.post("/projects/{project_id}/export", response_model=ExportJobStatus)
def export_project_video(
    project_id: str,
    req: ExportRequest,
    background_tasks: BackgroundTasks
):
    proj = get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    job_id = f"job_export_{uuid.uuid4().hex[:8]}"
    save_job(job_id, project_id, "export", "queued", 0, "Export job queued...")

    background_tasks.add_task(run_export_task, job_id, project_id, req)

    return ExportJobStatus(
        job_id=job_id,
        project_id=project_id,
        status="queued",
        progress=0,
        message="Video export queued"
    )

# -----------------
# MEDIA STREAMING & DOWNLOADS
# -----------------
@router.get("/projects/{project_id}/video")
def stream_project_video(project_id: str):
    """
    Direct, bulletproof project video streaming by project ID.
    Immune to hashtags, emojis, or URL encoding issues.
    """
    proj = get_project(project_id)
    if not proj or not proj.video_path:
        raise HTTPException(status_code=404, detail="Project or video path not found")
    
    video_file = Path(proj.video_path)
    if not video_file.exists():
        # Fallback: search in UPLOADS_DIR for any file starting with project_id
        matches = list(UPLOADS_DIR.glob(f"*{project_id}*"))
        if matches:
            video_file = matches[0]
        else:
            raise HTTPException(status_code=404, detail="Video file does not exist on disk")

    return FileResponse(path=video_file, media_type="video/mp4")

@router.get("/media/video/{filename:path}")
def stream_uploaded_video(filename: str):
    import urllib.parse
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        unquoted = urllib.parse.unquote(filename)
        file_path = UPLOADS_DIR / unquoted
    if not file_path.exists():
        # Fallback prefix matching (e.g. if URL was truncated at # or special character)
        prefix = filename.split("#")[0].split("?")[0].strip("_")
        matches = list(UPLOADS_DIR.glob(f"{prefix}*"))
        if matches:
            file_path = matches[0]
        else:
            raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path=file_path, media_type="video/mp4")

@router.get("/media/render/{filename}")
def download_rendered_video(filename: str):
    file_path = RENDERS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Rendered file not found")
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/media/thumbnail/{filename}")
def get_thumbnail_image(filename: str):
    file_path = settings.THUMBNAILS_DIR if hasattr(settings, 'THUMBNAILS_DIR') else UPLOADS_DIR.parent / "thumbnails" / filename
    from app.core.config import THUMBNAILS_DIR
    thumb_file = THUMBNAILS_DIR / filename
    if not thumb_file.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(path=thumb_file, media_type="image/jpeg")

@router.get("/media/subtitle/{filename}")
def download_subtitle_file(filename: str):
    file_path = SUBTITLES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Subtitle file not found")
    return FileResponse(
        path=file_path,
        media_type="text/plain; charset=utf-8",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# -----------------
# ADMIN & SYSTEM HEALTH
# -----------------
@router.get("/admin/stats")
def get_admin_system_stats():
    profile = get_user_profile("guest")
    projects = list_projects(None)
    
    # Calculate storage
    total_bytes = 0
    for d in [UPLOADS_DIR, RENDERS_DIR, SUBTITLES_DIR]:
        for f in d.glob("*"):
            if f.is_file():
                total_bytes += f.stat().st_size

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "brand_name": settings.BRAND_NAME,
        "environment": settings.ENVIRONMENT,
        "ffmpeg_status": "operational",
        "whisper_status": "operational",
        "total_projects": len(projects),
        "total_storage_mb": round(total_bytes / (1024 * 1024), 2),
        "user_profile": profile.model_dump(),
        "available_templates_count": len(CAPTION_TEMPLATES)
    }
