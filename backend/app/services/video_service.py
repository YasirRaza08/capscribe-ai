import json
import os
import subprocess
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings, THUMBNAILS_DIR
from app.models.schemas import VideoMetadata

class VideoService:
    @staticmethod
    def get_ffprobe_path() -> str:
        return settings.ffprobe_path

    @staticmethod
    def get_ffmpeg_path() -> str:
        return settings.ffmpeg_path

    @classmethod
    def probe_video(cls, file_path: str) -> VideoMetadata:
        """
        Runs ffprobe on the video file and returns structured VideoMetadata.
        Raises ValueError if file cannot be parsed or is corrupted.
        """
        ffprobe = cls.get_ffprobe_path()
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found at: {file_path}")

        cmd = [
            ffprobe,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            file_path
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(res.stdout)
        except subprocess.CalledProcessError as e:
            raise ValueError(f"FFprobe failed to inspect file. File may be corrupted or invalid: {e.stderr}")
        except json.JSONDecodeError:
            raise ValueError("Invalid metadata format returned by FFprobe.")

        streams = data.get("streams", [])
        fmt = data.get("format", {})

        video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

        if not video_stream:
            raise ValueError("No video stream found in uploaded media file.")

        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))

        # Duration detection
        duration = 0.0
        if "duration" in video_stream:
            try:
                duration = float(video_stream["duration"])
            except (ValueError, TypeError):
                pass
        if duration == 0.0 and "duration" in fmt:
            try:
                duration = float(fmt["duration"])
            except (ValueError, TypeError):
                pass

        # FPS calculation
        fps = 30.0
        r_frame_rate = video_stream.get("r_frame_rate", "30/1")
        if "/" in r_frame_rate:
            num, den = r_frame_rate.split("/")
            if float(den) > 0:
                fps = round(float(num) / float(den), 2)

        # Standard aspect ratio detection
        aspect_ratio = "16:9"
        if width > 0 and height > 0:
            ratio = width / height
            if 0.5 <= ratio <= 0.65:
                aspect_ratio = "9:16"
            elif 0.9 <= ratio <= 1.1:
                aspect_ratio = "1:1"
            elif 1.6 <= ratio <= 1.9:
                aspect_ratio = "16:9"
            elif 1.2 <= ratio <= 1.4:
                aspect_ratio = "4:3"
            else:
                aspect_ratio = f"{round(ratio, 2)}:1"

        file_size = int(fmt.get("size", os.path.getsize(file_path)))

        return VideoMetadata(
            duration=round(duration, 2),
            width=width,
            height=height,
            fps=fps,
            aspect_ratio=aspect_ratio,
            video_codec=video_stream.get("codec_name", ""),
            audio_codec=audio_stream.get("codec_name", "") if audio_stream else "none",
            file_size_bytes=file_size,
            has_audio=audio_stream is not None
        )

    @classmethod
    def generate_thumbnail(cls, video_path: str, project_id: str) -> str:
        """
        Extracts a single frame from the video at 1.0 second (or 0.0s) as a JPEG thumbnail.
        Returns the path to the thumbnail file.
        """
        ffmpeg = cls.get_ffmpeg_path()
        thumb_name = f"{project_id}_thumb.jpg"
        thumb_path = THUMBNAILS_DIR / thumb_name

        cmd = [
            ffmpeg,
            "-y",
            "-ss", "00:00:01",
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            "-vf", "scale=640:-1",
            str(thumb_path)
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return str(thumb_path)
        except Exception:
            # Fallback to start of video if 1.0s fails
            fallback_cmd = [
                ffmpeg, "-y", "-ss", "00:00:00", "-i", video_path,
                "-vframes", "1", "-q:v", "2", "-vf", "scale=640:-1", str(thumb_path)
            ]
            subprocess.run(fallback_cmd, capture_output=True)
            return str(thumb_path) if thumb_path.exists() else ""

    @classmethod
    def extract_audio(cls, video_path: str, output_wav_path: str, enhance: bool = False) -> str:
        """
        Extracts audio to 16kHz, 16-bit, mono WAV format optimal for Faster-Whisper.
        If enhance=True, applies highpass/lowpass filtering and loudness normalization.
        """
        ffmpeg = cls.get_ffmpeg_path()
        cmd = [
            ffmpeg,
            "-y",
            "-i", video_path,
            "-vn",
        ]
        if enhance:
            # Latency-free speech enhancement: clean low/high noise and boost speech level without lookahead buffer
            cmd.extend(["-af", "highpass=f=80,lowpass=f=7500,volume=1.3"])
        
        cmd.extend([
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_wav_path
        ])
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Audio extraction failed: {res.stderr}")
        return output_wav_path
