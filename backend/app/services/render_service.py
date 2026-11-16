import os
import re
import subprocess
import uuid
from pathlib import Path
from typing import Callable, List, Optional
from app.core.config import settings, RENDERS_DIR, SUBTITLES_DIR
from app.models.schemas import CaptionSegment, StyleSettings, VideoMetadata
from app.services.video_service import VideoService

def hex_to_ass_color(hex_color: str, opacity_pct: float = 1.0) -> str:
    """
    Converts #RRGGBB to ASS &HAABBGGRR format.
    Alpha in ASS is 00 (opaque) to FF (completely transparent).
    """
    clean_hex = hex_color.lstrip("#")
    if len(clean_hex) == 3:
        clean_hex = "".join(c * 2 for c in clean_hex)
    if len(clean_hex) != 6:
        clean_hex = "FFFFFF"

    r = clean_hex[0:2]
    g = clean_hex[2:4]
    b = clean_hex[4:6]

    alpha_int = int(round((1.0 - opacity_pct) * 255))
    alpha_hex = f"{alpha_int:02X}"

    # ASS order is AABBGGRR
    return f"&H{alpha_hex}{b}{g}{r}"

def format_ass_time(seconds: float) -> str:
    """
    Converts seconds to ASS timestamp format: H:MM:SS.cc (centiseconds)
    """
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{hrs}:{mins:02d}:{secs:02d}.{cs:02d}"

class RenderService:
    @classmethod
    def generate_ass_script(
        cls,
        segments: List[CaptionSegment],
        style: StyleSettings,
        video_width: int,
        video_height: int,
        output_ass_path: str
    ) -> str:
        """
        Generates an Advanced SubStation Alpha (.ass) subtitle file with word-by-word
        karaoke highlighting and custom typography.
        """
        # Scale font size relative to 1080p canvas
        from app.services.transcription_service import TranscriptionService
        segments = TranscriptionService.enforce_max_words_per_segment(
            segments,
            max_words=style.max_words_per_line or 3
        )
        base_canvas_h = max(video_height, 720)
        scale_factor = base_canvas_h / 1080.0
        font_size = max(int(style.font_size * scale_factor), 18)
        outline_w = max(int(style.outline_width * scale_factor), 1)
        shadow_offset = max(int(style.shadow_offset * scale_factor), 0)
        margin_v = max(int(style.y_offset * scale_factor), 30)

        primary_color_ass = hex_to_ass_color(style.primary_color, 1.0)
        secondary_color_ass = hex_to_ass_color(style.secondary_color, 1.0)
        highlight_color_ass = hex_to_ass_color(style.highlight_color, 1.0)
        outline_color_ass = hex_to_ass_color(style.outline_color, 1.0)
        shadow_color_ass = hex_to_ass_color(style.shadow_color, 0.8)

        # Alignment tag
        alignment = 2  # Bottom-center
        if style.position == "top":
            alignment = 8
        elif style.position == "middle":
            alignment = 5

        # BorderStyle: 1 = outline + drop shadow, 3 = opaque bounding box
        border_style = 1
        back_color_ass = shadow_color_ass
        if style.background_color and style.background_color != "transparent" and style.background_opacity > 0.1:
            border_style = 3
            back_color_ass = hex_to_ass_color(style.background_color, style.background_opacity)

        bold_flag = -1 if int(style.font_weight) >= 700 else 0
        italic_flag = -1 if getattr(style, "font_style", "normal") == "italic" else 0

        header = f"""[Script Info]
Title: CapScribe AI Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: {video_width}
PlayResY: {video_height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{style.font_family},{font_size},{primary_color_ass},{highlight_color_ass},{outline_color_ass},{back_color_ass},{bold_flag},{italic_flag},0,0,100,100,0,0,{border_style},{outline_w},{shadow_offset},{alignment},20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        events = []
        # Calculate pixel coordinates for exact placement matching the frontend drag canvas
        pos_x_pct = style.position_x_pct if style.position_x_pct is not None else 50.0
        pos_y_pct = style.position_y_pct if style.position_y_pct is not None else 75.0
        pos_x = int(video_width * (pos_x_pct / 100.0))
        pos_y = int(video_height * (pos_y_pct / 100.0))
        pos_tag = f"{{\\an5\\pos({pos_x},{pos_y})}}"

        for seg in segments:
            start_str = format_ass_time(seg.start)
            end_str = format_ass_time(seg.end)

            # Apply text transform
            display_text = seg.text
            if style.text_transform == "uppercase":
                display_text = display_text.upper()
            elif style.text_transform == "lowercase":
                display_text = display_text.lower()
            elif style.text_transform == "capitalize":
                display_text = display_text.title()

            # Word-level highlight / karaoke / pop animations
            animated_types = [
                "word_highlight", "karaoke", "pop", "bounce_pop",
                "neon_glow", "box_highlight", "slide_up", "zoom_stamp", "wiggle",
                "bouncy_drop", "slide_down", "slide_upward", "bounce_left", "bounce_right",
                "slide_right", "reveal", "bouncy_reveal", "wheel", "fade_down",
                "flicker", "blur", "hop"
            ]
            if style.animation_type in animated_types and seg.words:
                dialogue_text = ""
                for w in seg.words:
                    word_duration_cs = max(int(round((w.end - w.start) * 100)), 1)
                    w_str = w.word
                    if style.text_transform == "uppercase":
                        w_str = w_str.upper()
                    elif style.text_transform == "lowercase":
                        w_str = w_str.lower()
                    
                    if style.animation_type == "karaoke":
                        # Smooth karaoke fill tag \kf
                        dialogue_text += f"{{\\kf{word_duration_cs}}}{w_str} "
                    else:
                        # Pop highlight tag \k
                        dialogue_text += f"{{\\k{word_duration_cs}}}{w_str} "
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{pos_tag}{dialogue_text.strip()}")
            else:
                events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{pos_tag}{display_text}")

        full_ass = header + "\n".join(events) + "\n"
        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(full_ass)

        return output_ass_path

    @classmethod
    def render_video(
        cls,
        input_video_path: str,
        segments: List[CaptionSegment],
        style: StyleSettings,
        resolution: str = "original",
        aspect_ratio: str = "original",
        burn_captions: bool = True,
        on_progress: Optional[Callable[[int, str], None]] = None
    ) -> str:
        """
        Burns captions into the video file using FFmpeg, tracks real rendering progress,
        and verifies final MP4 file with FFprobe before returning.
        """
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video not found: {input_video_path}")

        meta = VideoService.probe_video(input_video_path)
        total_duration = meta.duration if meta.duration > 0 else 1.0

        # Determine target resolution
        target_w, target_h = meta.width, meta.height
        if resolution == "1080p":
            if aspect_ratio == "9:16":
                target_w, target_h = 1080, 1920
            else:
                target_w, target_h = 1920, 1080
        elif resolution == "720p":
            if aspect_ratio == "9:16":
                target_w, target_h = 720, 1280
            else:
                target_w, target_h = 1280, 720
        elif resolution == "480p":
            if aspect_ratio == "9:16":
                target_w, target_h = 480, 854
            else:
                target_w, target_h = 854, 480

        # Handle aspect ratio cropping/padding
        vf_filters = []
        if aspect_ratio == "9:16" and meta.aspect_ratio != "9:16":
            vf_filters.append("crop=ih*(9/16):ih,scale=1080:1920")
            target_w, target_h = 1080, 1920
        elif aspect_ratio == "16:9" and meta.aspect_ratio != "16:9":
            vf_filters.append("crop=iw:iw*(9/16),scale=1920:1080")
            target_w, target_h = 1920, 1080
        elif aspect_ratio == "1:1" and meta.aspect_ratio != "1:1":
            vf_filters.append("crop=min(iw\\,ih):min(iw\\,ih),scale=1080:1080")
            target_w, target_h = 1080, 1080

        # Subtitles filter
        export_id = uuid.uuid4().hex[:10]
        ass_path = SUBTITLES_DIR / f"{export_id}.ass"
        output_mp4_path = RENDERS_DIR / f"render_{export_id}.mp4"

        if burn_captions and segments:
            cls.generate_ass_script(segments, style, target_w, target_h, str(ass_path))
            # Format path for FFmpeg subtitles filter: escape colons and backslashes
            escaped_ass = str(ass_path).replace("\\", "/").replace(":", "\\:")
            vf_filters.append(f"subtitles='{escaped_ass}'")

        ffmpeg = settings.ffmpeg_path
        cmd = [ffmpeg, "-y", "-i", input_video_path]

        if vf_filters:
            cmd.extend(["-vf", ",".join(vf_filters)])

        cmd.extend([
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(output_mp4_path)
        ])

        if on_progress:
            on_progress(10, "Initializing video encoding engine...")

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            encoding="utf-8",
            errors="replace"
        )

        # Parse FFmpeg stderr for time=00:00:00.00
        time_pattern = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")
        last_pct = 10

        while True:
            line = process.stderr.readline()
            if not line and process.poll() is not None:
                break
            if line:
                match = time_pattern.search(line)
                if match:
                    hrs, mins, secs = match.groups()
                    current_seconds = int(hrs) * 3600 + int(mins) * 60 + float(secs)
                    pct = min(int((current_seconds / total_duration) * 85) + 10, 95)
                    if pct > last_pct:
                        last_pct = pct
                        if on_progress:
                            on_progress(pct, f"Rendering video frame: {int(current_seconds)}s / {int(total_duration)}s ({pct}%)")

        retcode = process.poll()
        if retcode != 0:
            stderr_out = process.stderr.read()
            raise RuntimeError(f"FFmpeg render process failed with exit code {retcode}: {stderr_out}")

        # Final verification with FFprobe
        if not output_mp4_path.exists() or output_mp4_path.stat().st_size == 0:
            raise RuntimeError("Render failed: Output video file was not generated or is empty.")

        # Inspect generated output
        verified_meta = VideoService.probe_video(str(output_mp4_path))
        if verified_meta.duration <= 0:
            raise RuntimeError("Render validation failed: Output video duration is zero.")

        if on_progress:
            on_progress(100, "Rendering completed and verified successfully!")

        return str(output_mp4_path)
