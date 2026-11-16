import Link from "next/link";
import { Wand2, Github, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Wand2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white">CapScribe AI</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Open-source, local-first AI video captioning studio. Auto-generate timestamped captions, apply viral presets, and render with FFmpeg.
            </p>
            <div className="flex items-center gap-3 pt-2 text-gray-400">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Local AI Engine Active
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-200 tracking-wider uppercase">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Video Studio</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/templates" className="hover:text-white transition-colors">Template Library</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Languages & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-200 tracking-wider uppercase">Supported Languages</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-300">English (Auto-transcribe)</li>
              <li className="text-gray-300">Urdu & Roman Urdu</li>
              <li className="text-gray-300">Hindi & Punjabi</li>
              <li className="text-gray-300">Arabic & Persian</li>
              <li className="text-gray-300">90+ Global Languages</li>
            </ul>
          </div>

          {/* Legal & Docs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-200 tracking-wider uppercase">Legal & Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CapScribe AI. All rights reserved. Built for creators worldwide.</p>
          <p>Local AI Studio with Faster-Whisper & FFmpeg.</p>
        </div>
      </div>
    </footer>
  );
}
