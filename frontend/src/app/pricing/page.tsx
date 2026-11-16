import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const freeFeatures = [
    "100% Free speech-to-text with Groq Whisper & local AI",
    "No login or account creation required — open & use instantly",
    "Zero subscription fees, no credit card, no hidden paywalls",
    "Unlimited video uploads in any ratio (9:16, 16:9, 1:1)",
    "All 30+ Creator & Viral Caption Templates included",
    "Single-line caption mode with interactive font scaling",
    "Word-by-word karaoke & pop highlights",
    "FFmpeg native burned MP4 video rendering",
    "Unlimited SRT and VTT subtitle file exports",
    "Full privacy — direct local processing",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          100% Free & Open For Everyone
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          No Subscriptions. No Login. Full Free.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400">
          CapScribe AI is completely free for all creators worldwide. No credits, no tier limits, no sign-in barriers.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl border border-emerald-500/60 bg-gray-900/80 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                Free Forever Plan
              </span>
              <span className="text-xs text-gray-400 font-mono">No Credit Card Needed</span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-emerald-400 font-bold">/ forever free</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Complete video captioning studio with professional viral styling and FFmpeg rendering.
            </p>

            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-center text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group text-base"
          >
            <span>Launch Free Studio Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
