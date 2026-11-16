import { Project, CaptionTemplate, UserProfile, JobStatus, StyleSettings, CaptionSegment } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchUser(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error("Failed to load project");
  return res.json();
}

export async function updateProject(id: string, data: { title?: string; style?: StyleSettings; captions?: CaptionSegment[] }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to duplicate project");
  return res.json();
}

export async function fetchTemplates(): Promise<CaptionTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

export async function uploadVideo(file: File, title?: string, onProgress?: (pct: number) => void): Promise<{ project: Project }> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorData.detail || "Video upload failed");
  }

  return res.json();
}

export async function startTranscription(
  projectId: string,
  options?: {
    language?: string;
    writingScript?: string;
    romanUrdu?: boolean;
    enhanceAudio?: boolean;
    addEmojis?: boolean;
    modelSize?: string;
  }
): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: options?.language,
      writing_script: options?.writingScript,
      roman_urdu: options?.romanUrdu ?? false,
      enhance_audio: options?.enhanceAudio ?? false,
      add_emojis: options?.addEmojis ?? false,
      model_size: options?.modelSize || "base",
    }),
  });
  if (!res.ok) throw new Error("Failed to start transcription");
  return res.json();
}

export async function applyCaptionTool(
  projectId: string,
  action: "auto_emoji" | "remove_emoji" | "uppercase" | "lowercase" | "capitalize"
): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/caption-tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Failed to apply caption tool");
  return res.json();
}

export async function startExport(projectId: string, options: { resolution: string; aspect_ratio: string; burn_captions: boolean }): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error("Failed to start export");
  return res.json();
}

export async function pollJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/admin/stats`);
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}
