import Link from "next/link";
import { Cpu, Subtitles, Flame, Smartphone, Layers, Download, Mic, Languages, Shield, CheckCircle2, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  const deepFeatures = [
    {
      title: "Faster-Whisper AI Transcription",
      category: "Speech Recognition",
      desc: "Uses state-of-the-art CTranslate2 Whisper implementation running locally. Provides 4x faster execution than vanilla PyTorch models with minimal memory footprint and zero external API dependencies.",
      icon: <Cpu className="w-6 h-6 text-blue-400" />,
      points: [
        "Automatic language identification across 90+ spoken languages",
        "Manual language override for specialized accents",
        "Beam search decoding with hallucination suppression",
        "VAD and punctuation restoration built-in"
      ]
    },
    {
      title: "Word-Level Timestamp Precision",
      category: "Timing & Sync",
      desc: "Whisper's cross-attention weights extract millisecond start and end boundaries for each spoken word, allowing pinpoint visual highlights.",
      icon: <Subtitles className="w-6 h-6 text-amber-400" />,
      points: [
        "Start and end timestamps down to 10 milliseconds",
        "Confidence score tracking per word",
        "Smart sentence boundary grouping for short-form pacing",
        "Adjustable max words per card (2 to 6 words)"
      ]
    },
    {
      title: "20+ Professional Caption Presets",
      category: "Visual Styling",
      desc: "Designed to match the high-retention formats of MrBeast, Alex Hormozi, viral TikTok podcasters, and YouTube Shorts creators.",
      icon: <Flame className="w-6 h-6 text-pink-400" />,
      points: [
        "Heavy bold stroke outlines and drop shadows",
        "High-contrast color pairings (Electric Yellow, Neon Green, Cyan, Magenta)",
        "Translucent frosted backplates and bounding boxes",
        "Uppercase and capitalization transforms"
      ]
    },
    {
      title: "Multi-Ratio Video Formatting",
      category: "Aspect Ratio",
      desc: "Repurpose widescreen horizontal videos into 9:16 vertical shorts, 1:1 square feeds, or keep native aspect ratios without distortion.",
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      points: [
        "9:16 Portrait for TikTok, Instagram Reels, and YouTube Shorts",
        "16:9 Landscape for YouTube, Vimeo, and TV",
        "1:1 Square for LinkedIn, Facebook, and Instagram feeds",
        "Center crop or letterbox scaling modes"
      ]
    },
    {
      title: "Native ASS Subtitle Rendering",
      category: "Video Processing",
      desc: "Generates Advanced SubStation Alpha (.ass) scripts burned directly into the video stream with FFmpeg libass filter.",
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      points: [
        "Dynamic font scaling proportional to target resolution",
        "Smooth karaoke highlight \\kf tags",
        "Pop highlight \\k tags with bouncy transitions",
        "Accurate vertical margin offsets"
      ]
    },
    {
      title: "Raw Subtitle & Video Export",
      category: "Export & Delivery",
      desc: "Get rendered MP4 videos or export standalone SRT and WebVTT files for use in professional NLEs like Premiere Pro and DaVinci Resolve.",
      icon: <Download className="w-6 h-6 text-cyan-400" />,
      points: [
        "H.264 / AAC MP4 video container",
        "Standard SubRip (.srt) subtitle format",
        "HTML5 WebVTT (.vtt) caption format",
        "FFprobe verification before download delivery"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Complete Feature Overview
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          Engineered for Real Production Video Editing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400">
          Every capability is built into the application with genuine AI and video rendering tools. No mock dashboards, no simulated progress, and no missing features.
        </p>
      </div>

      {/* Deep Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {deepFeatures.map((item, idx) => (
          <div
            key={idx}
            className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-xs font-mono text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-md">
                  {item.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">{item.desc}</p>
              
              <ul className="space-y-2.5 text-sm text-gray-300">
                {item.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to test these features?</h2>
        <p className="mt-2 text-gray-400 text-sm max-w-xl mx-auto">
          Upload any video file on your dashboard to see Whisper AI and FFmpeg work in real-time.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            <span>Open Studio Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
