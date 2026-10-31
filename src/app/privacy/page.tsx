import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PageCast",
  description: "PageCast zero-tracking, local-first privacy policy and sensor usage transparency.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black p-4 font-mono text-white selection:bg-cyan-400 selection:text-black sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-400 pb-4">
          <div className="flex items-center gap-3">
            <span className="bg-cyan-400 px-2 py-0.5 text-xs font-black text-black">PAGECAST</span>
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
          <h1 className="mb-4 text-2xl font-black tracking-wider text-cyan-400 uppercase sm:text-3xl">
            Zero Tracking. Local-First. Transparent.
          </h1>
          <p className="text-sm leading-relaxed text-neutral-300">
            Broadcast radio and television Teletext had a fundamental privacy virtue:{" "}
            <strong>receivers do not transmit back</strong>. You could read news without being
            tracked, profiled, or analyzed. PageCast is built on this exact principle.
          </p>
        </section>

        {/* Detailed Sections */}
        <section className="space-y-6 text-sm text-neutral-300">
          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-yellow-400 uppercase">
              1. Zero Telemetry &amp; No Analytics
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              PageCast contains <strong>zero third-party tracking scripts</strong>, zero advertising
              trackers, zero behavioral analytics, and zero social media beacons. Your reading
              habits, dialed page numbers, and session durations remain strictly private on your
              device.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-green-400 uppercase">
              2. Local-First Offline Vault
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              When you save bulletins or import JSON PagePacks, they are stored directly in your
              browser&apos;s local IndexedDB (<code>PageCastOfflineDB</code>). This data is never
              uploaded or synchronized to external servers unless you explicitly choose to publish
              through Publisher Studio.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-cyan-400 uppercase">
              3. Camera Usage &amp; Sensor Isolation
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              The camera permission requested by the QR Scanner modal is used{" "}
              <strong>strictly in real-time</strong> to decode optical QR barcodes and animated
              air-gap frames. Video frames are analyzed in local browser memory and are{" "}
              <strong>never recorded, stored, or transmitted</strong> over any network.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-red-400 uppercase">
              4. Server-Side Security &amp; Key Boundaries
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              Database and AI credentials (such as Google Gemini API keys or Supabase service keys)
              are strictly isolated to server environments. They are never delivered to the client
              bundle or accessible through the browser terminal.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <div>PAGECAST PRIVACY CHARTER • COMPLIANT WITH GDPR &amp; CCPA PRINCIPLES</div>
          <div className="flex gap-4">
            <Link href="/about" className="underline hover:text-cyan-400">
              About
            </Link>
            <Link href="/content-policy" className="underline hover:text-cyan-400">
              Content Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
