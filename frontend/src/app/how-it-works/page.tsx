import Link from "next/link";
import { UploadCloud, Wand2, Sliders, Film, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HowItWorksPage() {
  const workflow = [
    {
      step: "01",
      icon: <UploadCloud className="w-8 h-8 text-blue-400" />,
      title: "Step 1: Upload Your Video Clip",
      desc: "Drag and drop any raw video recording (MP4, MOV, WebM, MKV). FFprobe instantly extracts file metadata: frame rate, duration, pixel dimensions, and audio channels.",
      subpoints: ["Supports vertical (9:16) and horizontal (16:9)", "Handles up to 500MB video files locally", "Instant thumbnail generated for the project dashboard"]
    },
    {
      step: "02",
      icon: <Wand2 className="w-8 h-8 text-amber-400" />,
      title: "Step 2: AI Speech Recognition",
      desc: "Faster-Whisper extracts the audio track to 16kHz mono and performs deep speech recognition using CTranslate2. Language is detected automatically or chosen manually.",
      subpoints: ["Word-level timestamps with start & end milliseconds", "Intelligent chunking into 3-4 word viral subtitle cards", "Roman Urdu & Hindi transliteration support"]
    },
    {
      step: "03",
      icon: <Sliders className="w-8 h-8 text-purple-400" />,
      title: "Step 3: Studio Customization & Editing",
      desc: "Open the interactive Studio Editor. Pick one of 20+ viral caption styles (Hormozi, MrBeast, Cyberpunk, Podcast Gold), adjust font sizes, colors, and tweak any word on the timeline.",
      subpoints: ["Full interactive video preview with live overlay", "Edit individual words and millisecond boundaries", "Re-order, split, or merge subtitle segments with one click"]
    },
    {
      step: "04",
      icon: <Film className="w-8 h-8 text-emerald-400" />,
      title: "Step 4: Real FFmpeg Burning & Export",
      desc: "When satisfied, click Export. FFmpeg compiles an Advanced SubStation Alpha (.ass) subtitle file and burns it directly into the video stream with verified quality and aspect ratio.",
      subpoints: ["Real-time rendering progress parsed from FFmpeg stderr", "Output verified with FFprobe before download link is generated", "Download rendered MP4 or standalone SRT/VTT files"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          Step-by-Step Architecture
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          How CapScribe AI Works
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400">
          Discover how open-source AI and FFmpeg collaborate to produce viral, high-retention video captions in seconds.
        </p>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto">
        {workflow.map((item, idx) => (
          <div
            key={idx}
            className="p-8 sm:p-10 rounded-3xl bg-gray-900/40 border border-gray-800 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest block mb-1">
                {item.step}
              </span>
              <h2 className="text-2xl font-bold text-white mb-3">{item.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{item.desc}</p>
              
              <div className="space-y-2">
                {item.subpoints.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 text-base shadow-lg shadow-blue-500/25 transition-all"
        >
          <span>Try The Workflow Yourself</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
