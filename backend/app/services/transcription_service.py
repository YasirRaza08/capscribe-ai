import os
import uuid
import re
import gc
import json
import math
import base64
import subprocess
import urllib.request
from pathlib import Path
from typing import List, Tuple, Optional, Callable

# Limit thread count to prevent memory spike / mkl_malloc crashes on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"

from faster_whisper import WhisperModel
from app.core.config import settings, SUBTITLES_DIR
from app.models.schemas import CaptionSegment, WordTimestamp

# Urdu to Roman Urdu transliteration dictionary for common words and phonetic rules
URDU_TO_ROMAN_MAP = {
    "آپ": "Aap", "کیا": "kya", "ہے": "hai", "ہیں": "hain", "یہ": "yeh", "وہ": "woh",
    "کا": "ka", "کی": "ki", "کے": "ke", "کو": "ko", "سے": "se", "میں": "mein",
    "نہیں": "nahi", "ہاں": "haan", "تھا": "tha", "تھی": "thi", "تھے": "the",
    "کر": "kar", "کرنا": "karna", "رہا": "raha", "رہی": "rahi", "رہے": "rahe",
    "بہت": "bohat", "اچھا": "acha", "اچھی": "achi", "ویڈیو": "video", "بات": "baat",
    "کیسے": "kaise", "کیوں": "kyun", "کب": "kab", "کہاں": "kahan", "کون": "kaun",
    "لیکن": "lekin", "اور": "aur", "اگر": "agar", "تو": "to", "بھی": "bhi",
    "زندگی": "zindagi", "کام": "kaam", "وقت": "waqt", "دن": "din", "رات": "raat",
    "سب": "sab", "کچھ": "kuch", "لوگ": "log", "دل": "dil", "ساتھ": "saath"
}

# Smart AI / Keyword Emoji Enrichment Map (similar to Kalakar viral subtitles)
EMOJI_KEYWORD_MAP = {
    # Finance / Money
    "money": "💰", "dollar": "💵", "dollars": "💵", "cash": "💸", "rich": "🤑", "million": "💸",
    "billion": "💰", "expensive": "💎", "paid": "💳", "pay": "💳", "cost": "🏷️",
    # Vehicles
    "car": "🚗", "cars": "🏎️", "door": "🚪", "doors": "🚪", "drive": "🚘", "truck": "🛻",
    # Action / Excitement
    "fire": "🔥", "hot": "🔥", "flame": "🔥", "winner": "🏆", "win": "🏆", "wins": "🏆",
    "trophy": "🏆", "danger": "⚠️", "dangerous": "⚠️", "escape": "🏃", "room": "🚪",
    "spikes": "📍", "kill": "💀", "dead": "💀", "die": "☠️", "trap": "🪤", "insane": "🤯",
    "crazy": "🤪", "shocking": "😱", "wow": "✨", "omg": "😲",
    # Emotions
    "love": "❤️", "heart": "💖", "happy": "😊", "sad": "😢", "cry": "😭", "laugh": "😂",
    "funny": "🤣", "smile": "😁", "angry": "😡",
    # Power & Achievement
    "king": "👑", "queen": "👑", "crown": "👑", "strong": "💪", "gym": "🏋️", "muscle": "💪",
    "power": "⚡", "lightning": "⚡", "magic": "🪄", "star": "⭐", "rocket": "🚀",
    # Tech & Media
    "phone": "📱", "mobile": "📱", "video": "🎥", "camera": "📷", "youtube": "▶️", "tiktok": "🎵",
    # Time
    "time": "⏰", "hour": "⏳", "hours": "⏳", "minute": "⏱️", "clock": "🕒", "wait": "⏳",
    # Food & Fun
    "food": "🍔", "pizza": "🍕", "eat": "🍴", "coffee": "☕", "party": "🎉", "music": "🎶",
    # Mind & Logic
    "idea": "💡", "think": "🤔", "brain": "🧠", "secret": "🤫", "yes": "✅", "no": "❌",
    "100": "💯", "percent": "💯", "target": "🎯", "success": "🚀"
}

def auto_emoji_word(word: str) -> str:
    clean = re.sub(r'[^\w$]', '', word).lower()
    if clean.startswith('$') and len(clean) > 1:
        return f"{word} 💵"
    if clean in EMOJI_KEYWORD_MAP:
        return f"{word} {EMOJI_KEYWORD_MAP[clean]}"
    return word

def enrich_segments_with_emojis(segments: List[CaptionSegment]) -> List[CaptionSegment]:
    enriched = []
    for s in segments:
        new_words = []
        for w in s.words:
            dec = auto_emoji_word(w.word)
            new_words.append(WordTimestamp(
                word=dec,
                start=w.start,
                end=w.end,
                probability=w.probability
            ))
        new_text = " ".join(w.word for w in new_words)
        enriched.append(CaptionSegment(
            id=s.id,
            start=s.start,
            end=s.end,
            text=new_text,
            words=new_words
        ))
    return enriched

def remove_emojis_from_segments(segments: List[CaptionSegment]) -> List[CaptionSegment]:
    emoji_pattern = re.compile(
        "[\U00010000-\U0010ffff\u2600-\u26ff\u2700-\u27bf\u2300-\u23ff\u2b50-\u2b55]",
        flags=re.UNICODE
    )
    cleaned = []
    for s in segments:
        new_words = []
        for w in s.words:
            c_word = emoji_pattern.sub("", w.word).strip()
            new_words.append(WordTimestamp(
                word=c_word or w.word,
                start=w.start,
                end=w.end,
                probability=w.probability
            ))
        new_text = " ".join(w.word for w in new_words)
        cleaned.append(CaptionSegment(
            id=s.id,
            start=s.start,
            end=s.end,
            text=new_text,
            words=new_words
        ))
    return cleaned

def convert_segments_to_roman_urdu_gemini(segments: List[CaptionSegment], api_key: str, model_name: str = "gemini-3.5-flash") -> List[CaptionSegment]:
    """
    Uses Gemini AI to intelligently convert transcribed lines into 100% natural,
    native creator-grade Roman Urdu (e.g. 'Yeh hai woh...', 'Bohot saare logon ne...'),
    preserving pure English words while accurately phoneticizing mixed Urdu/Hindi speech.
    """
    import urllib.request
    import json

    if not segments:
        return segments

    batch_size = 25
    converted_segments = list(segments)
    candidate_models = [model_name, "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-3.8-flash"]
    # Remove duplicates preserving order
    candidate_models = list(dict.fromkeys(candidate_models))

    for i in range(0, len(segments), batch_size):
        chunk = segments[i:i + batch_size]
        original_lines = [s.text for s in chunk]

        prompt = """You are an expert verbatim subtitle transliterator and editor.
The input lines were transcribed from a video where the speaker talks in Urdu/Hindi mixed with English.

CRITICAL TASK:
Convert every line into 100% clean, creator-grade ROMAN URDU (Latin alphabet, e.g. 'Agar Carry Minati ke sath Ajaz Khan ne mall mein...'):
1. STRICT RULE: Output MUST use 100% English / Latin alphabet. ZERO Devanagari (हिन्दी) or Arabic/Urdu (اردو) characters are allowed. Transliterate all non-Latin text into natural Roman Urdu.
2. NEVER translate Urdu/Hindi speech into English. If the speaker said 'bilkul durust', write 'bilkul durust' (do NOT translate to 'absolutely right').
3. DO NOT alter numbers, names, or words (e.g., 'Carry Minati', 'Ajaz Khan', 'Harsh Beniwal', '17 saal ka larka').
4. Retain genuine English words exactly as English (e.g. 'opinion', 'analysis', 'hospital', 'interview', 'police station').
5. Keep the EXACT same number of lines as input.
6. Output MUST be a valid JSON array of strings matching the input length.

Input lines:
""" + json.dumps(original_lines, ensure_ascii=False)

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        }

        success = False
        for current_model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={api_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                res = urllib.request.urlopen(req, timeout=30)
                data = json.loads(res.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if not candidates:
                    continue
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    continue
                raw_text = parts[0].get("text", "").strip()
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                    raw_text = re.sub(r"\s*```$", "", raw_text)
                romanized_lines = json.loads(raw_text)

                if isinstance(romanized_lines, list) and len(romanized_lines) == len(chunk):
                    for idx, roman_line in enumerate(romanized_lines):
                        seg_idx = i + idx
                        orig_seg = converted_segments[seg_idx]
                        
                        # Split words and distribute timing
                        words = roman_line.split()
                        if not words:
                            words = [roman_line]
                        
                        seg_dur = orig_seg.end - orig_seg.start
                        dur_per_w = seg_dur / max(len(words), 1)

                        new_words = []
                        for w_i, w_str in enumerate(words):
                            w_start = round(orig_seg.start + (w_i * dur_per_w), 2)
                            w_end = round(w_start + dur_per_w, 2)
                            new_words.append(WordTimestamp(
                                word=w_str,
                                start=w_start,
                                end=w_end,
                                probability=0.98
                            ))

                        converted_segments[seg_idx] = CaptionSegment(
                            id=orig_seg.id,
                            start=orig_seg.start,
                            end=orig_seg.end,
                            text=roman_line,
                            words=new_words
                        )
                    success = True
                    break
            except Exception as e:
                print(f"[Gemini Roman Urdu] Model {current_model} error on batch {i}: {e}")
                continue

        if not success:
            print(f"[Gemini Roman Urdu] Retained original segments for batch {i}")

    return converted_segments

class TranscriptionService:
    _model_cache: dict = {}

    @classmethod
    def get_model(cls, model_size: str = "base") -> WhisperModel:
        if model_size not in cls._model_cache:
            device = settings.WHISPER_DEVICE
            compute_type = settings.WHISPER_COMPUTE_TYPE
            gc.collect()
            cls._model_cache[model_size] = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
                cpu_threads=2
            )
        return cls._model_cache[model_size]

    @classmethod
    def transcribe_with_groq_whisper(
        cls,
        audio_path: str,
        language: Optional[str] = None,
        writing_script: Optional[str] = "roman_urdu",
        max_words_per_segment: int = 4,
        on_progress: Optional[Callable[[int, str], None]] = None
    ) -> Optional[Tuple[str, List[CaptionSegment]]]:
        """
        Ultra-fast Whisper-Large-V3 cloud transcription using Groq API.
        Extracts verbatim dialogue with word timestamps in 1-2 seconds.
        """
        groq_key = settings.GROQ_API_KEY
        if not groq_key:
            return None

        ffmpeg = settings.ffmpeg_path
        temp_dir = Path(audio_path).parent
        temp_mp3 = temp_dir / f"groq_{uuid.uuid4().hex[:8]}.mp3"

        if on_progress:
            on_progress(20, "Extracting audio stream for Groq Whisper...")

        try:
            # Compress audio to high-quality 32k mono mp3 (under 25MB for any social media video)
            subprocess.run([
                ffmpeg, "-y",
                "-i", audio_path,
                "-vn", "-ar", "16000", "-ac", "1", "-b:a", "32k",
                str(temp_mp3)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            if on_progress:
                on_progress(45, "Running Groq Whisper-Large-V3 AI engine...")

            boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
            with open(temp_mp3, "rb") as f:
                file_bytes = f.read()

            parts = []
            def add_field(name, val):
                parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n".encode("utf-8"))

            add_field("model", "whisper-large-v3-turbo")
            add_field("response_format", "verbose_json")
            add_field("timestamp_granularities[]", "word")
            add_field("timestamp_granularities[]", "segment")
            if language and language != "auto":
                add_field("language", language)

            # Guiding prompt for Roman Urdu and viral video dialogue
            prompt_guide = "Carry Minati, Ajaz Khan, Harsh Beniwal, hospital, analysis, opinion, TikTok, Reels, viral video dialogue"
            add_field("prompt", prompt_guide)

            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"audio.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode("utf-8"))
            parts.append(file_bytes)
            parts.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

            body = b"".join(parts)
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }

            req = urllib.request.Request("https://api.groq.com/openai/v1/audio/transcriptions", data=body, headers=headers)
            res = urllib.request.urlopen(req, timeout=60)
            data = json.loads(res.read().decode("utf-8"))

            if on_progress:
                on_progress(65, "Forming viral subtitle cards & word sync...")

            words_data = data.get("words", [])
            detected_lang = data.get("language", "ur")
            if detected_lang in ["hi", "ur", "pa"]:
                detected_lang = "ur"

            if not words_data:
                segments_data = data.get("segments", [])
                words_data = []
                for s in segments_data:
                    s_text = s.get("text", "").strip()
                    s_words = s_text.split()
                    if s_words:
                        dur = (s.get("end", 0) - s.get("start", 0)) / max(len(s_words), 1)
                        for w_i, w_t in enumerate(s_words):
                            words_data.append({
                                "word": w_t,
                                "start": round(s.get("start", 0) + w_i * dur, 2),
                                "end": round(s.get("start", 0) + (w_i + 1) * dur, 2)
                            })

            if not words_data:
                return None

            # Group words into punchy short cards (2 to 4 words per segment, natural pauses)
            segments: List[CaptionSegment] = []
            curr_words: List[dict] = []

            for w in words_data:
                w_str = str(w.get("word", "")).strip()
                if not w_str:
                    continue
                w_start = round(float(w.get("start", 0)), 2)
                w_end = round(float(w.get("end", 0)), 2)

                if curr_words:
                    pause = w_start - curr_words[-1]["end"]
                    if len(curr_words) >= max_words_per_segment or pause > 0.55:
                        seg_text = " ".join(cw["word"] for cw in curr_words)
                        seg_words = [
                            WordTimestamp(word=cw["word"], start=cw["start"], end=cw["end"], probability=0.99)
                            for cw in curr_words
                        ]
                        segments.append(CaptionSegment(
                            id=f"seg_{uuid.uuid4().hex[:8]}",
                            start=curr_words[0]["start"],
                            end=curr_words[-1]["end"],
                            text=seg_text,
                            words=seg_words
                        ))
                        curr_words = []

                curr_words.append({"word": w_str, "start": w_start, "end": w_end})

            if curr_words:
                seg_text = " ".join(cw["word"] for cw in curr_words)
                seg_words = [
                    WordTimestamp(word=cw["word"], start=cw["start"], end=cw["end"], probability=0.99)
                    for cw in curr_words
                ]
                segments.append(CaptionSegment(
                    id=f"seg_{uuid.uuid4().hex[:8]}",
                    start=curr_words[0]["start"],
                    end=curr_words[-1]["end"],
                    text=seg_text,
                    words=seg_words
                ))

            # Transliterate to Roman Urdu if requested
            if (writing_script == "roman_urdu" or (detected_lang in ["ur", "hi"] and writing_script in ["roman_urdu", "latin", "default", None])) and settings.GEMINI_API_KEY:
                if on_progress:
                    on_progress(82, "Polishing verbatim Roman Urdu formatting...")
                segments = convert_segments_to_roman_urdu_gemini(
                    segments,
                    api_key=settings.GEMINI_API_KEY,
                    model_name="gemini-3.5-flash-lite"
                )

            return detected_lang, segments

        except Exception as e:
            print(f"[Groq Whisper] Error: {e}")
            return None
        finally:
            if temp_mp3.exists():
                try:
                    os.remove(temp_mp3)
                except OSError:
                    pass

    @classmethod
    def transcribe_with_gemini_audio(
        cls,
        audio_path: str,
        language: Optional[str] = None,
        writing_script: Optional[str] = "roman_urdu",
        on_progress: Optional[Callable[[int, str], None]] = None
    ) -> Optional[Tuple[str, List[CaptionSegment]]]:
        """
        Direct multimodal audio transcription using Gemini AI.
        Slices audio into 20-second sample-accurate chunks with automatic rate-limit backoff,
        retries, and dynamic script prompting for 100% autonomous verbatim transcription.
        """
        import urllib.error
        import time

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        ffmpeg = settings.ffmpeg_path
        ffprobe = settings.ffprobe_path
        
        # Get audio duration using ffprobe
        probe_cmd = [ffprobe, "-v", "quiet", "-print_format", "json", "-show_format", audio_path]
        try:
            res = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
            meta = json.loads(res.stdout)
            total_duration = float(meta.get("format", {}).get("duration", 0))
        except Exception:
            total_duration = 60.0

        if total_duration <= 0:
            return None

        chunk_len = 20.0
        # Priority models: gemini-3.5-flash-lite has high quota, followed by 3.5-flash, 3-flash-preview
        candidate_models = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"]
        all_segments: List[CaptionSegment] = []

        total_chunks = int(math.ceil(total_duration / chunk_len))
        temp_dir = Path(audio_path).parent

        # Dynamic script instruction
        if writing_script == "roman_urdu" or (language in ["ur", "hi", "pa", "auto", None] and writing_script in ["roman_urdu", "latin", "default", None]):
            script_instruction = (
                "Write the transcription in clean, authentic ROMAN URDU (Latin English alphabet) "
                "mixed with genuine English words (the exact words spoken by the person). "
                "NEVER translate Urdu/Hindi words into English (e.g. if speaker says 'bilkul durust', write 'bilkul durust', NOT 'absolutely right'). "
                "Preserve numbers and words verbatim (e.g. '17 saal ka larka', '18 mahine ki bachi')."
            )
            detected_lang = "ur"
        elif writing_script == "nastaliq":
            script_instruction = "Write the transcription in standard Urdu script (اردو Nastaliq/Arabic alphabet) verbatim."
            detected_lang = "ur"
        elif writing_script == "devanagari":
            script_instruction = "Write the transcription in standard Hindi script (हिन्दी Devanagari alphabet) verbatim."
            detected_lang = "hi"
        elif language == "en":
            script_instruction = "Write the transcription in English exactly as spoken by the speaker verbatim."
            detected_lang = "en"
        else:
            script_instruction = (
                "Transcribe EXACTLY in the language and script spoken by the speaker in the video. "
                "If Roman Urdu or Hindi mixed with English, use Roman Urdu Latin alphabet. "
                "Do NOT translate any words."
            )
            detected_lang = language or "en"

        prompt = f"""You are a master subtitle generator for viral social media videos (Reels, TikTok, Shorts).
TASK:
Listen to this audio chunk carefully.
Transcribe EXACTLY what the speaker says, word for word, without missing, inventing, or translating any words.
{script_instruction}

CRITICAL RULES:
1. Divide the speech into short subtitle cards of 2 to 4 words.
2. Provide word timestamps for each word.
3. Start and end timestamps must be relative to this chunk (0.0 to chunk duration).
4. Every single word in the output must match the speaker's actual spoken audio.
5. Never hallucinate words not present in the audio.

Return valid JSON:
[
  {{
    "start": 0.0,
    "end": 1.4,
    "text": "short caption phrase",
    "words": [
      {{"word": "word1", "start": 0.0, "end": 0.7}},
      {{"word": "word2", "start": 0.7, "end": 1.4}}
    ]
  }}
]"""

        for chunk_idx in range(total_chunks):
            start_sec = chunk_idx * chunk_len
            dur_sec = min(chunk_len, total_duration - start_sec)
            if dur_sec <= 0.5:
                continue

            pct = min(int(15 + (chunk_idx / total_chunks) * 75), 90)
            if on_progress:
                on_progress(pct, f"Gemini verbatim transcribing: {int(start_sec)}s / {int(total_duration)}s ({pct}%)")

            chunk_mp3 = temp_dir / f"gemini_chunk_{uuid.uuid4().hex[:8]}.mp3"
            # Crucial: -i MUST be before -ss for sample-exact audio slicing without keyframe snapping
            slice_cmd = [
                ffmpeg, "-y",
                "-i", audio_path,
                "-ss", str(start_sec),
                "-t", str(dur_sec),
                "-vn", "-ar", "16000", "-ac", "1", "-b:a", "32k",
                str(chunk_mp3)
            ]
            try:
                subprocess.run(slice_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                with open(chunk_mp3, "rb") as f:
                    audio_b64 = base64.b64encode(f.read()).decode("utf-8")
            except Exception as e:
                print(f"[Gemini Audio] Slice error at {start_sec}s: {e}")
                continue
            finally:
                if chunk_mp3.exists():
                    try:
                        os.remove(chunk_mp3)
                    except OSError:
                        pass

            payload = {
                "contents": [{"parts": [{"text": prompt}, {"inlineData": {"mimeType": "audio/mp3", "data": audio_b64}}]}],
                "generationConfig": {"responseMimeType": "application/json"},
                "safetySettings": [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
                ]
            }

            chunk_success = False
            backoff_delays = [2.0, 4.0, 7.0, 10.0]
            for model_name in candidate_models:
                # Retries with exponential backoff for rate limits / spikes
                for attempt in range(len(backoff_delays)):
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    try:
                        req = urllib.request.Request(
                            url,
                            data=json.dumps(payload).encode("utf-8"),
                            headers={"Content-Type": "application/json"}
                        )
                        res = urllib.request.urlopen(req, timeout=45)
                        data = json.loads(res.read().decode("utf-8"))
                        candidates = data.get("candidates", [])
                        if not candidates:
                            break
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if not parts:
                            break
                        raw_text = parts[0].get("text", "").strip()
                        if raw_text.startswith("```"):
                            raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                            raw_text = re.sub(r"\s*```$", "", raw_text)
                        chunk_segs = json.loads(raw_text)

                        if isinstance(chunk_segs, list):
                            for s in chunk_segs:
                                seg_start = round(start_sec + float(s.get("start", 0)), 2)
                                seg_end = round(start_sec + float(s.get("end", 0)), 2)
                                seg_text = s.get("text", "").strip()
                                words_data = s.get("words", [])
                                words = []
                                for w in words_data:
                                    w_start = round(start_sec + float(w.get("start", 0)), 2)
                                    w_end = round(start_sec + float(w.get("end", 0)), 2)
                                    words.append(WordTimestamp(
                                        word=str(w.get("word", "")).strip(),
                                        start=w_start,
                                        end=w_end,
                                        probability=0.99
                                    ))
                                if not words and seg_text:
                                    w_list = seg_text.split()
                                    dur_per_w = (seg_end - seg_start) / max(len(w_list), 1)
                                    for w_i, w_str in enumerate(w_list):
                                        words.append(WordTimestamp(
                                            word=w_str,
                                            start=round(seg_start + w_i * dur_per_w, 2),
                                            end=round(seg_start + (w_i + 1) * dur_per_w, 2),
                                            probability=0.98
                                        ))
                                all_segments.append(CaptionSegment(
                                    id=f"seg_{uuid.uuid4().hex[:8]}",
                                    start=seg_start,
                                    end=seg_end,
                                    text=seg_text,
                                    words=words
                                ))
                            chunk_success = True
                            break
                    except urllib.error.HTTPError as he:
                        if he.code in (429, 503):
                            delay = backoff_delays[attempt]
                            print(f"[Gemini Audio] Busy / rate-limited ({he.code}) on {model_name}, sleeping {delay}s (attempt {attempt+1}/{len(backoff_delays)})")
                            time.sleep(delay)
                            continue
                        else:
                            print(f"[Gemini Audio] HTTP {he.code} on {model_name}: {he}")
                            break
                    except Exception as e:
                        print(f"[Gemini Audio] Error on {model_name} (attempt {attempt+1}/{len(backoff_delays)}): {e}")
                        time.sleep(2.0)
                        continue

                if chunk_success:
                    # Polite sleep between successful chunks to comfortably stay under 15 RPM
                    time.sleep(1.0)
                    break

            if not chunk_success:
                print(f"[Gemini Direct Audio] Chunk {chunk_idx} failed across all candidate models.")

        if all_segments:
            all_segments.sort(key=lambda x: (x.start, x.end))
            # Clean up any chunk boundary overlaps and ensure strictly monotonic flow
            cleaned_segments: List[CaptionSegment] = []
            for seg in all_segments:
                if not seg.text.strip():
                    continue
                if cleaned_segments:
                    prev = cleaned_segments[-1]
                    if seg.start < prev.end:
                        if seg.text.strip().lower() == prev.text.strip().lower():
                            continue  # Duplicate sentence detected across chunk cut
                        if seg.end > prev.end + 0.2:
                            seg.start = round(prev.end + 0.05, 2)
                            # Re-distribute words timing if needed
                            if seg.words:
                                dur_per_w = (seg.end - seg.start) / max(len(seg.words), 1)
                                for w_i, w in enumerate(seg.words):
                                    w.start = round(seg.start + w_i * dur_per_w, 2)
                                    w.end = round(seg.start + (w_i + 1) * dur_per_w, 2)
                        else:
                            continue  # Subsumed within previous segment
                cleaned_segments.append(seg)

            return detected_lang, cleaned_segments
        return None

    @classmethod
    def transcribe(
        cls,
        audio_path: str,
        language: Optional[str] = None,
        writing_script: Optional[str] = "default",
        model_size: str = "base",
        roman_urdu: bool = False,
        add_emojis: bool = False,
        max_words_per_segment: int = 4,
        on_progress: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[str, List[CaptionSegment]]:
        """
        Transcribes audio with word-level timestamps and chunks words into viral-style short segments.
        Uses Gemini multimodal audio directly for 100% verbatim accuracy,
        falling back to Faster-Whisper if offline.
        Returns: (detected_language, List[CaptionSegment])
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Resolve script
        effective_script = "roman_urdu" if (roman_urdu or writing_script == "roman_urdu") else (writing_script or "default")

        # Tier 1 Engine: Groq Whisper-Large-V3 (Super Fast ~1.5s, 100% Free Cloud)
        if settings.GROQ_API_KEY:
            try:
                groq_result = cls.transcribe_with_groq_whisper(
                    audio_path=audio_path,
                    language=language,
                    writing_script=effective_script,
                    max_words_per_segment=max_words_per_segment,
                    on_progress=on_progress
                )
                if groq_result and len(groq_result[1]) > 0:
                    detected_lang, segments = groq_result
                    if add_emojis:
                        segments = enrich_segments_with_emojis(segments)
                    return detected_lang, segments
            except Exception as e:
                print(f"[Groq Whisper Tier 1] Fallback to Gemini: {e}")

        # Tier 2 Engine: Gemini Direct Audio (Multimodal verbatim dialogue)
        if (effective_script == "roman_urdu" or language in ["ur", "hi", "pa", "auto", None]) and settings.GEMINI_API_KEY:
            try:
                gemini_result = cls.transcribe_with_gemini_audio(
                    audio_path=audio_path,
                    language=language,
                    writing_script=effective_script,
                    on_progress=on_progress
                )
                if gemini_result and len(gemini_result[1]) > 0:
                    detected_lang, segments = gemini_result
                    if add_emojis:
                        segments = enrich_segments_with_emojis(segments)
                    return detected_lang, segments
            except Exception as e:
                print(f"[Gemini Direct Audio] Fallback to Whisper: {e}")

        # Fallback engine: Faster-Whisper
        model = cls.get_model(model_size)

        initial_prompt = None
        if roman_urdu or (language in ["ur", "hi", "pa", "auto", None]):
            initial_prompt = (
                "Yeh video Roman Urdu aur English mein hai. Subtitles Roman Urdu aur English mein likhein. "
                "Har lafz wahi likhein jo speaker bol raha hai. Do not translate Urdu words into English. "
                "Spoken words: 17 saal ka larka, bachi, rape, analysis, opinion, bilkul durust, issue, hospital, psychology."
            )

        # Transcribe with word timestamps
        segments_generator, info = model.transcribe(
            audio_path,
            language=language if language and language != "auto" else None,
            initial_prompt=initial_prompt,
            word_timestamps=True,
            beam_size=1,
            temperature=0.0,
            condition_on_previous_text=False,
            vad_filter=False
        )

        detected_language = info.language
        total_duration = info.duration if info.duration > 0 else 1.0
        raw_segments = []
        last_reported_pct = 40
        for s in segments_generator:
            raw_segments.append(s)
            if on_progress:
                current_pct = min(int(40 + (s.end / total_duration) * 45), 85)
                if current_pct > last_reported_pct + 4:
                    last_reported_pct = current_pct
                    on_progress(current_pct, f"Transcribing audio: {int(s.end)}s / {int(total_duration)}s ({current_pct}%)")

        if not raw_segments:
            return detected_language, []

        all_words: List[WordTimestamp] = []
        for s in raw_segments:
            if s.words:
                for w in s.words:
                    word_text = w.word.strip()
                    if word_text:
                        all_words.append(WordTimestamp(
                            word=word_text,
                            start=round(w.start, 2),
                            end=round(w.end, 2),
                            probability=round(w.probability, 2)
                        ))
            else:
                # If word-level is empty for a segment, split segment text
                words = s.text.strip().split()
                if words:
                    duration_per_word = (s.end - s.start) / max(len(words), 1)
                    for i, w in enumerate(words):
                        w_text = w
                        w_start = s.start + (i * duration_per_word)
                        w_end = w_start + duration_per_word
                        all_words.append(WordTimestamp(
                            word=w_text,
                            start=round(w_start, 2),
                            end=round(w_end, 2),
                            probability=0.9
                        ))

        # Chunk words into viral short subtitle cards (2 to max_words_per_segment words)
        final_segments: List[CaptionSegment] = []
        if not all_words:
            return detected_language, []

        current_chunk: List[WordTimestamp] = []
        for word_obj in all_words:
            current_chunk.append(word_obj)
            # Break on punctuation or when chunk size reached
            has_punctuation = any(p in word_obj.word for p in [".", "?", "!", "۔", "،", ","])
            if len(current_chunk) >= max_words_per_segment or (has_punctuation and len(current_chunk) >= 2):
                seg_id = f"seg_{uuid.uuid4().hex[:8]}"
                seg_text = " ".join(w.word for w in current_chunk)
                final_segments.append(CaptionSegment(
                    id=seg_id,
                    start=current_chunk[0].start,
                    end=current_chunk[-1].end,
                    text=seg_text,
                    words=list(current_chunk)
                ))
                current_chunk = []

        if current_chunk:
            seg_id = f"seg_{uuid.uuid4().hex[:8]}"
            seg_text = " ".join(w.word for w in current_chunk)
            final_segments.append(CaptionSegment(
                id=seg_id,
                start=current_chunk[0].start,
                end=current_chunk[-1].end,
                text=seg_text,
                words=list(current_chunk)
            ))

        if roman_urdu:
            if on_progress:
                on_progress(90, "Transliterating and polishing Roman Urdu with Gemini AI...")
            if settings.GEMINI_API_KEY:
                final_segments = convert_segments_to_roman_urdu_gemini(
                    final_segments,
                    api_key=settings.GEMINI_API_KEY,
                    model_name=settings.GEMINI_MODEL or "gemini-3.8-flash"
                )

        if add_emojis:
            final_segments = enrich_segments_with_emojis(final_segments)

        return detected_language, final_segments

    @staticmethod
    def generate_srt(segments: List[CaptionSegment], output_path: str) -> str:
        """
        Exports segments to SubRip (.srt) format.
        """
        def format_srt_time(seconds: float) -> str:
            hrs = int(seconds // 3600)
            mins = int((seconds % 3600) // 60)
            secs = int(seconds % 60)
            millis = int(round((seconds - int(seconds)) * 1000))
            return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

        lines = []
        for idx, seg in enumerate(segments, start=1):
            lines.append(str(idx))
            lines.append(f"{format_srt_time(seg.start)} --> {format_srt_time(seg.end)}")
            lines.append(seg.text)
            lines.append("")

        content = "\n".join(lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return output_path

    @staticmethod
    def enrich_with_emojis(segments: List[CaptionSegment]) -> List[CaptionSegment]:
        return enrich_segments_with_emojis(segments)

    @staticmethod
    def remove_emojis(segments: List[CaptionSegment]) -> List[CaptionSegment]:
        return remove_emojis_from_segments(segments)

    @staticmethod
    def generate_vtt(segments: List[CaptionSegment], output_path: str) -> str:
        """
        Exports segments to WebVTT (.vtt) format.
        """
        def format_vtt_time(seconds: float) -> str:
            hrs = int(seconds // 3600)
            mins = int((seconds % 3600) // 60)
            secs = int(seconds % 60)
            millis = int(round((seconds - int(seconds)) * 1000))
            return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"

        lines = ["WEBVTT", ""]
        for idx, seg in enumerate(segments, start=1):
            lines.append(str(idx))
            lines.append(f"{format_vtt_time(seg.start)} --> {format_vtt_time(seg.end)}")
            lines.append(seg.text)
            lines.append("")

        content = "\n".join(lines)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        return output_path

    @staticmethod
    def enrich_with_emojis(segments: List[CaptionSegment]) -> List[CaptionSegment]:
        return enrich_segments_with_emojis(segments)

    @staticmethod
    def remove_emojis(segments: List[CaptionSegment]) -> List[CaptionSegment]:
        return remove_emojis_from_segments(segments)
