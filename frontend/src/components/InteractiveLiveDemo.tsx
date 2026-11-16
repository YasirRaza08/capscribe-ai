"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Sparkles, Smartphone, Monitor, Sliders, Palette } from "lucide-react";

interface DemoPreset {
  id: string;
  name: string;
  font: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  bgColor: string;
  bgOpacity: number;
  animType: "highlight" | "karaoke" | "fade";
  transform: "uppercase" | "none";
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "viral_beast",
    name: "Viral Beast",
    font: "Montserrat",
    fontSize: 38,
    textColor: "#FFFFFF",
    highlightColor: "#FFE600",
    outlineColor: "#000000",
    outlineWidth: 3,
    bgColor: "transparent",
    bgOpacity: 0,
    animType: "highlight",
    transform: "uppercase",
  },
  {
    id: "hormozi_bold",
    name: "Hormozi Impact",
    font: "Impact",
    fontSize: 42,
    textColor: "#FFFFFF",
    highlightColor: "#22C55E",
    outlineColor: "#000000",
    outlineWidth: 4,
    bgColor: "transparent",
    bgOpacity: 0,
    animType: "highlight",
    transform: "uppercase",
  },
  {
    id: "podcast_gold",
    name: "Podcast Studio",
    font: "Poppins",
    fontSize: 30,
    textColor: "#F1F5F9",
    highlightColor: "#F59E0B",
    outlineColor: "#0F172A",
    outlineWidth: 2,
    bgColor: "#1E293B",
    bgOpacity: 0.8,
    animType: "highlight",
    transform: "none",
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon",
    font: "Impact",
    fontSize: 38,
    textColor: "#00F0FF",
    highlightColor: "#FF007F",
    outlineColor: "#000000",
    outlineWidth: 3,
    bgColor: "transparent",
    bgOpacity: 0,
    animType: "highlight",
    transform: "uppercase",
  },
  {
    id: "minimal_clean",
    name: "Minimal Clean",
    font: "Inter",
    fontSize: 28,
    textColor: "#F8FAFC",
    highlightColor: "#38BDF8",
    outlineColor: "#000000",
    outlineWidth: 1,
    bgColor: "transparent",
    bgOpacity: 0,
    animType: "fade",
    transform: "none",
  },
  {
    id: "tiktok_pop",
    name: "TikTok Pop",
    font: "Montserrat",
    fontSize: 36,
    textColor: "#FFFFFF",
    highlightColor: "#EC4899",
    outlineColor: "#18181B",
    outlineWidth: 3,
    bgColor: "transparent",
    bgOpacity: 0,
    animType: "highlight",
    transform: "none",
  },
];

const DEMO_WORDS = [
  { word: "Turn", start: 0.0, end: 0.5 },
  { word: "your", start: 0.5, end: 0.8 },
  { word: "raw", start: 0.8, end: 1.2 },
  { word: "footage", start: 1.2, end: 1.8 },
  { word: "into", start: 1.8, end: 2.2 },
  { word: "viral", start: 2.2, end: 2.7 },
  { word: "high-retention", start: 2.7, end: 3.4 },
  { word: "reels", start: 3.4, end: 4.0 },
  { word: "automatically", start: 4.0, end: 4.8 },
  { word: "with", start: 4.8, end: 5.1 },
  { word: "AI", start: 5.1, end: 5.8 },
];

export default function InteractiveLiveDemo() {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(DEMO_PRESETS[0]);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0.0);
  const [fontSize, setFontSize] = useState<number>(selectedPreset.fontSize);
  const [position, setPosition] = useState<"bottom" | "middle" | "top">("bottom");

  // Timer loop for simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 6.0) return 0.0;
          return parseFloat((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeWordIndex = DEMO_WORDS.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  // Chunk current 3 words around active word
  const currentChunkStart = Math.floor(Math.max(activeWordIndex, 0) / 4) * 4;
  const currentWords = DEMO_WORDS.slice(currentChunkStart, currentChunkStart + 4);

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setFontSize(preset.fontSize);
  };

  return (
    <div className="w-full bg-gray-900/60 border border-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Left: Interactive Video Player Mockup */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4 self-start">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Live Interactive Preview
            </span>
            <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700">
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  aspectRatio === "9:16" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16
              </button>
              <button
                onClick={() => setAspectRatio("16:9")}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  aspectRatio === "16:9" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9
              </button>
            </div>
          </div>

          {/* Video Canvas Container */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border-2 border-gray-800 shadow-2xl flex items-center justify-center transition-all duration-300 ${
              aspectRatio === "9:16" ? "w-72 sm:w-80 h-[480px]" : "w-full max-w-lg h-[300px]"
            }`}
          >
            {/* Ambient Background Simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-purple-950/20 to-blue-950/40 animate-pulse pointer-events-none" />
            
            {/* Sound Wave Visualization in background */}
            <div className="absolute inset-x-0 bottom-16 flex items-center justify-center gap-1.5 opacity-20">
              {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 75, 55].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-blue-400 rounded-full transition-all duration-150"
                  style={{ height: `${isPlaying ? (h * ((currentTime * 10) % 5 + 2)) / 5 : 20}px` }}
                />
              ))}
            </div>

            {/* Captions Display Box */}
            <div
              className={`absolute inset-x-4 flex justify-center z-10 transition-all ${
                position === "bottom" ? "bottom-12" : position === "top" ? "top-12" : "top-1/2 -translate-y-1/2"
              }`}
            >
              <div
                className="px-4 py-2 rounded-xl text-center flex flex-wrap justify-center gap-x-2 gap-y-1 transition-all duration-150"
                style={{
                  backgroundColor:
                    selectedPreset.bgOpacity > 0
                      ? selectedPreset.bgColor
                      : "transparent",
                  fontFamily: selectedPreset.font,
                  fontSize: `${fontSize}px`,
                  fontWeight: 900,
                  textTransform: selectedPreset.transform,
                  WebkitTextStroke: `${selectedPreset.outlineWidth}px ${selectedPreset.outlineColor}`,
                  textShadow: `${selectedPreset.outlineWidth}px ${selectedPreset.outlineWidth}px 0px ${selectedPreset.outlineColor}`,
                }}
              >
                {currentWords.map((wObj, idx) => {
                  const isCurrentActive =
                    currentTime >= wObj.start && currentTime <= wObj.end;
                  return (
                    <span
                      key={idx}
                      className={`transition-all duration-100 ${
                        isCurrentActive ? "animate-pop-word scale-110" : ""
                      }`}
                      style={{
                        color: isCurrentActive
                          ? selectedPreset.highlightColor
                          : selectedPreset.textColor,
                      }}
                    >
                      {wObj.word}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Simulated Watermark */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400/80 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE SIMULATOR
            </div>
          </div>

          {/* Playback Controls */}
          <div className="w-full max-w-sm flex items-center justify-between gap-4 mt-4 px-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            {/* Time Scrubber */}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5.8"
                step="0.1"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-mono text-gray-400 w-12 text-right">
                {currentTime.toFixed(1)}s
              </span>
            </div>

            <button
              onClick={() => setCurrentTime(0.0)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Template Switcher & Live Controls */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-400" />
              Choose Viral Caption Styles
            </h3>
            <p className="text-sm text-gray-400">
              Select any preset below to instantly see how captions animate in real-time. Everything is rendered pixel-perfect into the final MP4.
            </p>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                      : "border-gray-800 bg-gray-800/40 hover:bg-gray-800/80 hover:border-gray-700"
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-1">{preset.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/50"
                      style={{ backgroundColor: preset.highlightColor }}
                    />
                    <span className="text-[10px] text-gray-400 font-mono">
                      {preset.font}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Customization Sliders */}
          <div className="space-y-4 pt-2 border-t border-gray-800">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" /> Font Size
                </span>
                <span className="text-blue-400 font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="52"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Position Selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">Vertical Position</span>
              <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                {(["bottom", "middle", "top"] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                      position === pos
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="pt-2">
            <a
              href="/dashboard"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
            >
              <span>Try on Your Own Video Free</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
