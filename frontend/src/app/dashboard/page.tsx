"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Video,
  UploadCloud,
  Clock,
  Sparkles,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  HardDrive,
  Coins,
  FolderOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileVideo,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { fetchProjects, fetchUser, deleteProject, duplicateProject, uploadVideo } from "@/lib/api";
import { Project, UserProfile } from "@/types";
import { formatDuration, formatBytes } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Active dropdown menu for project actions
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, p] = await Promise.all([
        fetchUser().catch(() => ({
          id: "dev-user-001",
          email: "creator@capscribe.ai",
          full_name: "Lead Creator",
          plan: "pro" as const,
          credits_remaining: 150,
          storage_used_mb: 18.4,
          total_projects: 0,
        })),
        fetchProjects().catch(() => []),
      ]);
      setUser(u);
      setProjects(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      validateAndSetFile(f);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    setUploadError(null);
    const validExtensions = [".mp4", ".mov", ".webm", ".mkv"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadError(`Invalid video format '${ext}'. Please upload an MP4, MOV, WebM, or MKV file.`);
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setUploadError("Video file exceeds the 500MB upload limit.");
      return;
    }
    setUploadFile(f);
    if (!uploadTitle) {
      setUploadTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleStartUpload = async () => {
    if (!uploadFile) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(1);

      const result = await uploadVideo(uploadFile, uploadTitle, (pct) => {
        setUploadProgress(pct);
      });

      setUploadProgress(100);

      // Close modal and redirect to editor
      setTimeout(() => {
        setIsUploadModalOpen(false);
        router.push(`/editor/${result.project.id}`);
      }, 400);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please check backend connection.");
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
        setProjects(projects.filter((p) => p.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete project");
      }
    }
    setActiveMenuId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await duplicateProject(id);
      setProjects([copy, ...projects]);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate project");
    }
    setActiveMenuId(null);
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 1. WELCOME BANNER & STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Studio Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name || "Creator"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create, transcribe, and edit viral AI captioned videos.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => {
            setUploadFile(null);
            setUploadTitle("");
            setUploadError(null);
            setIsUploadModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Video Project</span>
        </button>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
              Total Projects
            </span>
            <span className="text-3xl font-extrabold text-white">{projects.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Video className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
              Available Credits
            </span>
            <span className="text-3xl font-extrabold text-emerald-400">
              {user?.credits_remaining ?? 150}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
              Local Storage
            </span>
            <span className="text-3xl font-extrabold text-purple-400">
              {user?.storage_used_mb ?? 12.5} MB
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QUICK DRAG & DROP UPLOAD ZONE (Matching Competition Dashboard) */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={() => {
          setUploadFile(null);
          setUploadTitle("");
          setUploadError(null);
          setIsUploadModalOpen(true);
        }}
        className="mb-10 p-10 rounded-3xl bg-gray-900/30 border-2 border-dashed border-gray-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center cursor-pointer group flex flex-col items-center justify-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-gray-800/80 group-hover:bg-emerald-500/20 text-gray-400 group-hover:text-emerald-400 transition-colors flex items-center justify-center">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
            Drop your videos here or click to upload
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            Max: 30 minutes, 1GB | Supports: MP4, MOV, WebM
          </p>
        </div>
      </div>

      {/* 3. RECENT PROJECTS SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Recent Videos</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
              {filteredProjects.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">Loading studio projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty state */
          <div className="p-12 rounded-3xl bg-gray-900/20 border-2 border-dashed border-gray-800 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/80 flex items-center justify-center text-gray-500 mb-4">
              <FileVideo className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mb-6">
              {searchQuery
                ? `No projects matched "${searchQuery}". Try a different keyword.`
                : "You haven't created any video projects yet. Upload a clip to generate automatic AI captions."}
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const statusColors = {
                created: "bg-gray-800 text-gray-300",
                uploaded: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                transcribing: "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse",
                ready: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                rendering: "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse",
                error: "bg-red-500/20 text-red-400 border border-red-500/30",
              };

              return (
                <div
                  key={proj.id}
                  className="rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail Preview Area */}
                    <Link
                      href={`/editor/${proj.id}`}
                      className="block relative h-44 bg-gray-950 overflow-hidden group-hover:opacity-90 transition-opacity"
                    >
                      {proj.thumbnail_url ? (
                        <img
                          src={proj.thumbnail_url}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-950">
                          <Video className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-xs font-mono">No Thumbnail</span>
                        </div>
                      )}

                      {/* Video Duration Badge */}
                      {proj.metadata && (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-mono text-white backdrop-blur-md">
                          {formatDuration(proj.metadata.duration)}
                        </span>
                      )}

                      {/* Aspect Ratio Badge */}
                      {proj.metadata && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-gray-300 backdrop-blur-md uppercase">
                          {proj.metadata.aspect_ratio}
                        </span>
                      )}
                    </Link>

                    {/* Project Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/editor/${proj.id}`}
                          className="font-bold text-white text-base hover:text-blue-400 transition-colors line-clamp-1 flex-1"
                        >
                          {proj.title}
                        </Link>

                        {/* Menu dropdown button */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === proj.id ? null : proj.id)
                            }
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === proj.id && (
                            <div className="absolute right-0 top-7 z-30 w-36 rounded-xl bg-gray-900 border border-gray-800 shadow-xl py-1 text-xs">
                              <button
                                onClick={() => handleDuplicate(proj.id)}
                                className="w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                              >
                                <Copy className="w-3.5 h-3.5 text-blue-400" /> Duplicate
                              </button>
                              <button
                                onClick={() => handleDelete(proj.id)}
                                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                            statusColors[proj.status] || statusColors.created
                          }`}
                        >
                          {proj.status}
                        </span>
                        {proj.captions && proj.captions.length > 0 && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            {proj.captions.length} captions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-gray-950/60 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(proj.updated_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/editor/${proj.id}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Open Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. NEW PROJECT UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Create New Video Project</h3>
              </div>
              <button
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-mono p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                uploadFile
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-gray-700 bg-gray-950/60 hover:border-blue-500 hover:bg-gray-950"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                className="hidden"
              />

              {uploadFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">{uploadFile.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(uploadFile.size)}</p>
                  <span className="text-[11px] text-blue-400 underline block pt-1">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <UploadCloud className="w-10 h-10 text-gray-500 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Drag & drop your video here, or <span className="text-blue-400">browse</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Supports MP4, MOV, WebM, MKV up to 500MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Project Title</label>
              <input
                type="text"
                placeholder="My Viral Reel"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>
                    {uploadProgress >= 100
                      ? "Assembling & Probing video stream..."
                      : `Uploading chunked video (${uploadProgress}%)...`}
                  </span>
                  <span className="font-mono text-blue-400 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!uploadFile || isUploading}
                onClick={handleStartUpload}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all"
              >
                {isUploading ? "Processing Video..." : "Upload & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
