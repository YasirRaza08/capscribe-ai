import json
import sqlite3
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.core.config import DB_PATH, DATA_DIR
from app.models.schemas import Project, CaptionSegment, StyleSettings, VideoMetadata, UserProfile

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        original_video_name TEXT,
        video_path TEXT,
        video_url TEXT,
        thumbnail_path TEXT,
        thumbnail_url TEXT,
        metadata_json TEXT,
        captions_json TEXT,
        style_json TEXT,
        detected_language TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Jobs table (transcription and export)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        message TEXT,
        error TEXT,
        result_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        plan TEXT DEFAULT 'pro',
        credits_remaining INTEGER DEFAULT 150,
        storage_used_mb REAL DEFAULT 0.0,
        created_at TEXT NOT NULL
    )
    """)
    
    # Seed default dev user
    cursor.execute("SELECT id FROM users WHERE id = 'dev-user-001'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (id, email, full_name, plan, credits_remaining, storage_used_mb, created_at)
        VALUES ('dev-user-001', 'creator@capscribe.ai', 'Lead Creator', 'pro', 150, 15.0, ?)
        """, (datetime.utcnow().isoformat(),))
        
    conn.commit()
    conn.close()

# Project Helpers
def project_from_row(row: sqlite3.Row) -> Project:
    metadata_val = json.loads(row["metadata_json"]) if row["metadata_json"] else None
    captions_val = json.loads(row["captions_json"]) if row["captions_json"] else []
    style_val = json.loads(row["style_json"]) if row["style_json"] else StyleSettings().model_dump()
    
    return Project(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        status=row["status"],
        original_video_name=row["original_video_name"],
        video_path=row["video_path"],
        video_url=row["video_url"],
        thumbnail_path=row["thumbnail_path"],
        thumbnail_url=row["thumbnail_url"],
        metadata=VideoMetadata(**metadata_val) if metadata_val else None,
        captions=[CaptionSegment(**c) for c in captions_val],
        style=StyleSettings(**style_val),
        detected_language=row["detected_language"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"])
    )

def save_project(project: Project) -> Project:
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    project.updated_at = datetime.fromisoformat(now)
    
    cursor.execute("""
    INSERT INTO projects (
        id, user_id, title, status, original_video_name, video_path, video_url,
        thumbnail_path, thumbnail_url, metadata_json, captions_json, style_json,
        detected_language, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        status=excluded.status,
        original_video_name=excluded.original_video_name,
        video_path=excluded.video_path,
        video_url=excluded.video_url,
        thumbnail_path=excluded.thumbnail_path,
        thumbnail_url=excluded.thumbnail_url,
        metadata_json=excluded.metadata_json,
        captions_json=excluded.captions_json,
        style_json=excluded.style_json,
        detected_language=excluded.detected_language,
        updated_at=excluded.updated_at
    """, (
        project.id,
        project.user_id,
        project.title,
        project.status,
        project.original_video_name,
        project.video_path,
        project.video_url,
        project.thumbnail_path,
        project.thumbnail_url,
        json.dumps(project.metadata.model_dump()) if project.metadata else None,
        json.dumps([c.model_dump() for c in project.captions]),
        json.dumps(project.style.model_dump()),
        project.detected_language,
        project.created_at.isoformat(),
        now
    ))
    
    conn.commit()
    conn.close()
    return project

def get_project(project_id: str, user_id: Optional[str] = None) -> Optional[Project]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM projects WHERE id = ? AND (user_id = ? OR user_id = 'guest')", (project_id, user_id))
    else:
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return project_from_row(row)
    return None

def list_projects(user_id: Optional[str] = "guest") -> List[Project]:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id and user_id != "*":
        cursor.execute("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM projects ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [project_from_row(r) for r in rows]

def delete_project(project_id: str, user_id: Optional[str] = None) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("DELETE FROM projects WHERE id = ? AND (user_id = ? OR user_id = 'guest')", (project_id, user_id))
    else:
        cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def duplicate_project(project_id: str, user_id: str = "guest") -> Optional[Project]:
    original = get_project(project_id, user_id)
    if not original:
        return None
    
    new_id = f"proj_{uuid.uuid4().hex[:12]}"
    new_proj = original.model_copy(deep=True)
    new_proj.id = new_id
    new_proj.title = f"{original.title} (Copy)"
    new_proj.created_at = datetime.utcnow()
    new_proj.updated_at = datetime.utcnow()
    
    return save_project(new_proj)

# Jobs management
def save_job(job_id: str, project_id: str, job_type: str, status: str, progress: int = 0, message: str = "", error: Optional[str] = None, result: Optional[Dict] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO jobs (id, project_id, type, status, progress, message, error, result_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        progress=excluded.progress,
        message=excluded.message,
        error=excluded.error,
        result_json=excluded.result_json,
        updated_at=excluded.updated_at
    """, (
        job_id, project_id, job_type, status, progress, message, error,
        json.dumps(result) if result else None,
        now, now
    ))
    conn.commit()
    conn.close()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "project_id": row["project_id"],
        "type": row["type"],
        "status": row["status"],
        "progress": row["progress"],
        "message": row["message"],
        "error": row["error"],
        "result": json.loads(row["result_json"]) if row["result_json"] else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }

def get_user_profile(user_id: str = "dev-user-001") -> UserProfile:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) as total FROM projects WHERE user_id = ?", (user_id,))
    count_row = cursor.fetchone()
    total_projects = count_row["total"] if count_row else 0
    conn.close()
    
    if user_row:
        return UserProfile(
            id=user_row["id"],
            email=user_row["email"],
            full_name=user_row["full_name"],
            plan=user_row["plan"],
            credits_remaining=user_row["credits_remaining"],
            storage_used_mb=user_row["storage_used_mb"],
            total_projects=total_projects
        )
    return UserProfile(total_projects=total_projects)

# Generate Supabase Postgres Migration Script
def generate_supabase_schema_sql() -> str:
    return """-- ==========================================================
-- CapScribe AI (AI Video Studio) — Supabase PostgreSQL Schema
-- Migration with Row Level Security (RLS) policies
-- ==========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free',
    credits_remaining INTEGER DEFAULT 30,
    storage_used_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Project',
    status TEXT NOT NULL DEFAULT 'created',
    original_video_name TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB,
    captions JSONB DEFAULT '[]'::jsonb,
    style JSONB DEFAULT '{}'::jsonb,
    detected_language TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Processing Jobs Table
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- 'transcription' | 'export'
    status TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    message TEXT,
    error TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can only read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can CRUD their own projects"
    ON public.projects FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own jobs"
    ON public.processing_jobs FOR ALL
    USING (auth.uid() = user_id);
"""
