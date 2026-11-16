# CapScribe AI 🎬⚡
> **Professional AI Video Captioning & Subtitle Studio — 100% Free & Open-Source**

CapScribe AI is a full-featured video captioning and subtitling studio built for creators, editors, and agencies. Turn any raw video into high-retention, viral short-form content with millisecond-synchronized captions, animated word highlights, and native FFmpeg video burning.

**Zero Subscriptions • No Login Required • 100% Free Forever**

---

## ✨ Features

- **🚀 Ultra-Fast AI Speech Recognition:** Powered by Groq Whisper & local AI with millisecond word timestamps.
- **📱 Auto Aspect-Ratio Adaptation:** Automatically detects and optimizes framing for:
  - **9:16** Vertical (TikTok, Instagram Reels, YouTube Shorts)
  - **16:9** Widescreen (YouTube, Landscape)
  - **1:1** Square (Instagram Posts, Social)
- **🎯 1 Single Line Caption Mode:** Captions stay unified on one clean horizontal line without messy multi-line wrapping.
- **✨ 30+ Viral Caption Presets:** MrBeast, Alex Hormozi, Neon Glow, Cinematic, Badges & Boxes, and more.
- **🎛️ Interactive Drag & Scale:**
  - Direct 1-click `[-]` and `[+]` scale buttons on the video overlay
  - 4 corner resize handles + side width adjustments
  - Free drag-and-drop caption repositioning with snap guidelines
- **🎨 Sleek Professional Styling:** Crisp 1px outline stroke with subtle 3D shadow depth.
- **🔥 Real FFmpeg Subtitle Burning:** Native video compilation with styled Advanced SubStation Alpha (`.ass`) subtitles.
- **📥 Universal Exports:** Export burned MP4 video or download raw `.srt` and `.vtt` files.
- **🌐 Urdu & Roman Urdu:** Full support for Roman Urdu transliteration and English speech.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, TypeScript
- **Backend:** Python FastAPI, Uvicorn, SQLite, Groq API (Whisper-large-v3), Google Gemini 2.5 Flash
- **Video Engine:** Static FFmpeg & FFprobe portable pipeline

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- FFmpeg (portable static binaries included in `/bin` or installed on system PATH)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying Frontend to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CapScribe AI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Click **"Import Git Repository"** and select your GitHub repo.
   - In **Project Settings**:
     - **Root Directory:** select or type `frontend`
     - **Framework Preset:** `Next.js`
   - Click **Deploy**! 🚀

---

## 🔒 Privacy & Free Architecture

- No accounts, no email capture, and no login walls.
- Videos are processed locally or via direct high-speed Groq API.
- All 30+ templates and features are unlocked for all users.
