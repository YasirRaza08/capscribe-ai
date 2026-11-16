export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  aspect_ratio: string;
  video_codec: string;
  audio_codec: string;
  file_size_bytes: number;
  has_audio: boolean;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

export interface StyleSettings {
  template_id: string;
  template_name: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  font_style?: "normal" | "italic";
  primary_color: string;
  highlight_color: string;
  secondary_color: string;
  outline_color: string;
  outline_width: number;
  shadow_color: string;
  shadow_offset: number;
  background_color: string;
  background_opacity: number;
  position: "top" | "middle" | "bottom";
  position_x_pct?: number;
  position_y_pct?: number;
  y_offset: number;
  alignment: "left" | "center" | "right";
  text_transform: "none" | "uppercase" | "lowercase" | "capitalize";
  animation_type:
    | "none"
    | "word_highlight"
    | "karaoke"
    | "pop"
    | "bounce_pop"
    | "neon_glow"
    | "box_highlight"
    | "slide_up"
    | "zoom_stamp"
    | "wiggle"
    | "fade"
    | "bouncy_drop"
    | "slide_down"
    | "slide_upward"
    | "bounce_left"
    | "bounce_right"
    | "slide_right"
    | "reveal"
    | "bouncy_reveal"
    | "wheel"
    | "fade_down"
    | "flicker"
    | "blur"
    | "hop";
  max_words_per_line: number;
}

export interface CaptionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_text: string;
  style: StyleSettings;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  status: "created" | "uploaded" | "transcribing" | "ready" | "rendering" | "error";
  original_video_name?: string;
  video_path?: string;
  video_url?: string;
  thumbnail_path?: string;
  thumbnail_url?: string;
  metadata?: VideoMetadata;
  captions: CaptionSegment[];
  style: StyleSettings;
  detected_language?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  plan: "free" | "pro" | "business";
  credits_remaining: number;
  storage_used_mb: number;
  total_projects: number;
}

export interface JobStatus {
  id: string;
  project_id: string;
  type: "transcription" | "export";
  status: "queued" | "processing" | "rendering" | "completed" | "failed";
  progress: number;
  message: string;
  error?: string;
  result?: {
    detected_language?: string;
    segments_count?: number;
    download_url?: string;
    srt_url?: string;
    vtt_url?: string;
    file_size_bytes?: number;
  };
}
