import { Project, CaptionTemplate, UserProfile, JobStatus, StyleSettings, CaptionSegment } from "@/types";

const API_BASE = "/api";

export function getClientId(): string {
  if (typeof window === "undefined") return "guest";
  let id = localStorage.getItem("capscribe_user_id");
  if (!id) {
    id = "usr_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem("capscribe_user_id", id);
  }
  return id;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "x-user-id": getClientId(),
    ...extra,
  };
}

export async function fetchUser(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load project");
  return res.json();
}

export async function updateProject(id: string, data: { title?: string; style?: StyleSettings; captions?: CaptionSegment[] }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}/duplicate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to duplicate project");
  return res.json();
}

export async function fetchTemplates(): Promise<CaptionTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error("Failed to load templates");
  return res.json();
}

export async function uploadVideo(
  file: File,
  title?: string,
  onProgress?: (pct: number) => void
): Promise<{ project: Project }> {
  // Use 2.5 MB chunks so every request is safely under Vercel's 4.5MB limit and Cloudflare's 100MB limit
  const CHUNK_SIZE = 2.5 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = "upl_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const sanitizedTitle = title || file.name.replace(/\.[^/.]+$/, "");

  for (let index = 0; index < totalChunks; index++) {
    const start = index * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunkBlob, file.name);
    formData.append("upload_id", uploadId);
    formData.append("chunk_index", index.toString());
    formData.append("total_chunks", totalChunks.toString());
    formData.append("filename", file.name);
    if (sanitizedTitle) formData.append("title", sanitizedTitle);

    let res: Response | null = null;
    let attempts = 0;
    while (attempts < 3) {
      try {
        res = await fetch(`${API_BASE}/upload/chunk`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        if (res.ok) break;
      } catch (e) {
        // network blip, retry after short pause
      }
      attempts++;
      if (attempts < 3) await new Promise((r) => setTimeout(r, 1000));
    }

    if (!res || !res.ok) {
      const errorData = res ? await res.json().catch(() => ({ detail: "Chunk upload failed" })) : { detail: "Network connection lost" };
      throw new Error(errorData.detail || `Upload failed on chunk ${index + 1}/${totalChunks}`);
    }

    if (onProgress) {
      const pct = Math.round(((index + 1) / totalChunks) * 100);
      onProgress(pct);
    }

    if (index === totalChunks - 1) {
      const data = await res.json();
      return { project: data.project };
    }
  }

  throw new Error("Upload ended unexpectedly");
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
    headers: authHeaders({ "Content-Type": "application/json" }),
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
  action: "auto_emoji" | "remove_emoji" | "uppercase" | "lowercase" | "capitalize" | "chunk_short" | "roman_urdu"
): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/caption-tools`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("Failed to apply caption tool");
  return res.json();
}

export async function startExport(projectId: string, options: { resolution: string; aspect_ratio: string; burn_captions: boolean }): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/export`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
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
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}
