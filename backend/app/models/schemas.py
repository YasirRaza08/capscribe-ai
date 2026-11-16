from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class VideoMetadata(BaseModel):
    duration: float = Field(0.0, description="Duration in seconds")
    width: int = Field(0, description="Width in pixels")
    height: int = Field(0, description="Height in pixels")
    fps: float = Field(30.0, description="Frames per second")
    aspect_ratio: str = Field("16:9", description="Standard aspect ratio (16:9, 9:16, 1:1)")
    video_codec: str = Field("", description="Video codec name")
    audio_codec: str = Field("", description="Audio codec name")
    file_size_bytes: int = Field(0, description="File size in bytes")
    has_audio: bool = Field(True, description="Whether audio stream exists")

class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float
    probability: float = 1.0

class CaptionSegment(BaseModel):
    id: str
    start: float
    end: float
    text: str
    words: List[WordTimestamp] = []

class StyleSettings(BaseModel):
    template_id: str = "viral_beast"
    template_name: str = "Viral Beast"
    font_family: str = "Montserrat"
    font_size: int = 24
    font_weight: str = "900"
    font_style: Literal["normal", "italic"] = "normal"
    primary_color: str = "#FFFFFF"
    highlight_color: str = "#FFE600"
    secondary_color: str = "#00F0FF"
    outline_color: str = "#000000"
    outline_width: int = 1
    shadow_color: str = "#000000"
    shadow_offset: int = 1
    background_color: str = "transparent"
    background_opacity: float = 0.0
    position: Literal["top", "middle", "bottom"] = "bottom"
    y_offset: int = 80
    position_x_pct: float = 50.0
    position_y_pct: float = 75.0
    alignment: Literal["left", "center", "right"] = "center"
    text_transform: Literal["none", "uppercase", "lowercase", "capitalize"] = "uppercase"
    animation_type: Literal[
        "none", "word_highlight", "karaoke", "pop", "bounce_pop",
        "neon_glow", "box_highlight", "slide_up", "zoom_stamp", "wiggle", "fade",
        "bouncy_drop", "slide_down", "slide_upward", "bounce_left", "bounce_right",
        "slide_right", "reveal", "bouncy_reveal", "wheel", "fade_down",
        "flicker", "blur", "hop"
    ] = "word_highlight"
    max_words_per_line: int = 4

class CaptionTemplate(BaseModel):
    id: str
    name: str
    category: str
    description: str
    preview_text: str
    style: StyleSettings

class ProjectBase(BaseModel):
    title: str = "Untitled Project"

class ProjectCreate(ProjectBase):
    video_filename: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    style: Optional[StyleSettings] = None
    captions: Optional[List[CaptionSegment]] = None

class Project(ProjectBase):
    id: str
    user_id: str = "dev-user-001"
    status: Literal["created", "uploaded", "transcribing", "ready", "rendering", "error"] = "created"
    original_video_name: Optional[str] = None
    video_path: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    captions: List[CaptionSegment] = []
    style: StyleSettings = Field(default_factory=StyleSettings)
    detected_language: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TranscriptionRequest(BaseModel):
    language: Optional[str] = None  # None for auto-detect, or 'en', 'ur', 'hi', 'ar', etc.
    writing_script: Optional[str] = "default"  # 'default', 'roman_urdu', 'nastaliq'
    roman_urdu: bool = False
    model_size: Optional[str] = "base"
    enhance_audio: bool = False
    add_emojis: bool = False

class TranscriptionJobStatus(BaseModel):
    job_id: str
    project_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: int = 0
    message: str = ""
    error: Optional[str] = None
    detected_language: Optional[str] = None
    segments_count: int = 0

class ExportRequest(BaseModel):
    resolution: Literal["original", "1080p", "720p", "480p"] = "original"
    aspect_ratio: Literal["original", "9:16", "16:9", "1:1"] = "original"
    burn_captions: bool = True
    format: Literal["mp4", "srt", "vtt"] = "mp4"

class CaptionToolRequest(BaseModel):
    action: Literal["auto_emoji", "remove_emoji", "uppercase", "lowercase", "capitalize", "chunk_short"]

class ExportJobStatus(BaseModel):
    job_id: str
    project_id: str
    status: Literal["queued", "rendering", "completed", "failed"]
    progress: int = 0
    message: str = ""
    error: Optional[str] = None
    output_video_url: Optional[str] = None
    srt_url: Optional[str] = None
    vtt_url: Optional[str] = None
    file_size_bytes: Optional[int] = None

class UserProfile(BaseModel):
    id: str = "dev-user-001"
    email: str = "creator@capscribe.ai"
    full_name: str = "Lead Creator"
    plan: Literal["free", "pro", "business"] = "pro"
    credits_remaining: int = 150
    storage_used_mb: float = 12.5
    total_projects: int = 0
