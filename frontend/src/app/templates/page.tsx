import Link from "next/link";
import { Sparkles, Palette, ArrowRight, Check } from "lucide-react";

export default function TemplatesPage() {
  const templates = [
    {
      id: "viral_beast",
      name: "Viral Beast",
      category: "Viral",
      desc: "High-energy yellow highlight on punchy bold text with dark heavy outline.",
      color: "#FFE600",
      font: "Montserrat",
      example: "THIS IS HOW YOU GO VIRAL",
      badge: "Most Popular"
    },
    {
      id: "hormozi_bold",
      name: "Hormozi Impact",
      category: "Viral",
      desc: "Alex Hormozi inspired neon green word pop with massive contrast.",
      color: "#22C55E",
      font: "Impact",
      example: "MAKE AN OFFER THEY CAN'T REFUSE",
      badge: "High Retention"
    },
    {
      id: "fire_flame",
      name: "Flame Ignition",
      category: "Viral",
      desc: "Electric orange and hot red gradient tones for intense high-retention clips.",
      color: "#FF4500",
      font: "Arial Black",
      example: "STOP SCROLLING RIGHT NOW",
      badge: "Urgent"
    },
    {
      id: "minimal_clean",
      name: "Minimal Clean",
      category: "Minimal",
      desc: "Crisp white modern typography with subtle soft shadow for clean aesthetic videos.",
      color: "#38BDF8",
      font: "Inter",
      example: "Simplicity is the ultimate sophistication",
      badge: "Aesthetic"
    },
    {
      id: "minimal_pill",
      name: "Frosted Pill",
      category: "Minimal",
      desc: "Elegant dark translucent pill container for maximum readability anywhere.",
      color: "#FBBF24",
      font: "Roboto",
      example: "Design is thinking made visual",
      badge: "High Contrast"
    },
    {
      id: "podcast_gold",
      name: "Podcast Studio Gold",
      category: "Podcast",
      desc: "Warm golden highlights on dark charcoal backplate built for dialogue clips.",
      color: "#F59E0B",
      font: "Poppins",
      example: "The biggest mistake most founders make",
      badge: "Interviews"
    },
    {
      id: "deep_talk",
      name: "Late Night Conversation",
      category: "Podcast",
      desc: "Intimate muted cyan typography tailored for interview discussions.",
      color: "#38BDF8",
      font: "Montserrat",
      example: "Tell me about the moment everything changed",
      badge: "Dialogue"
    },
    {
      id: "cyber_neon",
      name: "Cyberpunk Neon",
      category: "Gaming",
      desc: "Cyan and magenta electric neon glow designed for gaming streams and highlights.",
      color: "#00F0FF",
      font: "Impact",
      example: "INCOMING BOSS FIGHT — LOCK IN!",
      badge: "Gaming"
    },
    {
      id: "pixel_arcade",
      name: "Arcade 8-Bit",
      category: "Gaming",
      desc: "Retro arcade green on black badge for speedruns and gaming montages.",
      color: "#4ADE80",
      font: "Courier New",
      example: "STAGE COMPLETE: NEW HIGH SCORE!",
      badge: "Retro"
    },
    {
      id: "karaoke_bounce",
      name: "Karaoke Star Bounce",
      category: "Karaoke",
      desc: "Smooth fill animation highlighting each word exactly as it is sung or spoken.",
      color: "#A855F7",
      font: "Poppins",
      example: "Sing along to the rhythm of the beat",
      badge: "Karaoke"
    },
    {
      id: "karaoke_golden",
      name: "Gold Stage Karaoke",
      category: "Karaoke",
      desc: "Broadway gold progressive fill on pure white text.",
      color: "#FBBF24",
      font: "Montserrat",
      example: "Every single moment leads to this",
      badge: "Karaoke"
    },
    {
      id: "edu_highlight",
      name: "Masterclass Marker",
      category: "Educational",
      desc: "Fluorescent yellow marker highlight on dark structured background.",
      color: "#FEF08A",
      font: "Inter",
      example: "Notice how the system scales under load",
      badge: "Tutorials"
    },
    {
      id: "academy_clean",
      name: "Scholarly Clarity",
      category: "Educational",
      desc: "Crisp blue accents ideal for tutorials, coding breakdowns, and lectures.",
      color: "#38BDF8",
      font: "Roboto",
      example: "Step one: initialize the database connection",
      badge: "Coding"
    },
    {
      id: "cinema_classic",
      name: "Cinematic 2.39:1",
      category: "Cinematic",
      desc: "Traditional cinema yellow subtitle style seen in festival films and theatre.",
      color: "#FFFD54",
      font: "Arial",
      example: "He who opens a school door closes a prison",
      badge: "Film"
    },
    {
      id: "cinema_letterbox",
      name: "Noir Letterbox",
      category: "Cinematic",
      desc: "Sleek silver serif lettering for dramatic narrative storytelling.",
      color: "#E2E8F0",
      font: "Georgia",
      example: "Some secrets are best left in the shadows",
      badge: "Documentary"
    },
    {
      id: "bold_block",
      name: "Heavy Block Headline",
      category: "Bold",
      desc: "Massive red backdrop headline designed to command instant attention.",
      color: "#FACC15",
      font: "Impact",
      example: "THE SECRET NOBODY IS TELLING YOU",
      badge: "Headline"
    },
    {
      id: "neon_electric",
      name: "Electric Voltage",
      category: "Bold",
      desc: "Screaming lime-green glow on pure black outline.",
      color: "#CCFF00",
      font: "Montserrat",
      example: "WATCH TILL THE VERY END",
      badge: "Hook"
    },
    {
      id: "interview_focus",
      name: "Interview Focus",
      category: "Interview",
      desc: "Clean bottom banner with secondary color speaker distinction.",
      color: "#60A5FA",
      font: "Inter",
      example: "When we founded the company our thesis was simple",
      badge: "Keynote"
    },
    {
      id: "tiktok_pop",
      name: "TikTok Pop Bounce",
      category: "Social Media",
      desc: "Bubble-gum pink and cyan pop text loved by TikTok and Instagram Reels creators.",
      color: "#EC4899",
      font: "Montserrat",
      example: "Wait for the plot twist at 0:05",
      badge: "TikTok"
    },
    {
      id: "urdu_nastaliq_style",
      name: "Urdu & Roman Elegant",
      category: "Social Media",
      desc: "Optimized typography for Urdu, Roman Urdu, Hindi, and Arabic scripts.",
      color: "#10B981",
      font: "Arial",
      example: "Yeh video ap ki zindagi badal sakti hai",
      badge: "Multilingual"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
          Template Library
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          20 Production Caption Presets
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-400">
          Every template is customizable in the Studio Editor. Choose your favorite look and click below to start editing.
        </p>
      </div>

      {/* Grid of 20 Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-white text-base">{t.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[11px] font-medium border border-gray-700">
                  {t.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{t.desc}</p>

              {/* Visual Preview Box */}
              <div className="h-32 rounded-2xl bg-black/80 border border-gray-800/80 p-4 flex items-center justify-center text-center overflow-hidden">
                <span
                  className="font-extrabold tracking-wide uppercase transition-transform group-hover:scale-105"
                  style={{
                    fontFamily: t.font,
                    color: t.color,
                    textShadow: "2px 2px 0px #000000",
                    fontSize: "20px"
                  }}
                >
                  {t.example}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Category: {t.category}</span>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Use Preset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
