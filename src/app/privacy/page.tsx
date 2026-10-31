import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PageCast",
  description:
    "PageCast zero-tracking, local-first privacy policy and sensor usage transparency.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-cyan-400 selection:text-black p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <header className="border-b border-cyan-400 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-cyan-400 text-black px-2 py-0.5 text-xs font-black">PAGECAST</span>
            <span className="text-sm tracking-widest text-neutral-400">P198 • PRIVACY CHARTER</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/pages/100" className="text-yellow-400 hover:underline">
              [P100 INDEX]
            </Link>
            <Link href="/about" className="text-cyan-400 hover:underline">
              [ABOUT]
            </Link>
            <Link href="/" className="text-white hover:underline">
              [HOME]
            </Link>
          </div>
        </header>

        {/* Core Privacy Stance */}
        <section className="border-2 border-cyan-400/80 bg-neutral-950 p-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <h1 className="text-2xl sm:text-3xl font-black text-cyan-400 uppercase tracking-wider mb-4">
            Zero Tracking. Local-First. Transparent.
          </h1>
          <p className="text-neutral-300 text-sm leading-relaxed">
            Broadcast radio and television Teletext had a fundamental privacy virtue:{" "}
            <strong>receivers do not transmit back</strong>. You could read news without being tracked,
            profiled, or analyzed. PageCast is built on this exact principle.
          </p>
        </section>

        {/* Detailed Sections */}
        <section className="space-y-6 text-sm text-neutral-300">
          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-2">
            <h2 className="text-yellow-400 font-bold uppercase tracking-wider text-base">
              1. Zero Telemetry &amp; No Analytics
            </h2>
            <p className="leading-relaxed text-xs text-neutral-400">
              PageCast contains <strong>zero third-party tracking scripts</strong>, zero advertising
              trackers, zero behavioral analytics, and zero social media beacons. Your reading habits,
              dialed page numbers, and session durations remain strictly private on your device.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-2">
            <h2 className="text-green-400 font-bold uppercase tracking-wider text-base">
              2. Local-First Offline Vault
            </h2>
            <p className="leading-relaxed text-xs text-neutral-400">
              When you save bulletins or import JSON PagePacks, they are stored directly in your
              browser&apos;s local IndexedDB (<code>PageCastOfflineDB</code>). This data is never uploaded
              or synchronized to external servers unless you explicitly choose to publish through Publisher Studio.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-2">
            <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-base">
              3. Camera Usage &amp; Sensor Isolation
            </h2>
            <p className="leading-relaxed text-xs text-neutral-400">
              The camera permission requested by the QR Scanner modal is used <strong>strictly in real-time</strong> to decode optical QR barcodes and animated air-gap frames. Video frames are analyzed in local browser memory and are <strong>never recorded, stored, or transmitted</strong> over any network.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-2">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-base">
              4. Server-Side Security &amp; Key Boundaries
            </h2>
            <p className="leading-relaxed text-xs text-neutral-400">
              Database and AI credentials (such as Google Gemini API keys or Supabase service keys) are
              strictly isolated to server environments. They are never delivered to the client bundle or accessible through the browser terminal.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
          <div>PAGECAST PRIVACY CHARTER • COMPLIANT WITH GDPR &amp; CCPA PRINCIPLES</div>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-cyan-400 underline">
              About
            </Link>
            <Link href="/content-policy" className="hover:text-cyan-400 underline">
              Content Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
