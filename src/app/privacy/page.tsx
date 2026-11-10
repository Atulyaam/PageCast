import Link from "next/link";
import type { Metadata } from "next";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";

export const metadata: Metadata = {
  title: "Privacy Policy — PageCast",
  description: "PageCast zero-tracking, local-first privacy policy and sensor usage transparency.",
};

export default function PrivacyPage() {
  return (
    <PageCastDeviceShell mode="reader">
      <div className="space-y-6 font-mono text-[#b8d1a2]">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#253328] pb-3">
          <div className="flex items-center gap-3">
            <span className="bg-[#38bdf8] px-2 py-0.5 text-xs font-black text-[#080d0a]">
              PAGECAST
            </span>
            <span className="text-xs tracking-widest text-[#879b83]">P198 • PRIVACY CHARTER</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/pages/100" className="text-[#f6dfa9] hover:underline">
              [P100 INDEX]
            </Link>
            <Link href="/about" className="text-[#38bdf8] hover:underline">
              [ABOUT]
            </Link>
            <Link href="/" className="text-[#e5e7eb] hover:underline">
              [HOME]
            </Link>
          </div>
        </header>

        {/* Core Privacy Stance */}
        <section className="rounded border border-[#38bdf8] bg-[#0d140f] p-4 sm:p-5">
          <h1 className="mb-3 text-lg font-black tracking-wider text-[#38bdf8] uppercase sm:text-xl">
            Zero Tracking. Local-First. Transparent.
          </h1>
          <p className="text-xs leading-relaxed text-[#b8d1a2] sm:text-sm">
            Broadcast radio and television Teletext had a fundamental privacy virtue:{" "}
            <strong>receivers do not transmit back</strong>. You could read news without being
            tracked, profiled, or analyzed. PageCast is built on this exact principle.
          </p>
        </section>

        {/* Detailed Sections */}
        <section className="space-y-4 text-xs text-[#879b83]">
          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase">
              1. Zero Telemetry &amp; No Analytics
            </h2>
            <p className="leading-relaxed">
              PageCast contains <strong>zero third-party tracking scripts</strong>, zero advertising
              trackers, zero behavioral analytics, and zero social media beacons. Your reading
              habits, dialed page numbers, and session durations remain strictly private on your
              device.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#54b77a] uppercase">
              2. Local-First Offline Vault
            </h2>
            <p className="leading-relaxed">
              When you save bulletins or import JSON PagePacks, they are stored directly in your
              browser&apos;s local IndexedDB (<code>PageCastOfflineDB</code>). This data is never
              uploaded or synchronized to external servers unless you explicitly choose to publish
              through Publisher Studio.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#38bdf8] uppercase">
              3. Camera Usage &amp; Sensor Isolation
            </h2>
            <p className="leading-relaxed">
              The camera permission requested by the QR Scanner modal is used{" "}
              <strong>strictly in real-time</strong> to decode optical QR barcodes and animated
              air-gap frames. Video frames are analyzed in local browser memory and are{" "}
              <strong>never recorded, stored, or transmitted</strong> over any network.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#f87171] uppercase">
              4. Server-Side Security &amp; Key Boundaries
            </h2>
            <p className="leading-relaxed">
              Database and AI credentials (such as Google Gemini API keys or Supabase service keys)
              are strictly isolated to server environments. They are never delivered to the client
              bundle or accessible through the browser terminal.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#253328] pt-4 text-xs text-[#879b83]">
          <div>PAGECAST PRIVACY CHARTER • COMPLIANT WITH GDPR &amp; CCPA PRINCIPLES</div>
          <div className="flex gap-4">
            <Link href="/about" className="underline hover:text-[#38bdf8]">
              About
            </Link>
            <Link href="/content-policy" className="underline hover:text-[#38bdf8]">
              Content Policy
            </Link>
          </div>
        </footer>
      </div>
    </PageCastDeviceShell>
  );
}
