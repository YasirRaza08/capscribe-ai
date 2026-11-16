import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Zap,
  Subtitles,
  Smartphone,
  Languages,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Video,
  Download,
  Flame,
  Mic,
  Cpu,
  Layers,
  HelpCircle
} from "lucide-react";
import InteractiveLiveDemo from "@/components/InteractiveLiveDemo";

export default function HomePage() {
  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-blue-400" />,
      title: "Local Faster-Whisper AI",
      desc: "Powered by open-source Whisper running right on your machine. Instant speech-to-text without recurring third-party API costs or latency.",
    },
    {
      icon: <Subtitles className="w-6 h-6 text-amber-400" />,
      title: "Word-by-Word Timestamps",
      desc: "Every spoken syllable is timestamped with millisecond accuracy, enabling viral word highlights, pop effects, and karaoke bounces.",
    },
    {
      icon: <Flame className="w-6 h-6 text-pink-400" />,
      title: "20+ Viral Presets",
      desc: "Pre-configured styling used by top short-form creators. Choose from Viral Beast, Hormozi Impact, Cyber Neon, Gold Podcast, and more.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      title: "9:16, 16:9 & 1:1 Framing",
      desc: "Smart aspect ratio formatting for TikTok, Instagram Reels, YouTube Shorts, and widescreen videos with letterboxing or auto-crop.",
    },
    {
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      title: "Burned Subtitles with FFmpeg",
      desc: "Direct native video rendering using FFmpeg. Video files are compiled with styled ASS subtitles and verified with FFprobe before export.",
    },
    {
      icon: <Download className="w-6 h-6 text-cyan-400" />,
      title: "MP4, SRT & VTT Exports",
      desc: "Download the fully rendered MP4 video or export raw SRT/VTT subtitle files to use in Premiere Pro, DaVinci Resolve, or Final Cut.",
    },
  ];

  const templateHighlights = [
    { name: "Viral Beast", cat: "Shorts & Reels", color: "#FFE600", font: "Montserrat", words: "STOP SCROLLING NOW" },
    { name: "Hormozi Impact", cat: "Business & Value", color: "#22C55E", font: "Impact", words: "MAKE AN IRRESISTIBLE OFFER" },
    { name: "Podcast Gold", cat: "Longform & Dialogue", color: "#F59E0B", font: "Poppins", words: "The journey begins within" },
    { name: "Cyber Neon", cat: "Gaming & Tech", color: "#00F0FF", font: "Impact", words: "CRITICAL COMBO UNLOCKED" },
    { name: "Masterclass", cat: "Education & Guides", color: "#FEF08A", font: "Inter", words: "Notice how the system scales" },
    { name: "TikTok Pop", cat: "Viral Entertainment", color: "#EC4899", font: "Montserrat", words: "You won't believe what happened" },
  ];

  const languages = [
    { name: "English", code: "EN", badge: "Auto-detect" },
    { name: "Urdu", code: "UR", badge: "Nastaliq & Roman" },
    { name: "Hindi", code: "HI", badge: "Devanagari" },
    { name: "Punjabi", code: "PA", badge: "Gurmukhi & Shahmukhi" },
    { name: "Arabic", code: "AR", badge: "RTL Support" },
    { name: "Spanish", code: "ES", badge: "High Accuracy" },
    { name: "French", code: "FR", badge: "Supported" },
    { name: "German", code: "DE", badge: "Supported" },
  ];

  const steps = [
    {
      step: "01",
      title: "Upload Video",
      desc: "Drag and drop any MP4, MOV, or WebM clip. Our video probe instantly extracts duration, resolution, and audio channels.",
    },
    {
      step: "02",
      title: "Automatic AI Transcription",
      desc: "Faster-Whisper processes speech locally with word-level timestamps, automatic punctuation, and language detection.",
    },
    {
      step: "03",
      title: "Style & Fine-Tune",
      desc: "Choose from 20+ viral caption presets, adjust colors, outlines, font sizes, and edit individual words on the timeline.",
    },
    {
      step: "04",
      title: "Render & Download",
      desc: "FFmpeg burns your styled subtitles directly into the video file with real-time progress. Download your verified MP4, SRT, or VTT.",
    },
  ];

  const freeFeatures = [
    "Groq Whisper AI millisecond speech-to-text",
    "No login or registration required",
    "Zero subscription fees — 100% free forever",
    "All 30+ Viral creator caption styles",
    "Single-line mode & interactive size scaling",
    "Auto aspect-ratio adaptation (9:16, 16:9, 1:1)",
    "Word-by-word karaoke & pop highlights",
    "Native burned MP4 video rendering with FFmpeg",
    "Unlimited SRT and VTT subtitle file exports",
  ];

  const faqs = [
    {
      q: "Does this require any paid OpenAI or third-party AI API key?",
      a: "No! CapScribe AI is built on local open-source Faster-Whisper and CTranslate2. Speech recognition, language detection, and word timestamps run completely on your local machine with zero paid API calls.",
    },
    {
      q: "Are the captions genuinely burned into the video file?",
      a: "Yes. When you click Export, FFmpeg compiles an Advanced SubStation Alpha (.ass) subtitle file and burns it directly into the video stream with your chosen fonts, colors, and animations. The output is a real, standalone MP4 file.",
    },
    {
      q: "Can I edit individual words and timestamps?",
      a: "Absolutely. The studio editor provides word-level chip editing where you can fix spelling, split or merge subtitle segments, and adjust millisecond start and end times directly on the visual timeline.",
    },
    {
      q: "Does it support Urdu and Roman Urdu?",
      a: "Yes. The Whisper model recognizes Urdu and Hindi speech natively, and we also provide a phonetic Roman Urdu transliteration mode for content creators targeting youth social media audiences.",
    },
    {
      q: "What video formats and aspect ratios are supported?",
      a: "CapScribe accepts MP4, MOV, WebM, and MKV video files. You can export in original dimensions or format your video into 9:16 vertical (Shorts/Reels/TikTok), 16:9 widescreen, or 1:1 square.",
    },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open-Source Local AI Video Studio</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
            Turn Any Video Into Viral Content With{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Animated AI Captions
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Automatic speech recognition with Faster-Whisper, word-by-word karaoke highlights, 20+ creator presets, and native FFmpeg video rendering. No cloud API fees.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-violet-500 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5"
            >
              <Video className="w-5 h-5" />
              <span>Create Free Project Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/templates"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-6 py-3.5 text-base font-semibold text-gray-300 hover:text-white hover:bg-gray-800/80 transition-all"
            >
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Explore 20+ Templates</span>
            </Link>
          </div>

          {/* Feature checklist pill */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> $0 Budget Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real FFmpeg Rendering
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Word-Level Timestamps
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Mock Exports
            </span>
          </div>

          {/* 2. INTERACTIVE LIVE DEMO PREVIEW */}
          <div className="w-full max-w-5xl mt-16">
            <InteractiveLiveDemo />
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section className="w-full py-20 border-t border-gray-900 bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">Engineered For Creators</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Create Engaging Subtitles
            </p>
            <p className="mt-4 text-gray-400 text-sm sm:text-base">
              Real AI speech-to-text, real timing synchronization, and real FFmpeg rendering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-gray-700 transition-all hover:bg-gray-900/70 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-800/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TEMPLATE SHOWCASE SECTION */}
      <section className="w-full py-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Design System</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">20+ Production Caption Templates</p>
              <p className="mt-2 text-gray-400 text-sm">
                Each preset is crafted with unique typography, colors, borders, and animations.
              </p>
            </div>
            <Link
              href="/templates"
              className="mt-4 md:mt-0 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View all 20 presets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templateHighlights.map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-blue-500/50 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-gray-500 font-mono text-[11px]">{t.cat}</span>
                </div>

                {/* Subtitle simulation card */}
                <div className="h-28 rounded-xl bg-black/60 border border-gray-800/80 flex items-center justify-center p-3 text-center">
                  <span
                    className="font-extrabold tracking-wide uppercase group-hover:scale-105 transition-transform"
                    style={{
                      fontFamily: t.font,
                      color: t.color,
                      textShadow: "2px 2px 0px #000000",
                    }}
                  >
                    {t.words}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MULTILINGUAL SUPPORT */}
      <section className="w-full py-20 border-t border-gray-900 bg-gray-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Global Reach</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Transcribe In 90+ Languages</p>
            <p className="mt-3 text-sm text-gray-400">
              Automatic speech detection with dedicated support for Urdu, Roman Urdu, Hindi, Arabic, Punjabi, and English.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {languages.map((l, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 text-left hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-base">{l.name}</span>
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                    {l.code}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-medium">{l.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="w-full py-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Workflow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">From Raw Video To Export In 4 Steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 relative">
                <span className="text-4xl font-black text-gray-800 mb-3 block">{s.step}</span>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION - 100% FREE FOR EVERYONE */}
      <section className="w-full py-20 border-t border-gray-900 bg-gray-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">100% Free Forever</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">No Login. No Subscriptions. Full Free.</p>
            <p className="mt-3 text-sm text-gray-400">
              Zero paywalls or subscriptions. Unlimited speech transcription and FFmpeg video exports.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="p-8 sm:p-10 rounded-3xl border border-emerald-500/50 bg-gray-900/80 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/40">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Open For Everyone
                </span>
                <span className="text-xs text-gray-400 font-mono">No Credit Card</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-emerald-400 font-bold text-sm">/ forever free</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Start creating viral captions without signing in or paying a single dollar.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {freeFeatures.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-center text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-sm"
              >
                <span>Open Free Studio Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="w-full py-20 border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Questions & Answers</h2>
            <p className="text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="w-full py-20 border-t border-gray-900 bg-gradient-to-b from-gray-950 to-blue-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready To Create Viral Captioned Videos?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-xl mx-auto">
              Start editing right now on your machine. Real Faster-Whisper AI transcription, real word-level karaoke, and real FFmpeg rendering.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white text-gray-950 font-bold px-8 py-4 text-base shadow-xl hover:bg-gray-100 transition-transform active:scale-95"
              >
                <Wand2 className="w-5 h-5 text-blue-600" />
                <span>Launch Video Studio Now</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
