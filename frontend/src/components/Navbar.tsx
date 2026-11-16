"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Video, LayoutDashboard, Wand2 } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isEditor = pathname.startsWith("/editor");
  if (isEditor) {
    // In editor mode, a specialized editor header is shown instead
    return null;
  }

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Templates", href: "/templates" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              CapScribe <span className="text-xs uppercase px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive ? "text-blue-400 font-semibold" : "text-gray-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free Forever
          </span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Studio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
