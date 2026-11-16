export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">Terms of Service</h1>
      <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
        <p>Last updated: November 2026</p>
        <p>
          Welcome to CapScribe AI. By accessing or using our application, you agree to comply with and be bound by the following terms.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">1. Use of the Software</h2>
        <p>
          CapScribe AI provides open-source and modular video captioning capabilities. You are responsible for ensuring that you have the right to process, transcribe, and edit any video or audio content you upload.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">2. Intellectual Property</h2>
        <p>
          You retain all rights and ownership to the original videos, transcripts, and rendered media generated with CapScribe AI. We do not claim any proprietary ownership over your creations.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">3. Local Execution & Liability</h2>
        <p>
          The software is provided &quot;as is&quot; without warranties of any kind. You assume responsibility for local machine resources, FFmpeg execution, and any disk space consumed during video rendering.
        </p>
      </div>
    </div>
  );
}
