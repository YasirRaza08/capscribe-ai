"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Sparkles,
  Download,
  Save,
  CheckCircle2,
  Sliders,
  Type,
  Palette,
  Layout,
  Clock,
  Plus,
  Trash2,
  Split,
  Merge,
  Smartphone,
  Monitor,
  Square,
  Wand2,
  Languages,
  Film,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FileText,
  Search,
  Shield,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  ChevronDown,
  Check,
  Move,
  ArrowUp,
  ArrowDown,
  X,
  Zap
} from "lucide-react";
import {
  fetchProject,
  updateProject,
  fetchTemplates,
  startTranscription,
  startExport,
  pollJob,
  applyCaptionTool
} from "@/lib/api";
import { Project, CaptionSegment, StyleSettings, CaptionTemplate, WordTimestamp } from "@/types";
import { formatTime, formatDuration, formatBytes } from "@/lib/utils";

function autoChunkCaptions(captions: CaptionSegment[], maxWords: number = 3): CaptionSegment[] {
  if (!captions) return [];
  const result: CaptionSegment[] = [];
  const limit = Math.max(1, maxWords);
  for (const seg of captions) {
    const words = seg.words && seg.words.length > 0 ? seg.words : null;
    if (!words) {
      const rawWords = seg.text.trim().split(/\s+/).filter(Boolean);
      if (rawWords.length <= limit) {
        result.push(seg);
        continue;
      }
      const durPerWord = (seg.end - seg.start) / Math.max(rawWords.length, 1);
      const generatedWords: WordTimestamp[] = rawWords.map((rw, i) => ({
        word: rw,
        start: Number((seg.start + i * durPerWord).toFixed(2)),
        end: Number((seg.start + (i + 1) * durPerWord).toFixed(2)),
        probability: 0.99,
      }));
      for (let i = 0; i < generatedWords.length; i += limit) {
        const slice = generatedWords.slice(i, i + limit);
        result.push({
          id: `seg_${Math.random().toString(36).substring(2, 10)}`,
          start: slice[0].start,
          end: slice[slice.length - 1].end,
          text: slice.map((w) => w.word).join(" "),
          words: slice,
        });
      }
      continue;
    }

    if (words.length <= limit) {
      result.push(seg);
      continue;
    }

    for (let i = 0; i < words.length; i += limit) {
      const slice = words.slice(i, i + limit);
      if (slice.length > 0) {
        result.push({
          id: `seg_${Math.random().toString(36).substring(2, 10)}`,
          start: slice[0].start,
          end: slice[slice.length - 1].end,
          text: slice.map((w) => w.word).join(" "),
          words: slice,
        });
      }
    }
  }
  return result;
}

export default function StudioEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<CaptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Video Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasBoxRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<Project | null>(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatioMode, setAspectRatioMode] = useState<"original" | "9:16" | "16:9" | "1:1">("original");

  // Drag and drop text positioning state
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [initialStylePos, setInitialStylePos] = useState({ x: 50.0, y: 75.0 });
  const [isHoveringText, setIsHoveringText] = useState(false);
  const [snapXGuideline, setSnapXGuideline] = useState(false);
  const [snapYGuideline, setSnapYGuideline] = useState(false);

  // Interactive text box resizing state (Mouse cursor drag handles)
  const [isResizingText, setIsResizingText] = useState(false);
  const [resizeHandleType, setResizeHandleType] = useState<"se" | "sw" | "ne" | "nw" | "e" | "w" | null>(null);
  const [resizeStartMouse, setResizeStartMouse] = useState({ x: 0, y: 0 });
  const [initialFontSize, setInitialFontSize] = useState(28);
  const [initialBoxWidthPct, setInitialBoxWidthPct] = useState(88);
  const [customBoxWidthPct, setCustomBoxWidthPct] = useState<number | null>(null);
  const [singleLineMode, setSingleLineMode] = useState<boolean>(true);

  // Competition UI Features
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [timelineMode, setTimelineMode] = useState<"WORD" | "LINE">("LINE");
  const [captionSearch, setCaptionSearch] = useState("");
  const [isCaptionToolsOpen, setIsCaptionToolsOpen] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"captions" | "presets">("captions");
  const [activeRightTab, setActiveRightTab] = useState<"edit" | "style">("edit");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<number>(1);

  // Prepare Media Modal State
  const [isPrepareMediaOpen, setIsPrepareMediaOpen] = useState(false);
  const [spokenLang, setSpokenLang] = useState("auto");
  const [writingScript, setWritingScript] = useState("roman_urdu");
  const [enhanceAudio, setEnhanceAudio] = useState(false);
  const [addEmojis, setAddEmojis] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeJobId, setTranscribeJobId] = useState<string | null>(null);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeMsg, setTranscribeMsg] = useState("");

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRes, setExportRes] = useState<"original" | "1080p" | "720p" | "480p">("original");
  const [exportBurn, setExportBurn] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState("");
  const [exportResult, setExportResult] = useState<any>(null);

  // Load project & templates
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [proj, tpls] = await Promise.all([
          fetchProject(projectId),
          fetchTemplates().catch(() => []),
        ]);
        let finalProj = proj;
        const maxWordsAllowed = proj.style?.max_words_per_line || 3;
        const hasLongSegment = proj.captions?.some((c) => (c.words?.length || 0) > maxWordsAllowed || c.text.trim().split(/\s+/).length > maxWordsAllowed);
        if (hasLongSegment) {
          const chunked = autoChunkCaptions(proj.captions, maxWordsAllowed);
          finalProj = { ...proj, captions: chunked };
          triggerAutoSave(finalProj);
        }
        setProject(finalProj);
        setTemplates(tpls);

        // Auto-adapt aspect ratio from project metadata if available
        if (finalProj.metadata?.aspect_ratio) {
          if (finalProj.metadata.aspect_ratio === "9:16" || finalProj.metadata.aspect_ratio === "16:9" || finalProj.metadata.aspect_ratio === "1:1") {
            setAspectRatioMode(finalProj.metadata.aspect_ratio);
          }
        }

        if (finalProj.captions && finalProj.captions.length > 0) {
          setSelectedSegmentId(finalProj.captions[0].id);
        } else if (finalProj.status === "uploaded" || (!finalProj.captions || finalProj.captions.length === 0)) {
          // Autonomous UX: Automatically present caption generation if not yet transcribed
          setIsPrepareMediaOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [projectId]);

  // Subtitle Sync Offset state (fine-tuning voice-to-caption synchronization)
  const [syncOffset, setSyncOffset] = useState<number>(0);

  // Video playback time listener (60 FPS requestAnimationFrame loop for ultra-smooth frame-accurate sync)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId: number;
    const updatePlayhead = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
      }
      animId = requestAnimationFrame(updatePlayhead);
    };
    animId = requestAnimationFrame(updatePlayhead);

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onSeeked = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      if (video.videoWidth && video.videoHeight) {
        const ratio = video.videoWidth / video.videoHeight;
        if (ratio < 0.75) {
          setAspectRatioMode("9:16");
        } else if (ratio > 1.3) {
          setAspectRatioMode("16:9");
        } else {
          setAspectRatioMode("1:1");
        }
      }
    };
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, [project]);

  // Handle fine-tuning sync offset (+/- delta in seconds)
  const handleNudgeSync = (deltaSec: number) => {
    setSyncOffset((prev) => parseFloat((prev + deltaSec).toFixed(2)));
  };

  // Permanently save the tuned sync offset to all subtitle timestamps
  const handleApplyPermanentSync = () => {
    if (!project || syncOffset === 0) return;
    const updatedCaptions = project.captions.map((c) => {
      const newStart = Math.max(0, parseFloat((c.start - syncOffset).toFixed(2)));
      const newEnd = Math.max(newStart + 0.1, parseFloat((c.end - syncOffset).toFixed(2)));
      const updatedWords = (c.words || []).map((w) => ({
        ...w,
        start: Math.max(0, parseFloat((w.start - syncOffset).toFixed(2))),
        end: Math.max(0.05, parseFloat((w.end - syncOffset).toFixed(2))),
      }));
      return { ...c, start: newStart, end: newEnd, words: updatedWords };
    });
    setSyncOffset(0);
    triggerAutoSave({ ...project, captions: updatedCaptions });
  };

  // Auto-save debouncer
  const saveTimeoutRef = useRef<any>(null);
  const triggerAutoSave = useCallback((updated: Project) => {
    setProject(updated);
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await updateProject(updated.id, {
          title: updated.title,
          style: updated.style,
          captions: updated.captions,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
        setSaveStatus("unsaved");
      }
    }, 800);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 100));
    setCurrentTime(videoRef.current.currentTime);
  };

  // Effective time considering fine-tune sync offset
  const effectiveCurrentTime = Math.max(0, currentTime + syncOffset);

  // Find currently active caption segment at video playhead
  const activeSegment = project?.captions.find(
    (c) => effectiveCurrentTime >= c.start && effectiveCurrentTime <= c.end
  );

  // Apply a template preset
  const handleApplyTemplate = (tpl: CaptionTemplate) => {
    if (!project) return;
    const updated = {
      ...project,
      style: {
        ...tpl.style,
        position_x_pct: project.style.position_x_pct ?? tpl.style.position_x_pct ?? 50.0,
        position_y_pct: project.style.position_y_pct ?? tpl.style.position_y_pct ?? 75.0,
      },
    };
    triggerAutoSave(updated);
  };

  // Update specific style setting
  const handleUpdateStyle = (key: keyof StyleSettings, value: any) => {
    if (!project) return;
    const updated = {
      ...project,
      style: {
        ...project.style,
        [key]: value,
      },
    };
    triggerAutoSave(updated);
  };

  // Nudge text position
  const handleNudgePosition = (deltaX: number, deltaY: number) => {
    if (!project) return;
    const currentX = project.style.position_x_pct ?? 50.0;
    const currentY = project.style.position_y_pct ?? 75.0;
    const newX = Math.max(5, Math.min(95, parseFloat((currentX + deltaX).toFixed(1))));
    const newY = Math.max(5, Math.min(95, parseFloat((currentY + deltaY).toFixed(1))));
    handleUpdateStyle("position_x_pct", newX);
    handleUpdateStyle("position_y_pct", newY);
  };

  // Interactive mouse dragging of caption on video preview canvas
  const handleCaptionMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingText(true);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setInitialStylePos({
      x: project?.style.position_x_pct ?? 50.0,
      y: project?.style.position_y_pct ?? 75.0,
    });
  };

  const handleCaptionTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDraggingText(true);
      setDragStartMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setInitialStylePos({
        x: project?.style.position_x_pct ?? 50.0,
        y: project?.style.position_y_pct ?? 75.0,
      });
    }
  };

  useEffect(() => {
    if (!isDraggingText) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasBoxRef.current || !project) return;
      const rect = canvasBoxRef.current.getBoundingClientRect();
      const deltaXPct = ((e.clientX - dragStartMouse.x) / rect.width) * 100;
      const deltaYPct = ((e.clientY - dragStartMouse.y) / rect.height) * 100;

      let newX = Math.round((initialStylePos.x + deltaXPct) * 10) / 10;
      let newY = Math.round((initialStylePos.y + deltaYPct) * 10) / 10;

      // Snap to horizontal center line
      if (Math.abs(newX - 50.0) < 2.5) {
        newX = 50.0;
        setSnapXGuideline(true);
      } else {
        setSnapXGuideline(false);
      }

      // Snap to common vertical positions (35%, 50%, 75%)
      if (Math.abs(newY - 75.0) < 2.0) {
        newY = 75.0;
        setSnapYGuideline(true);
      } else if (Math.abs(newY - 50.0) < 2.0) {
        newY = 50.0;
        setSnapYGuideline(true);
      } else if (Math.abs(newY - 35.0) < 2.0) {
        newY = 35.0;
        setSnapYGuideline(true);
      } else {
        setSnapYGuideline(false);
      }

      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      setProject((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          style: {
            ...prev.style,
            position_x_pct: newX,
            position_y_pct: newY,
          },
        };
        projectRef.current = updated;
        return updated;
      });
    };

    const handleMouseUp = () => {
      setIsDraggingText(false);
      setSnapXGuideline(false);
      setSnapYGuideline(false);
      if (projectRef.current) {
        triggerAutoSave(projectRef.current);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingText, dragStartMouse, initialStylePos, triggerAutoSave]);

  // Interactive mouse resize handlers for caption box
  const handleResizeStart = (e: React.MouseEvent, handle: "se" | "sw" | "ne" | "nw" | "e" | "w") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingText(true);
    setResizeHandleType(handle);
    setResizeStartMouse({ x: e.clientX, y: e.clientY });
    setInitialFontSize(project?.style?.font_size || 24);
    setInitialBoxWidthPct(customBoxWidthPct || 88);
  };

  useEffect(() => {
    if (!isResizingText) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!canvasBoxRef.current) return;
      const rect = canvasBoxRef.current.getBoundingClientRect();
      const deltaX = e.clientX - resizeStartMouse.x;
      const deltaY = e.clientY - resizeStartMouse.y;

      if (resizeHandleType === "e" || resizeHandleType === "w") {
        const factor = resizeHandleType === "e" ? 1 : -1;
        const widthChangePct = (deltaX * factor / rect.width) * 100 * 2;
        const newWidth = Math.max(30, Math.min(96, Math.round(initialBoxWidthPct + widthChangePct)));
        setCustomBoxWidthPct(newWidth);
      } else {
        let delta = 0;
        if (resizeHandleType === "se") delta = (deltaX + deltaY) / 2;
        else if (resizeHandleType === "nw") delta = -(deltaX + deltaY) / 2;
        else if (resizeHandleType === "ne") delta = (deltaX - deltaY) / 2;
        else if (resizeHandleType === "sw") delta = (-deltaX + deltaY) / 2;

        const sizeDelta = Math.round(delta * 0.35);
        const newFontSize = Math.max(14, Math.min(80, initialFontSize + sizeDelta));

        setProject((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            style: {
              ...prev.style,
              font_size: newFontSize,
            },
          };
          projectRef.current = updated;
          return updated;
        });
      }
    };

    const handleResizeEnd = () => {
      setIsResizingText(false);
      setResizeHandleType(null);
      if (projectRef.current) {
        triggerAutoSave(projectRef.current);
      }
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizingText, resizeHandleType, resizeStartMouse, initialFontSize, initialBoxWidthPct, triggerAutoSave]);

  // Update caption text
  const handleUpdateSegmentText = (segId: string, newText: string) => {
    if (!project) return;
    const words = newText.split(" ").filter((w) => w.length > 0);
    const updatedCaptions = project.captions.map((c) => {
      if (c.id === segId) {
        const segDuration = c.end - c.start;
        const durPerWord = segDuration / Math.max(words.length, 1);
        const updatedWords: WordTimestamp[] = words.map((w, idx) => ({
          word: w,
          start: c.start + idx * durPerWord,
          end: c.start + (idx + 1) * durPerWord,
          probability: 1.0,
        }));
        return { ...c, text: newText, words: updatedWords };
      }
      return c;
    });
    triggerAutoSave({ ...project, captions: updatedCaptions });
  };

  // Adjust timing
  const handleAdjustTiming = (segId: string, deltaStart: number, deltaEnd: number) => {
    if (!project) return;
    const updatedCaptions = project.captions.map((c) => {
      if (c.id === segId) {
        const newStart = Math.max(0, parseFloat((c.start + deltaStart).toFixed(2)));
        const newEnd = Math.max(newStart + 0.2, parseFloat((c.end + deltaEnd).toFixed(2)));
        return { ...c, start: newStart, end: newEnd };
      }
      return c;
    });
    triggerAutoSave({ ...project, captions: updatedCaptions });
  };

  // Add Segment
  const handleAddSegment = () => {
    if (!project) return;
    const newStart = parseFloat(currentTime.toFixed(2));
    const newEnd = parseFloat((newStart + 2.0).toFixed(2));
    const newSeg: CaptionSegment = {
      id: `seg_${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: "New viral subtitle line",
      words: [
        { word: "New", start: newStart, end: newStart + 0.5, probability: 1.0 },
        { word: "viral", start: newStart + 0.5, end: newStart + 1.0, probability: 1.0 },
        { word: "subtitle", start: newStart + 1.0, end: newStart + 1.5, probability: 1.0 },
        { word: "line", start: newStart + 1.5, end: newEnd, probability: 1.0 },
      ],
    };
    const updated = [...project.captions, newSeg].sort((a, b) => a.start - b.start);
    setSelectedSegmentId(newSeg.id);
    triggerAutoSave({ ...project, captions: updated });
  };

  // Delete Segment
  const handleDeleteSegment = (segId: string) => {
    if (!project) return;
    const updated = project.captions.filter((c) => c.id !== segId);
    if (selectedSegmentId === segId) {
      setSelectedSegmentId(updated[0]?.id || null);
    }
    triggerAutoSave({ ...project, captions: updated });
  };

  // Split Segment
  const handleSplitSegment = (segId: string) => {
    if (!project) return;
    const seg = project.captions.find((c) => c.id === segId);
    if (!seg || seg.words.length <= 1) return;

    const mid = Math.floor(seg.words.length / 2);
    const words1 = seg.words.slice(0, mid);
    const words2 = seg.words.slice(mid);

    const seg1: CaptionSegment = {
      id: seg.id,
      start: words1[0].start,
      end: words1[words1.length - 1].end,
      text: words1.map((w) => w.word).join(" "),
      words: words1,
    };

    const seg2: CaptionSegment = {
      id: `seg_${Date.now()}`,
      start: words2[0].start,
      end: words2[words2.length - 1].end,
      text: words2.map((w) => w.word).join(" "),
      words: words2,
    };

    const updated = project.captions.flatMap((c) => (c.id === segId ? [seg1, seg2] : [c]));
    triggerAutoSave({ ...project, captions: updated });
  };

  // Re-chunk captions on slider change
  const handleUpdateWordsPerCard = (newLimit: number) => {
    if (!project) return;
    const chunked = autoChunkCaptions(project.captions, newLimit);
    const updated = {
      ...project,
      captions: chunked,
      style: {
        ...project.style,
        max_words_per_line: newLimit,
      },
    };
    setProject(updated);
    triggerAutoSave(updated);
  };

  // Caption Tools batch action
  const handleCaptionTool = async (action: "auto_emoji" | "remove_emoji" | "uppercase" | "lowercase" | "capitalize" | "chunk_short" | "roman_urdu") => {
    if (!project) return;
    try {
      setIsCaptionToolsOpen(false);
      setSaveStatus("saving");
      if (action === "chunk_short") {
        const limit = project.style?.max_words_per_line || 3;
        const chunked = autoChunkCaptions(project.captions, limit);
        const optimistic = { ...project, captions: chunked };
        setProject(optimistic);
        triggerAutoSave(optimistic);
      }
      const updated = await applyCaptionTool(project.id, action);
      setProject(updated);
      setSaveStatus("saved");
    } catch (err: any) {
      alert(err.message || "Failed to apply caption tool");
      setSaveStatus("unsaved");
    }
  };

  // Smooth progress ticker target ref
  const targetTranscribeProgressRef = useRef(0);
  const tickerIntervalRef = useRef<any>(null);

  // Trigger real AI transcription from Prepare Media Modal
  const handleStartTranscription = async () => {
    if (!project) return;
    try {
      setIsTranscribing(true);
      setTranscribeProgress(1);
      targetTranscribeProgressRef.current = 15;
      setTranscribeMsg("Starting high-speed AI transcription engine...");

      // Smooth 1, 2, 3, 4, 5... progressive ticker that never gets stuck and never jumps abruptly
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
      tickerIntervalRef.current = setInterval(() => {
        setTranscribeProgress((prev) => {
          const target = targetTranscribeProgressRef.current;
          if (prev < target) {
            return prev + 1; // Smoothly step forward by 1%
          } else if (prev < 94) {
            // Keep ticking forward steadily every tick so it never freezes
            return prev + 1;
          }
          return prev;
        });
      }, 160); // 160ms tick = continuous fluid progression

      const { job_id } = await startTranscription(project.id, {
        language: spokenLang === "auto" ? undefined : spokenLang,
        writingScript: writingScript,
        romanUrdu: writingScript === "roman_urdu",
        enhanceAudio: enhanceAudio,
        addEmojis: addEmojis,
        modelSize: "base",
      });
      setTranscribeJobId(job_id);

      const interval = setInterval(async () => {
        try {
          const status = await pollJob(job_id);
          // Advance the target smoothly instead of jumping directly
          if (status.progress > targetTranscribeProgressRef.current) {
            targetTranscribeProgressRef.current = status.progress;
          }
          if (status.message) {
            setTranscribeMsg(status.message);
          }

          if (status.status === "completed") {
            clearInterval(interval);
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
            targetTranscribeProgressRef.current = 100;

            // Rapidly roll to 100% without freeze
            const finishTimer = setInterval(() => {
              setTranscribeProgress((p) => {
                if (p >= 100) {
                  clearInterval(finishTimer);
                  setTimeout(async () => {
                    setIsTranscribing(false);
                    setIsPrepareMediaOpen(false);
                    const freshProj = await fetchProject(project.id);
                    setProject(freshProj);
                    if (freshProj.captions.length > 0) {
                      setSelectedSegmentId(freshProj.captions[0].id);
                    }
                  }, 250);
                  return 100;
                }
                return p + 2;
              });
            }, 30);
          } else if (status.status === "failed") {
            clearInterval(interval);
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
            setIsTranscribing(false);
            alert(`Transcription failed: ${status.error || status.message}`);
          }
        } catch (e) {
          console.error(e);
        }
      }, 800);
    } catch (err: any) {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
      setIsTranscribing(false);
      alert(err.message || "Failed to start transcription");
    }
  };

  // Trigger real FFmpeg Video Export
  const handleStartExport = async () => {
    if (!project) return;
    try {
      setIsExporting(true);
      setExportProgress(5);
      setExportMsg("Starting FFmpeg render worker with burned subtitles...");
      setExportResult(null);

      const { job_id } = await startExport(project.id, {
        resolution: exportRes,
        aspect_ratio: aspectRatioMode,
        burn_captions: exportBurn,
      });
      setExportJobId(job_id);

      const interval = setInterval(async () => {
        try {
          const status = await pollJob(job_id);
          setExportProgress(status.progress);
          setExportMsg(status.message);

          if (status.status === "completed") {
            clearInterval(interval);
            setIsExporting(false);
            setExportResult(status.result);
          } else if (status.status === "failed") {
            clearInterval(interval);
            setIsExporting(false);
            alert(`Export failed: ${status.error || status.message}`);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1200);
    } catch (err: any) {
      setIsExporting(false);
      alert(err.message || "Failed to start export");
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-medium">Opening CapScribe Studio Editor...</span>
        </div>
      </div>
    );
  }

  const selectedSegment = (project.captions && project.captions.length > 0)
    ? (project.captions.find((c) => c.id === selectedSegmentId) || project.captions[0])
    : null;
  const style = project.style || {};
  const filteredCaptions = (project.captions || []).filter((c) =>
    c.text.toLowerCase().includes(captionSearch.toLowerCase())
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-950 text-gray-200 select-none">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="h-14 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Editable project title */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">●</span>
            <input
              type="text"
              value={project.title}
              onChange={(e) => triggerAutoSave({ ...project, title: e.target.value })}
              className="bg-transparent font-bold text-white text-sm hover:bg-gray-800/50 focus:bg-gray-950 px-2 py-1 rounded-lg border border-transparent focus:border-emerald-500 focus:outline-none transition-all max-w-xs"
            />
          </div>

          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono pl-2">
            {saveStatus === "saving" ? (
              <span className="text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved to disk
              </span>
            ) : (
              <span className="text-gray-500">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Framing & Safe Zone Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Safe Zone Toggle Button */}
          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showSafeZone
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                : "bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white"
            }`}
            title="Toggle TikTok / Reels Safe Zone Overlay"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Safe Zone</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showSafeZone ? "bg-emerald-400" : "bg-gray-500"}`} />
          </button>

          {/* Aspect Ratio Framing Buttons */}
          <div className="flex items-center bg-gray-800/80 p-0.5 rounded-xl border border-gray-700 text-xs">
            {(["original", "9:16", "16:9", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatioMode(ratio)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  aspectRatioMode === ratio
                    ? "bg-emerald-600 text-white font-semibold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* AI Transcribe / Prepare Media Button */}
          <button
            onClick={() => setIsPrepareMediaOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3.5 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Transcribe</span>
          </button>

          {/* Export Video Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Video</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: CAPTIONS LIST & CAPTION TOOLS */}
        <aside className="w-80 border-r border-gray-800 bg-gray-900/60 flex flex-col shrink-0">
          {/* Tab selector */}
          <div className="flex border-b border-gray-800 bg-gray-900/80 text-xs">
            <button
              onClick={() => setActiveLeftTab("captions")}
              className={`flex-1 py-3 font-semibold text-center transition-colors border-b-2 ${
                activeLeftTab === "captions"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Captions ({project.captions.length})
            </button>
            <button
              onClick={() => setActiveLeftTab("presets")}
              className={`flex-1 py-3 font-semibold text-center transition-colors border-b-2 ${
                activeLeftTab === "presets"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Viral Presets ({templates.length})
            </button>
          </div>

          {activeLeftTab === "captions" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Captions Header with Search & Caption Tools Dropdown */}
              <div className="p-3 border-b border-gray-800 flex items-center justify-between gap-2">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search dialogue..."
                    value={captionSearch}
                    onChange={(e) => setCaptionSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  {captionSearch && (
                    <button
                      onClick={() => setCaptionSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Caption Tools Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsCaptionToolsOpen(!isCaptionToolsOpen)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tools</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Dropdown Menu */}
                  {isCaptionToolsOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl p-1.5 z-50 text-xs space-y-1">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        Viral Caption Tools
                      </div>
                      <button
                        onClick={() => handleCaptionTool("chunk_short")}
                        className="w-full px-2.5 py-2 rounded-lg text-left flex items-center gap-2 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 transition-colors"
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-semibold text-white">⚡ Viral Short Cards (2-3 Words)</div>
                          <div className="text-[10px] text-gray-500">Split into snappy 2-3 word cards</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCaptionTool("roman_urdu")}
                        className="w-full px-2.5 py-2 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 transition-colors"
                      >
                        <span className="font-mono font-bold text-xs text-emerald-400 px-1 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">HI</span>
                        <div>
                          <div className="font-semibold text-white">100% Hinglish / Roman Urdu</div>
                          <div className="text-[10px] text-gray-500">Convert Hindi/Urdu to pure English alphabet</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCaptionTool("auto_emoji")}
                        className="w-full px-2.5 py-2 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 transition-colors"
                      >
                        <Smile className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold">Auto-Add Emojis</div>
                          <div className="text-[10px] text-gray-500">Insert 💵, 🚗, 🔥, 🏆 to keywords</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCaptionTool("remove_emoji")}
                        className="w-full px-2.5 py-2 rounded-lg text-left flex items-center gap-2 hover:bg-red-500/20 text-gray-300 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="font-semibold">Remove Emojis</div>
                          <div className="text-[10px] text-gray-500">Clean all emojis from text</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-800 my-1" />
                      <button
                        onClick={() => handleCaptionTool("uppercase")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                      >
                        <span className="font-mono font-bold text-xs text-emerald-400">TT</span>
                        <span>ALL CAPS (Viral Hormozi)</span>
                      </button>
                      <button
                        onClick={() => handleCaptionTool("capitalize")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                      >
                        <span className="font-mono font-bold text-xs text-indigo-400">Tt</span>
                        <span>Title Case</span>
                      </button>
                      <button
                        onClick={() => handleCaptionTool("lowercase")}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                      >
                        <span className="font-mono font-bold text-xs text-purple-400">tt</span>
                        <span>lowercase aesthetic</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Captions Transcript List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredCaptions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    {captionSearch ? "No captions match your search." : "No captions generated yet. Click 'AI Transcribe' to begin."}
                  </div>
                ) : (
                  filteredCaptions.map((seg, idx) => {
                    const isSelected = seg.id === selectedSegmentId;
                    const isActive = currentTime >= seg.start && currentTime <= seg.end;

                    return (
                      <div
                        key={seg.id}
                        onClick={() => {
                          setSelectedSegmentId(seg.id);
                          seekTo(seg.start);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/40"
                            : isActive
                            ? "bg-gray-800/80 border-gray-700 text-white"
                            : "bg-gray-950/60 border-gray-800/80 text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Segment Index Badge */}
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-emerald-500 text-black font-extrabold"
                                : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {idx + 1}
                          </span>

                          {/* Segment Text & Duration */}
                          <div className="flex-1">
                            <p className="font-medium leading-relaxed">{seg.text}</p>
                            <span className="text-[10px] font-mono text-gray-500 block mt-1">
                              {seg.start}s – {seg.end}s ({(seg.end - seg.start).toFixed(1)}s)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Presets Tab with Viral Styles (Organized by 5 Categories) */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Captora Template Library</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {templates.length} Pro Presets
                </span>
              </div>

              {/* Group templates by category */}
              {(["Viral Shorts", "Influencer", "Neon Glow", "Badges & Boxes", "Cinematic"] as const).map((catName) => {
                const catTemplates = templates.filter((t) => t.category === catName);
                if (catTemplates.length === 0) return null;

                return (
                  <div key={catName} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-800/80">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {catName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">({catTemplates.length})</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {catTemplates.map((tpl) => {
                        const isSelected = style.template_id === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => handleApplyTemplate(tpl)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                                : "border-gray-800 bg-gray-900/60 hover:bg-gray-800/80 hover:border-gray-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                {tpl.name}
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              </span>
                              <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                                {tpl.style.font_family}
                              </span>
                            </div>
                            <div
                              className="text-xs font-extrabold uppercase py-2 px-2.5 rounded-lg bg-black/60 text-center truncate shadow-inner"
                              style={{
                                fontFamily: tpl.style.font_family,
                                color: tpl.style.highlight_color,
                                WebkitTextStroke: `${Math.min(tpl.style.outline_width, 2)}px ${tpl.style.outline_color}`,
                                textShadow: tpl.style.shadow_color !== "transparent" ? `1px 1px 4px ${tpl.style.shadow_color}` : "none",
                              }}
                            >
                              {tpl.preview_text}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* CENTER WORKSPACE: VIDEO PLAYER & FULLY DRAGGABLE CAPTION OVERLAY */}
        <main className="flex-1 flex flex-col bg-gray-950 relative overflow-hidden">
          {/* Video Preview Canvas */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            <div
              ref={canvasBoxRef}
              className={`relative overflow-hidden rounded-2xl bg-black border-2 border-gray-800 shadow-2xl flex items-center justify-center transition-all ${
                aspectRatioMode === "9:16"
                  ? "w-[320px] h-[568px] max-h-[82vh]"
                  : aspectRatioMode === "1:1"
                  ? "w-[440px] h-[440px] max-h-[80vh]"
                  : "w-[720px] max-w-full h-[405px] max-h-[80vh]"
              }`}
            >
              {project ? (
                <video
                  ref={videoRef}
                  src={`/api/projects/${project.id}/video`}
                  className="w-full h-full object-contain pointer-events-none"
                  playsInline
                  preload="auto"
                />
              ) : (
                <div className="text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Film className="w-10 h-10 opacity-30" />
                  <span>No video loaded</span>
                </div>
              )}

              {/* SNAP GUIDELINES (Center Snapping Lines) */}
              {snapXGuideline && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 border-r-2 border-dashed border-emerald-400/80 z-20 pointer-events-none animate-pulse" />
              )}
              {snapYGuideline && (
                <div
                  className="absolute left-0 right-0 h-0.5 border-b-2 border-dashed border-emerald-400/80 z-20 pointer-events-none animate-pulse"
                  style={{ top: `${style.position_y_pct ?? 75.0}%` }}
                />
              )}

              {/* SOCIAL SAFE ZONE OVERLAY */}
              {showSafeZone && (
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 border-2 border-emerald-500/40 rounded-2xl">
                  {/* Top Header Safe Zone Area */}
                  <div className="h-[15%] w-full bg-red-500/10 border-b border-red-500/40 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-red-400 bg-black/70 px-2 py-0.5 rounded">
                      Top Header Zone (Avoid Text)
                    </span>
                  </div>

                  {/* Middle Safe Area with Right Icons Guide */}
                  <div className="flex-1 flex justify-between items-center px-3 relative">
                    <div className="border border-dashed border-emerald-400/60 rounded-xl p-2 text-center bg-emerald-500/5">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        ✓ TikTok / Reels Safe Zone
                      </span>
                    </div>
                    {/* Right-side action buttons guide */}
                    <div className="w-[18%] h-full bg-red-500/10 border-l border-red-500/40 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-red-400 rotate-90 whitespace-nowrap">
                        Action Buttons
                      </span>
                    </div>
                  </div>

                  {/* Bottom Captions & Audio Safe Zone Area */}
                  <div className="h-[22%] w-full bg-red-500/10 border-t border-red-500/40 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-red-400 bg-black/70 px-2 py-0.5 rounded">
                      Platform Caption Zone (Avoid Text)
                    </span>
                  </div>
                </div>
              )}

              {/* INTERACTIVE DRAGGABLE & RESIZABLE CAPTION OVERLAY */}
              {activeSegment && (
                <div
                  onMouseDown={handleCaptionMouseDown}
                  onTouchStart={handleCaptionTouchStart}
                  onMouseEnter={() => setIsHoveringText(true)}
                  onMouseLeave={() => setIsHoveringText(false)}
                  className={`absolute z-30 select-none cursor-grab active:cursor-grabbing group transition-all ${
                    isDraggingText || isResizingText
                      ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/60 shadow-2xl scale-[1.02]"
                      : isHoveringText
                      ? "ring-1.5 ring-emerald-400/90 rounded-xl"
                      : ""
                  }`}
                  style={{
                    left: `${style.position_x_pct ?? 50.0}%`,
                    top: `${style.position_y_pct ?? 75.0}%`,
                    transform: "translate(-50%, -50%)",
                    maxWidth: singleLineMode ? "98%" : `${customBoxWidthPct || 88}%`,
                    width: singleLineMode ? "max-content" : undefined,
                  }}
                  title="Drag box to move • Drag corner handles to scale size"
                >
                  {/* Floating Coordinates & Instant Sizing / Line Toolbar */}
                  {(isDraggingText || isHoveringText || isResizingText) && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-emerald-500/70 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap flex items-center gap-2 shadow-2xl z-50 pointer-events-auto"
                    >
                      <div className="flex items-center gap-1 cursor-grab" title="Drag caption box to move">
                        <Move className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-gray-300">X: {(style.position_x_pct ?? 50.0).toFixed(0)}% Y: {(style.position_y_pct ?? 75.0).toFixed(0)}%</span>
                      </div>
                      <span className="text-gray-600">|</span>

                      {/* Interactive Scale Buttons [-] Size [+] */}
                      <div className="flex items-center gap-1" title="Click to adjust font size">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStyle("font_size", Math.max(12, (style.font_size || 24) - 2));
                          }}
                          className="w-5 h-5 rounded bg-gray-800 hover:bg-emerald-600 active:scale-95 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Decrease size (-2px)"
                        >
                          -
                        </button>
                        <span className="text-amber-300 font-bold px-1 min-w-[30px] text-center text-xs">{style.font_size}px</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStyle("font_size", Math.min(80, (style.font_size || 24) + 2));
                          }}
                          className="w-5 h-5 rounded bg-gray-800 hover:bg-emerald-600 active:scale-95 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                          title="Increase size (+2px)"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-gray-600">|</span>

                      {/* 1 Line vs Wrap Pill Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSingleLineMode(!singleLineMode);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          singleLineMode
                            ? "bg-emerald-500 text-black shadow"
                            : "bg-gray-800 text-gray-300 hover:text-white border border-gray-700"
                        }`}
                        title={singleLineMode ? "Click for Multi-Line Wrap" : "Click for 1 Single Line"}
                      >
                        {singleLineMode ? "1 Line" : "Wrap"}
                      </button>
                    </div>
                  )}

                  {/* 4 Corner Resize Handles */}
                  {(isHoveringText || isResizingText || isDraggingText) && (
                    <>
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "nw")}
                        className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                        title="Drag corner to scale size"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "ne")}
                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                        title="Drag corner to scale size"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "sw")}
                        className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
                        title="Drag corner to scale size"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "se")}
                        className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
                        title="Drag corner to scale size"
                      />

                      {/* 2 Side Width Handles */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "w")}
                        className="absolute top-1/2 -left-2 -translate-y-1/2 w-2.5 h-5 rounded bg-white border-2 border-emerald-500 shadow-md cursor-ew-resize z-50 hover:scale-125 transition-transform"
                        title="Drag to change box width"
                      />
                      <div
                        onMouseDown={(e) => handleResizeStart(e, "e")}
                        className="absolute top-1/2 -right-2 -translate-y-1/2 w-2.5 h-5 rounded bg-white border-2 border-emerald-500 shadow-md cursor-ew-resize z-50 hover:scale-125 transition-transform"
                        title="Drag to change box width"
                      />
                    </>
                  )}

                  {/* Resizing Live Scale Pill Indicator */}
                  {isResizingText && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full shadow-lg font-bold flex items-center gap-1 pointer-events-none animate-pulse z-50 whitespace-nowrap">
                      <span>Scaling: {style.font_size}px (Release to save)</span>
                    </div>
                  )}

                  {/* The Actual Caption Box */}
                  <div
                    className={`px-3 py-1.5 rounded-xl text-center flex items-center justify-center gap-x-2 gap-y-1 transition-all ${
                      singleLineMode
                        ? "flex-nowrap whitespace-nowrap overflow-visible"
                        : "flex-wrap justify-center"
                    }`}
                    style={{
                      fontFamily: style.font_family,
                      fontSize: `${style.font_size}px`,
                      fontWeight: parseInt(style.font_weight) || 700,
                      fontStyle: (style as any).font_style || "normal",
                      textTransform: style.text_transform as any,
                      textAlign: style.alignment || "center",
                      WebkitTextStroke: `${Math.min(style.outline_width ?? 1, 2)}px ${style.outline_color || "#000000"}`,
                      textShadow: `${Math.min(style.shadow_offset ?? 1, 2)}px ${Math.min(style.shadow_offset ?? 1, 2)}px 0px ${style.shadow_color || "#000000"}`,
                      backgroundColor:
                        style.background_opacity > 0
                          ? style.background_color
                          : "transparent",
                    }}
                  >
                    {activeSegment.words && activeSegment.words.length > 0 ? (
                      activeSegment.words.map((w, idx) => {
                        const isWordActive =
                          effectiveCurrentTime >= w.start && effectiveCurrentTime <= w.end;

                        // Select animation class
                        let animClass = "";
                        if (isWordActive) {
                          if (style.animation_type === "bounce_pop") animClass = "animate-bounce-pop";
                          else if (style.animation_type === "bouncy_drop") animClass = "animate-bouncy-drop";
                          else if (style.animation_type === "slide_down") animClass = "animate-slide-down";
                          else if (style.animation_type === "slide_upward") animClass = "animate-slide-upward";
                          else if (style.animation_type === "bounce_left") animClass = "animate-bounce-left";
                          else if (style.animation_type === "bounce_right") animClass = "animate-bounce-right";
                          else if (style.animation_type === "slide_right") animClass = "animate-slide-right";
                          else if (style.animation_type === "reveal") animClass = "animate-reveal";
                          else if (style.animation_type === "bouncy_reveal") animClass = "animate-bouncy-reveal";
                          else if (style.animation_type === "wheel") animClass = "animate-wheel";
                          else if (style.animation_type === "fade_down") animClass = "animate-fade-down";
                          else if (style.animation_type === "flicker") animClass = "animate-flicker";
                          else if (style.animation_type === "blur") animClass = "animate-blur";
                          else if (style.animation_type === "hop") animClass = "animate-hop";
                          else if (style.animation_type === "neon_glow") animClass = "animate-neon-glow";
                          else if (style.animation_type === "zoom_stamp") animClass = "animate-zoom-stamp";
                          else if (style.animation_type === "wiggle") animClass = "animate-wiggle";
                          else if (style.animation_type === "slide_up") animClass = "animate-slide-up";
                          else if (style.animation_type === "box_highlight") animClass = "box-highlight-active";
                          else if (style.animation_type === "word_highlight") animClass = "animate-hormozi-pop";
                          else if (style.animation_type === "pop") animClass = "animate-pop-word";
                        }

                        return (
                          <span
                            key={idx}
                            className={`transition-all duration-150 ${animClass}`}
                            style={{
                              color: isWordActive
                                ? style.animation_type === "box_highlight"
                                  ? "#000000"
                                  : style.highlight_color
                                : style.primary_color,
                              ...(style.animation_type === "box_highlight" && isWordActive
                                ? { backgroundColor: style.highlight_color || "#facc15" }
                                : {}),
                            }}
                          >
                            {w.word}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ color: style.primary_color }}>
                        {activeSegment.text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Player Controls Bar */}
          <div className="h-12 border-t border-gray-800/80 bg-gray-900/60 px-4 flex items-center justify-between gap-4 shrink-0 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => seekTo(0)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="font-mono text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Voice-Subtitle Sync Calibration Bar */}
              <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/40 rounded-lg px-2 py-1 shadow-inner ml-2">
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Sync:
                </span>
                <button
                  onClick={() => handleNudgeSync(-0.1)}
                  className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-emerald-900/60 text-gray-200 hover:text-emerald-300 font-mono text-[10px] border border-gray-700 transition-all active:scale-95"
                  title="Make captions appear earlier (-0.1s)"
                >
                  -0.1s
                </button>
                <span className={`font-mono text-[11px] px-1.5 min-w-[42px] text-center ${syncOffset !== 0 ? "text-amber-300 font-bold bg-amber-500/10 rounded" : "text-gray-400"}`}>
                  {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
                </span>
                <button
                  onClick={() => handleNudgeSync(0.1)}
                  className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-emerald-900/60 text-gray-200 hover:text-emerald-300 font-mono text-[10px] border border-gray-700 transition-all active:scale-95"
                  title="Make captions appear later (+0.1s)"
                >
                  +0.1s
                </button>
                {syncOffset !== 0 && (
                  <>
                    <button
                      onClick={() => setSyncOffset(0)}
                      className="text-[10px] text-gray-400 hover:text-red-400 px-1"
                      title="Reset offset to 0.0s"
                    >
                      ↺
                    </button>
                    <button
                      onClick={handleApplyPermanentSync}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold shadow transition-all active:scale-95 flex items-center gap-1"
                      title="Apply and permanently save this sync offset to all subtitle lines"
                    >
                      <Save className="w-3 h-3" />
                      Save Sync
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Playback speed */}
              <button
                onClick={() => {
                  const speeds = [1, 1.25, 1.5, 2, 0.5];
                  const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                  setPlaybackSpeed(next);
                  if (videoRef.current) videoRef.current.playbackRate = next;
                }}
                className="px-2 py-1 rounded bg-gray-800 text-gray-300 font-mono hover:text-white"
              >
                {playbackSpeed}x
              </button>

              {/* Mute */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. BOTTOM TIMELINE WITH WORD/LINE TOGGLE & AUDIO WAVEFORM */}
          <div className="h-48 border-t border-gray-800 bg-gray-900/90 flex flex-col shrink-0">
            {/* Timeline Tools Header */}
            <div className="h-10 px-4 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                {/* WORD vs LINE Mode Toggle Pill */}
                <div className="flex items-center bg-gray-950 p-0.5 rounded-lg border border-gray-800 font-bold text-[11px]">
                  <button
                    onClick={() => setTimelineMode("WORD")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      timelineMode === "WORD"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    WORD
                  </button>
                  <button
                    onClick={() => setTimelineMode("LINE")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      timelineMode === "LINE"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    LINE
                  </button>
                </div>

                <button
                  onClick={handleAddSegment}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-600/30 font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add Subtitle
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                  className="p-1 hover:text-white"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] w-8 text-center">{timelineZoom}x</span>
                <button
                  onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                  className="p-1 hover:text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Tracks Area */}
            <div
              className="flex-1 overflow-x-auto overflow-y-hidden relative p-3 space-y-1.5"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const totalWidth = (duration || 30) * 40 * timelineZoom;
                const targetTime = (clickX / totalWidth) * (duration || 30);
                seekTo(targetTime);
              }}
            >
              {/* Playhead Marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                style={{
                  left: `${(currentTime / (duration || 1)) * 100}%`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-[4px] -translate-y-1 shadow" />
              </div>

              {/* Track 1: Captions (WORD / LINE mode) */}
              <div
                className="relative h-11 bg-gray-950/80 rounded-lg border border-gray-800/80 overflow-hidden"
                style={{
                  width: `${Math.max(100, (duration || 10) * 40 * timelineZoom)}px`,
                }}
              >
                {timelineMode === "LINE" ? (
                  /* LINE Mode: Sentence Blocks */
                  project.captions.map((seg) => {
                    const isSelected = seg.id === selectedSegmentId;
                    const totalDur = duration || 10;
                    const leftPct = (seg.start / totalDur) * 100;
                    const widthPct = Math.max(((seg.end - seg.start) / totalDur) * 100, 1.5);

                    return (
                      <div
                        key={seg.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSegmentId(seg.id);
                          seekTo(seg.start);
                        }}
                        className={`absolute top-1 bottom-1 rounded-md px-2 text-xs flex items-center justify-between overflow-hidden cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-emerald-600/40 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 z-20"
                            : "bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700/80"
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        <span className="truncate">{seg.text}</span>
                      </div>
                    );
                  })
                ) : (
                  /* WORD Mode: Word Chips */
                  selectedSegment?.words?.map((w, wIdx) => {
                    const totalDur = duration || 10;
                    const leftPct = (w.start / totalDur) * 100;
                    const widthPct = Math.max(((w.end - w.start) / totalDur) * 100, 1);
                    const isWordPlaying = currentTime >= w.start && currentTime <= w.end;

                    return (
                      <div
                        key={wIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(w.start);
                        }}
                        className={`absolute top-1 bottom-1 rounded-md px-1.5 text-[11px] font-mono flex items-center justify-center overflow-hidden cursor-pointer border transition-all ${
                          isWordPlaying
                            ? "bg-amber-500/40 border-amber-400 text-white font-bold ring-1 ring-amber-400 z-20"
                            : "bg-gray-800/90 border-gray-700 text-amber-300 hover:bg-gray-700"
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        <span className="truncate">{w.word}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Track 2: Video 1 Track */}
              <div
                className="relative h-6 bg-blue-950/40 border border-blue-900/50 rounded-md flex items-center px-2 text-[10px] font-semibold text-blue-400"
                style={{
                  width: `${Math.max(100, (duration || 10) * 40 * timelineZoom)}px`,
                }}
              >
                <span>Video 1</span>
              </div>

              {/* Track 3: Audio 1 Track with Visual Waveform */}
              <div
                className="relative h-7 bg-teal-950/30 border border-teal-900/40 rounded-md flex items-center px-2 overflow-hidden"
                style={{
                  width: `${Math.max(100, (duration || 10) * 40 * timelineZoom)}px`,
                }}
              >
                <span className="text-[10px] font-semibold text-teal-400 absolute left-2 z-10 bg-teal-950/80 px-1 rounded">
                  Audio 1
                </span>
                {/* Simulated Audio Waveform Bars */}
                <div className="flex items-center gap-[3px] h-full w-full opacity-60 pl-16">
                  {Array.from({ length: 80 }).map((_, i) => {
                    const h = Math.max(20, Math.sin(i * 0.4) * 80 + Math.cos(i * 0.2) * 20);
                    return (
                      <div
                        key={i}
                        className="w-[2px] bg-teal-400 rounded-full shrink-0"
                        style={{ height: `${Math.min(90, Math.abs(h))}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: INSPECTOR, FORMAT & POSITION CONTROLS */}
        <aside className="w-80 border-l border-gray-800 bg-gray-900/60 flex flex-col shrink-0">
          {/* Header */}
          <div className="flex border-b border-gray-800 bg-gray-900/80 text-xs">
            <button
              onClick={() => setActiveRightTab("edit")}
              className={`flex-1 py-3 font-semibold text-center transition-colors border-b-2 ${
                activeRightTab === "edit"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Text & Position
            </button>
            <button
              onClick={() => setActiveRightTab("style")}
              className={`flex-1 py-3 font-semibold text-center transition-colors border-b-2 ${
                activeRightTab === "style"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Fonts & Animations
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {activeRightTab === "edit" ? (
              selectedSegment ? (
                <>
                  {/* Subtitle Phrase Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-gray-300 font-semibold">Active Phrase</label>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {selectedSegment.words?.length || 0} words
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={selectedSegment.text}
                    onChange={(e) => handleUpdateSegmentText(selectedSegment.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-emerald-500 font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Timing Fine Tuning */}
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Start Time</span>
                    <div className="flex items-center gap-1 font-mono">
                      <button
                        onClick={() => handleAdjustTiming(selectedSegment.id, -0.1, 0)}
                        className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                      >
                        -0.1s
                      </button>
                      <span className="w-12 text-center text-white">{selectedSegment.start}s</span>
                      <button
                        onClick={() => handleAdjustTiming(selectedSegment.id, 0.1, 0)}
                        className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                      >
                        +0.1s
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">End Time</span>
                    <div className="flex items-center gap-1 font-mono">
                      <button
                        onClick={() => handleAdjustTiming(selectedSegment.id, 0, -0.1)}
                        className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                      >
                        -0.1s
                      </button>
                      <span className="w-12 text-center text-white">{selectedSegment.end}s</span>
                      <button
                        onClick={() => handleAdjustTiming(selectedSegment.id, 0, 0.1)}
                        className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                      >
                        +0.1s
                      </button>
                    </div>
                  </div>
                </div>

                {/* ADVANCED POSITION CONTROLS (Drag on Screen or Nudge) */}
                <div className="space-y-3 pt-1 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      POSITION & PLACEMENT
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      💡 Click & drag directly on video
                    </span>
                  </div>

                  {/* Quick Position Presets */}
                  <div>
                    <label className="text-gray-400 text-[11px] block mb-1">Quick Presets</label>
                    <div className="grid grid-cols-5 gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-[10px] font-semibold text-center">
                      <button
                        onClick={() => {
                          handleUpdateStyle("position_x_pct", 50.0);
                          handleUpdateStyle("position_y_pct", 18.0);
                        }}
                        className={`py-1 rounded-lg transition-colors ${
                          (style.position_y_pct ?? 75.0) <= 22 ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Top
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStyle("position_x_pct", 50.0);
                          handleUpdateStyle("position_y_pct", 35.0);
                        }}
                        className={`py-1 rounded-lg transition-colors ${
                          (style.position_y_pct ?? 75.0) > 25 && (style.position_y_pct ?? 75.0) <= 42 ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Upper
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStyle("position_x_pct", 50.0);
                          handleUpdateStyle("position_y_pct", 50.0);
                        }}
                        className={`py-1 rounded-lg transition-colors ${
                          (style.position_y_pct ?? 75.0) > 42 && (style.position_y_pct ?? 75.0) <= 60 ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Center
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStyle("position_x_pct", 50.0);
                          handleUpdateStyle("position_y_pct", 70.0);
                        }}
                        className={`py-1 rounded-lg transition-colors ${
                          (style.position_y_pct ?? 75.0) > 60 && (style.position_y_pct ?? 75.0) <= 76 ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Lower
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStyle("position_x_pct", 50.0);
                          handleUpdateStyle("position_y_pct", 82.0);
                        }}
                        className={`py-1 rounded-lg transition-colors ${
                          (style.position_y_pct ?? 75.0) > 76 ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Bottom
                      </button>
                    </div>
                  </div>

                  {/* Directional Nudge D-Pad */}
                  <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-300 block">Nudge Controls</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        X: {(style.position_x_pct ?? 50.0).toFixed(1)}% | Y: {(style.position_y_pct ?? 75.0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleNudgePosition(0, -2.0)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        title="Move Up 2%"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleNudgePosition(-2.0, 0)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Move Left 2%"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            handleUpdateStyle("position_x_pct", 50.0);
                            handleUpdateStyle("position_y_pct", 75.0);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 transition-colors"
                          title="Reset to Center Bottom (50%, 75%)"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleNudgePosition(2.0, 0)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Move Right 2%"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleNudgePosition(0, 2.0)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        title="Move Down 2%"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal X Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-[11px]">Horizontal (X Axis)</span>
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <span>{(style.position_x_pct ?? 50.0).toFixed(1)} %</span>
                        <button
                          onClick={() => handleUpdateStyle("position_x_pct", 50.0)}
                          className="text-gray-500 hover:text-white p-0.5"
                          title="Reset X to 50%"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      step="0.5"
                      value={style.position_x_pct ?? 50.0}
                      onChange={(e) => handleUpdateStyle("position_x_pct", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Vertical Y Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-[11px]">Vertical (Y Axis)</span>
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <span>{(style.position_y_pct ?? 75.0).toFixed(1)} %</span>
                        <button
                          onClick={() => handleUpdateStyle("position_y_pct", 75.0)}
                          className="text-gray-500 hover:text-white p-0.5"
                          title="Reset Y to 75%"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="92"
                      step="0.5"
                      value={style.position_y_pct ?? 75.0}
                      onChange={(e) => handleUpdateStyle("position_y_pct", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                {/* FORMAT SECTION: Casing & Alignment */}
                <div className="space-y-3 pt-2 border-t border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    FORMAT & CASING
                  </span>

                  {/* Text Transform Buttons */}
                  <div>
                    <div className="grid grid-cols-3 gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
                      <button
                        onClick={() => handleUpdateStyle("text_transform", "uppercase")}
                        className={`py-1.5 rounded-lg font-mono font-bold transition-colors ${
                          style.text_transform === "uppercase"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                        title="ALL CAPS"
                      >
                        TT (Caps)
                      </button>
                      <button
                        onClick={() => handleUpdateStyle("text_transform", "capitalize")}
                        className={`py-1.5 rounded-lg font-mono font-bold transition-colors ${
                          style.text_transform === "capitalize"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                        title="Title Case"
                      >
                        Tt (Title)
                      </button>
                      <button
                        onClick={() => handleUpdateStyle("text_transform", "lowercase")}
                        className={`py-1.5 rounded-lg font-mono font-bold transition-colors ${
                          style.text_transform === "lowercase"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                        title="lowercase"
                      >
                        tt (lower)
                      </button>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <div className="grid grid-cols-3 gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
                      <button
                        onClick={() => handleUpdateStyle("alignment", "left")}
                        className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                          style.alignment === "left"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStyle("alignment", "center")}
                        className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                          style.alignment === "center" || !style.alignment
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStyle("alignment", "right")}
                        className={`py-1.5 rounded-lg flex items-center justify-center transition-colors ${
                          style.alignment === "right"
                            ? "bg-emerald-600 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Split & Delete Segment Actions */}
                <div className="pt-2 flex gap-2 border-t border-gray-800">
                  <button
                    onClick={() => handleSplitSegment(selectedSegment.id)}
                    className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Split Line</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSegment(selectedSegment.id)}
                    className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold flex items-center justify-center transition-colors"
                    title="Delete segment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 space-y-3">
                <p className="font-medium">No caption card selected.</p>
                <p className="text-[11px] text-gray-600">Click &quot;AI Transcribe&quot; at the top to automatically generate captions with Faster-Whisper AI.</p>
                <button
                  onClick={() => setIsPrepareMediaOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-semibold transition-colors"
                >
                  Open AI Transcriber
                </button>
              </div>
            )
          ) : (
              /* Style, Fonts & Animations Tab */
              <div className="space-y-4">
                {/* Viral & Professional Font Families */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-gray-300 font-semibold">Font Family</label>
                    <span className="text-[10px] text-emerald-400 font-mono">Complete Families</span>
                  </div>
                  <select
                    value={style.font_family}
                    onChange={(e) => handleUpdateStyle("font_family", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <optgroup label="👑 Core Requested Font Families (100–900)">
                      <option value="Playfair Display">Playfair Display (display fair - Luxury Serif 📖)</option>
                      <option value="Inter">Inter (Ultra Clean Minimalist ⚡)</option>
                      <option value="Outfit">Outfit (Ali Abdaal Modern Sans 💡)</option>
                      <option value="Arial">Arial (Universal Subtitles Standard 📺)</option>
                      <option value="Montserrat">Montserrat (Alex Hormozi Viral 🚀)</option>
                      <option value="Helvetica Neue">Helvetica / Helvetica Neue (Apple Standard 🎬)</option>
                    </optgroup>
                    <optgroup label="🔥 Top Viral Shorts & Reels Fonts">
                      <option value="Luckiest Guy">Luckiest Guy (MrBeast Viral Comic 🌟)</option>
                      <option value="Anton">Anton (Tall Condensed Viral Hook 🚀)</option>
                      <option value="Bebas Neue">Bebas Neue (Dramatic Punch 🔥)</option>
                      <option value="Titan One">Titan One (Titan 3D Cartoon Pop 🎨)</option>
                      <option value="Cinzel">Cinzel (Iman Gadzhi Luxury Gold 👑)</option>
                      <option value="Poppins">Poppins (Modern Creator Friendly 🎙️)</option>
                      <option value="Righteous">Righteous (Cyberpunk Electric Neon 🎮)</option>
                      <option value="Syne">Syne (Gen-Z Aesthetic ✨)</option>
                      <option value="Rubik Mono One">Rubik Mono One (Cyber Mono & Crypto 💻)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font Weight (Sab Font Ki Poori Family: 100 - 900) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-gray-300 font-semibold">Font Weight / Thickness</label>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {style.font_weight || "700"} ({
                        style.font_weight === "100" ? "Thin" :
                        style.font_weight === "200" ? "ExtraLight" :
                        style.font_weight === "300" ? "Light" :
                        style.font_weight === "400" ? "Regular" :
                        style.font_weight === "500" ? "Medium" :
                        style.font_weight === "600" ? "SemiBold" :
                        style.font_weight === "700" ? "Bold" :
                        style.font_weight === "800" ? "ExtraBold" :
                        style.font_weight === "900" ? "Black" : "Normal"
                      })
                    </span>
                  </div>
                  
                  {/* Quick Weight Selector Buttons (Poori Family) */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { weight: "100", label: "Thin 100" },
                      { weight: "300", label: "Light 300" },
                      { weight: "400", label: "Regular 400" },
                      { weight: "500", label: "Medium 500" },
                      { weight: "600", label: "SemiBold 600" },
                      { weight: "700", label: "Bold 700" },
                      { weight: "800", label: "ExBold 800" },
                      { weight: "900", label: "Black 900" },
                    ].map((w) => {
                      const isActive = (style.font_weight || "700") === w.weight;
                      return (
                        <button
                          key={w.weight}
                          type="button"
                          onClick={() => handleUpdateStyle("font_weight", w.weight)}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all text-center border ${
                            isActive
                              ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Font Style (Italic & Letter Case) */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStyle("font_style" as any, (style as any).font_style === "italic" ? "normal" : "italic")}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        (style as any).font_style === "italic"
                          ? "bg-purple-600/30 border-purple-500 text-purple-300 ring-1 ring-purple-400"
                          : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="italic font-serif font-bold text-sm">I</span>
                      <span>Italic Style</span>
                    </button>

                    <div className="flex-1 flex bg-gray-950 rounded-xl border border-gray-800 p-0.5">
                      {[
                        { id: "uppercase", label: "ALL CAPS" },
                        { id: "capitalize", label: "Title" },
                        { id: "none", label: "normal" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleUpdateStyle("text_transform", t.id as any)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            style.text_transform === t.id
                              ? "bg-emerald-600 text-white shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtitle Animations Selector (Samsaam / Viral Reels Style) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 font-semibold">Select your animation</label>
                    <span className="text-[10px] text-emerald-400 font-mono">20+ Styles</span>
                  </div>

                  {/* Interactive Animation Pill Buttons Grid like Samsaam */}
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {[
                      { id: "bouncy_drop", name: "Bouncy Drop", icon: "⚗️" },
                      { id: "word_highlight", name: "Word by Word", icon: "⚡" },
                      { id: "wheel", name: "Wheel", icon: "🖥️" },
                      { id: "slide_down", name: "Slide Down", icon: "⬇️" },
                      { id: "bounce_left", name: "Bounce Left In", icon: "↩️" },
                      { id: "bounce_right", name: "Bounce Right", icon: "↪️" },
                      { id: "reveal", name: "Reveal", icon: "📊" },
                      { id: "fade_down", name: "Fade Down", icon: "🌫️" },
                      { id: "flicker", name: "Flicker", icon: "💡" },
                      { id: "blur", name: "Blur", icon: "👁️" },
                      { id: "hop", name: "Hop", icon: "🦘" },
                      { id: "slide_right", name: "Slide Right In", icon: "➡️" },
                      { id: "bouncy_reveal", name: "Bouncy Reveal", icon: "💥" },
                      { id: "bounce_pop", name: "Bounce (MrBeast)", icon: "🌟" },
                      { id: "slide_upward", name: "Slide Upward", icon: "⬆️" },
                      { id: "zoom_stamp", name: "Rise / Stamp", icon: "🚀" },
                      { id: "box_highlight", name: "Box Marker", icon: "🖊️" },
                      { id: "neon_glow", name: "Neon Glow", icon: "🔮" },
                      { id: "wiggle", name: "Wiggle", icon: "🎯" },
                      { id: "karaoke", name: "TikTok Wave", icon: "🌊" },
                      { id: "fade", name: "Fade", icon: "✨" },
                      { id: "none", name: "None", icon: "🚫" },
                    ].map((anim) => {
                      const isActive = style.animation_type === anim.id;
                      return (
                        <button
                          key={anim.id}
                          onClick={() => handleUpdateStyle("animation_type", anim.id as any)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all text-left ${
                            isActive
                              ? "bg-blue-600/30 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
                              : "bg-gray-950/80 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                          }`}
                        >
                          <span className="text-sm shrink-0">{anim.icon}</span>
                          <span className="truncate">{anim.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Caption Line Layout (Single Line vs Multi-Line) */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-xs">Caption Line Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleLineMode(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        singleLineMode
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10 font-bold ring-1 ring-emerald-500/40"
                          : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>— 1 Single Line</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleLineMode(false)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        !singleLineMode
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/10 font-bold ring-1 ring-emerald-500/40"
                          : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>☰ Multi-Line Wrap</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    {singleLineMode ? "✓ 1 Single Line: Text stays horizontally unified on 1 clean line." : "Multi-line: Text wraps into 2-3 lines when box is narrow."}
                  </span>
                </div>

                {/* Font Size & Quick Presets */}
                <div>
                  <div className="flex justify-between font-semibold text-gray-300 mb-1">
                    <span>Font Size</span>
                    <span className="text-emerald-400 font-mono">{style.font_size}px</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[
                      { label: "XS", size: 18 },
                      { label: "SM", size: 22 },
                      { label: "MD (Default)", size: 26 },
                      { label: "LG", size: 32 },
                      { label: "XL", size: 40 },
                    ].map((p) => (
                      <button
                        key={p.size}
                        type="button"
                        onClick={() => handleUpdateStyle("font_size", p.size)}
                        className={`flex-1 py-1 text-[10px] font-mono rounded-lg border transition-all ${
                          style.font_size === p.size
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold"
                            : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="68"
                    value={style.font_size}
                    onChange={(e) => handleUpdateStyle("font_size", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Primary & Highlight Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Base Text Color</label>
                    <div className="flex items-center gap-2 bg-gray-950 p-2 rounded-xl border border-gray-800">
                      <input
                        type="color"
                        value={style.primary_color}
                        onChange={(e) => handleUpdateStyle("primary_color", e.target.value)}
                        className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-gray-400">{style.primary_color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Active Word Highlight</label>
                    <div className="flex items-center gap-2 bg-gray-950 p-2 rounded-xl border border-gray-800">
                      <input
                        type="color"
                        value={style.highlight_color}
                        onChange={(e) => handleUpdateStyle("highlight_color", e.target.value)}
                        className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-gray-400">{style.highlight_color}</span>
                    </div>
                  </div>
                </div>

                {/* Text Outline & Color (Clean Default) */}
                <div>
                  <div className="flex justify-between font-semibold text-gray-300 mb-1">
                    <span>Outline Stroke</span>
                    <span className="text-emerald-400 font-mono">{style.outline_width}px</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={Math.min(style.outline_width ?? 1, 4)}
                      onChange={(e) => handleUpdateStyle("outline_width", parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <input
                      type="color"
                      value={style.outline_color || "#000000"}
                      onChange={(e) => handleUpdateStyle("outline_color", e.target.value)}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                      title="Outline Color"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Professional default: 1px subtle stroke.</span>
                </div>

                {/* 3D Drop Shadow */}
                <div>
                  <div className="flex justify-between font-semibold text-gray-300 mb-1">
                    <span>3D Shadow Offset</span>
                    <span className="text-emerald-400 font-mono">{style.shadow_offset}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={Math.min(style.shadow_offset ?? 1, 4)}
                    onChange={(e) => handleUpdateStyle("shadow_offset", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Subtle soft shadow depth.</span>
                </div>

                {/* Max words per line */}
                <div>
                  <div className="flex justify-between font-semibold text-gray-300 mb-1">
                    <span>Words Per Subtitle Card</span>
                    <span className="text-emerald-400 font-mono">{style.max_words_per_line || 3} words</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={style.max_words_per_line || 3}
                    onChange={(e) => handleUpdateWordsPerCard(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">
                    TikTok & Reels viral standard: 2-3 words per card.
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. PREPARE YOUR MEDIA MODAL */}
      {isPrepareMediaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Prepare Your Media</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select a language to transcribe your media.
                </p>
              </div>
              {!isTranscribing && (
                <button
                  onClick={() => setIsPrepareMediaOpen(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Video Thumbnail Box with Ready status */}
            <div className="relative rounded-2xl bg-black border border-gray-800 overflow-hidden mb-5 h-44 flex items-center justify-center">
              {project.thumbnail_url ? (
                <img
                  src={project.thumbnail_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <Film className="w-10 h-10 text-gray-700" />
                </div>
              )}
              {/* Play Badge */}
              <div className="absolute w-12 h-12 rounded-full bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
              {/* Ready status indicator badge */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur px-2.5 py-1 rounded-full border border-gray-700 text-[11px] flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready for processing</span>
              </div>
            </div>

            {/* Language Settings */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-gray-300 block mb-2">Language Settings</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      What language is spoken?
                    </label>
                    <select
                      value={spokenLang}
                      onChange={(e) => setSpokenLang(e.target.value)}
                      disabled={isTranscribing}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="auto">Auto-Detect Language</option>
                      <option value="en">English</option>
                      <option value="ur">Urdu (اردو)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="ar">Arabic (العربية)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Writing system used?
                    </label>
                    <select
                      value={writingScript}
                      onChange={(e) => setWritingScript(e.target.value)}
                      disabled={isTranscribing}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="latin">Latin / English Script</option>
                      <option value="roman_urdu">Hinglish / Roman Urdu (for Reels/TikTok)</option>
                      <option value="nastaliq">Nastaliq Urdu (اردو)</option>
                      <option value="devanagari">Devanagari (हिन्दी)</option>
                      <option value="arabic">Arabic (العربية)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Toggles: Audio Enhancement & Emojis */}
              <div className="space-y-2.5 pt-1">
                {/* Audio Enhancement Toggle */}
                <div className="p-3 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Audio Enhancement</span>
                      <span className="text-[11px] text-gray-400">
                        Clean up audio quality for better transcription accuracy
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enhanceAudio}
                    onChange={(e) => setEnhanceAudio(e.target.checked)}
                    disabled={isTranscribing}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Emojis Toggle */}
                <div className="p-3 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Smile className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">Emojis</span>
                      <span className="text-[11px] text-gray-400">
                        Add engaging emojis to your captions automatically
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={addEmojis}
                    onChange={(e) => setAddEmojis(e.target.checked)}
                    disabled={isTranscribing}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Real Progress Bar */}
              {isTranscribing && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-gray-400">
                    <span className="truncate">{transcribeMsg || "Transcribing audio with Groq Whisper-Large-V3 AI..."}</span>
                    <span className="font-mono text-emerald-400 font-bold">{transcribeProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 ease-out"
                      style={{ width: `${transcribeProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              {!isTranscribing && (
                <button
                  onClick={() => setIsPrepareMediaOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleStartTranscription}
                disabled={isTranscribing}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isTranscribing ? "Generating Captions..." : "Generate Captions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIDEO EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Export Rendered Video</h3>
              </div>
              {!isExporting && (
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs font-mono p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {exportResult ? (
              /* Success / Download State */
              <div className="space-y-6 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Video Rendered Successfully!</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Output verified with FFprobe ({formatBytes(exportResult.file_size_bytes)}). Subtitles burned at exact position.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={exportResult.download_url}
                    download
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Rendered MP4 Video</span>
                  </a>

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={exportResult.srt_url}
                      download
                      className="py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download .SRT
                    </a>
                    <a
                      href={exportResult.vtt_url}
                      download
                      className="py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download .VTT
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setExportResult(null);
                      setIsExportModalOpen(false);
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Done & Return to Studio
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration / Progress State */
              <div className="space-y-5 text-xs">
                {/* Resolution */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">Output Quality</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["original", "1080p", "720p", "480p"] as const).map((r) => (
                      <button
                        key={r}
                        disabled={isExporting}
                        onClick={() => setExportRes(r)}
                        className={`py-2 rounded-xl font-semibold transition-colors ${
                          exportRes === r
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-950 text-gray-400 hover:text-white border border-gray-800"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect ratio reminder */}
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Framing Aspect Ratio</span>
                  <span className="text-emerald-400 font-mono font-bold uppercase">{aspectRatioMode}</span>
                </div>

                {/* Burn Subtitles Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <div>
                    <span className="text-gray-200 font-semibold block">Burn Subtitles Into Video</span>
                    <span className="text-gray-500 text-[11px]">Renders styled ASS captions permanently at exact dragged position</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportBurn}
                    onChange={(e) => setExportBurn(e.target.checked)}
                    disabled={isExporting}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Export Progress Bar */}
                {isExporting && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-gray-400">
                      <span>{exportMsg || "Encoding video frames with FFmpeg..."}</span>
                      <span className="font-mono text-emerald-400 font-bold">{exportProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="mt-6 flex justify-end gap-3 pt-2">
                  {!isExporting && (
                    <button
                      onClick={() => setIsExportModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl font-semibold text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleStartExport}
                    disabled={isExporting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {isExporting ? "Rendering with FFmpeg..." : "Start Render"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
