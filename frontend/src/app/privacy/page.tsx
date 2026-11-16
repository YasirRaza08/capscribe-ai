export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
        <p>Last updated: November 2026</p>
        <p>
          At CapScribe AI, we take creator privacy seriously. Our architecture is designed local-first, meaning your video recordings, audio tracks, and transcripts are processed directly on your workstation by default.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">1. Information We Collect</h2>
        <p>
          When running in local development mode, no video media or audio files are transmitted to external cloud servers. All video files uploaded to CapScribe remain within your local workspace directory.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">2. AI Transcription Processing</h2>
        <p>
          Our speech recognition engine uses Faster-Whisper, which executes locally on your CPU or GPU. We do not use third-party APIs that store or train on your spoken audio.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">3. Cloud Deployment Considerations</h2>
        <p>
          If you deploy this application as a hosted SaaS with Supabase and Cloudflare R2, media files and user authentication tokens are stored securely with Row Level Security (RLS) policies ensuring users only have access to their own projects.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">4. Contact</h2>
        <p>
          For privacy inquiries, please contact privacy@capscribe.ai.
        </p>
      </div>
    </div>
  );
}
