import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      q: "Is CapScribe AI completely free to run locally?",
      a: "Yes. The entire application runs on your local machine using Python, FastAPI, Faster-Whisper, SQLite, and FFmpeg. There are zero paid subscriptions, third-party API tokens, or credit cards required."
    },
    {
      q: "How does the Faster-Whisper transcription work?",
      a: "Faster-Whisper is a reimplementation of OpenAI's Whisper model using CTranslate2, an efficient inference engine for Transformer models. It is up to 4 times faster than OpenAI's standard Python implementation while using significantly less memory."
    },
    {
      q: "Are the video subtitles actually burned in or just a web preview?",
      a: "They are genuinely burned in! During export, our backend generates an Advanced SubStation Alpha (.ass) subtitle file and FFmpeg's libass filter burns the styled text, outlines, drop shadows, and karaoke highlights directly into the video pixels."
    },
    {
      q: "Can I download SRT or WebVTT files without rendering video?",
      a: "Yes! Every project generates verified SubRip (.srt) and WebVTT (.vtt) files which you can download with one click for use in software like Premiere Pro, DaVinci Resolve, or YouTube's caption manager."
    },
    {
      q: "How accurate is the Urdu and Roman Urdu transcription?",
      a: "Whisper recognizes standard Urdu with high phonetic accuracy. For Roman Urdu, our engine includes a transliteration utility that maps phonetic Urdu words into Roman English script for TikTok and Reels content creators."
    },
    {
      q: "What video formats can I upload?",
      a: "You can upload standard video formats including MP4, MOV, WebM, and MKV. Our server validates the file using FFprobe to detect duration, frame rate, and audio streams."
    },
    {
      q: "How does local development authentication work?",
      a: "In local development mode, a persistent dev user session is provided automatically. When ready for cloud deployment, the architecture has pre-configured adapters for Supabase Auth and PostgreSQL Row Level Security."
    },
    {
      q: "Can I customize the caption styling beyond the 20 presets?",
      a: "Yes. The Studio Editor gives you full granular control over font family, font size, primary text color, highlight color, outline width & color, drop shadow, background box, and vertical margin offsets."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Got Questions?
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base text-gray-400">
          Everything you need to know about CapScribe AI, local speech recognition, and video rendering.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 transition-colors"
          >
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed pl-7">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
