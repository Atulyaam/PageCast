import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About PageCast — Resurrecting Broadcast Teletext for 2026",
  description:
    "How PageCast brings 1970s broadcast Teletext into the modern era for low-bandwidth, emergency, and accessible communications.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-yellow-400 selection:text-black p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <header className="border-b border-yellow-400 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-yellow-400 text-black px-2 py-0.5 text-xs font-black">PAGECAST</span>
            <span className="text-sm tracking-widest text-neutral-400">P199 • SYSTEM ABOUT</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/pages/100" className="text-yellow-400 hover:underline">
              [P100 INDEX]
            </Link>
            <Link href="/publisher" className="text-cyan-400 hover:underline">
              [STUDIO]
            </Link>
            <Link href="/" className="text-white hover:underline">
              [HOME]
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="border-2 border-yellow-400/80 bg-neutral-950 p-6 shadow-[0_0_20px_rgba(255,255,0,0.15)]">
          <h1 className="text-2xl sm:text-3xl font-black text-yellow-400 uppercase tracking-wider mb-4">
            Resurrecting Broadcast Teletext for the Modern Era
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            In 1974, the BBC launched <strong>Ceefax</strong>, the world&apos;s first teletext information
            service. Transmitted invisibly within the vertical blanking interval of television
            signals, it delivered news, weather, and crisis updates instantly using almost zero bandwidth.
          </p>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mt-3">
            <strong>PageCast</strong> resurrects this forgotten medium for the <strong>Kiroween 2026 Hackathon</strong> (Resurrection Category). Combining retro 40x25 grid aesthetics with state-of-the-art AI summarization, cryptographic sentence provenance, and optical air-gap packet transfer, PageCast proves that low-bandwidth technology is the future of resilient communication.
          </p>
        </section>

        {/* Architecture & Technical Innovations */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-3">
            <h2 className="text-green-400 font-bold uppercase tracking-wider text-base">
              ★ 10 KiB Payload Ceiling
            </h2>
            <p className="text-neutral-400 leading-relaxed text-xs">
              Every broadcast PagePack is strictly capped at 10,240 bytes. Unlike the bloated modern
              web, PageCast transmits full multi-page editions over 2G networks, dial-up, or high-density animated QR bursts in seconds.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-3">
            <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-base">
              ★ Factual Sentence Provenance
            </h2>
            <p className="text-neutral-400 leading-relaxed text-xs">
              AI hallucinations have zero place in crisis communications. Every synthesized bullet
              point explicitly cites source sentence IDs (e.g. <code>[s1, s3]</code>), giving readers verifiable attribution back to original journalism.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-3">
            <h2 className="text-yellow-400 font-bold uppercase tracking-wider text-base">
              ★ Dual-Script Multilingual Support
            </h2>
            <p className="text-neutral-400 leading-relaxed text-xs">
              Information equity requires native language support. PageCast provides first-class
              English and Hindi (Devanagari) rendering, aligning complex conjuncts and matras within the mathematical 40-column raster.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-3">
            <h2 className="text-red-400 font-bold uppercase tracking-wider text-base">
              ★ Optical Air-Gap &amp; Offline Vault
            </h2>
            <p className="text-neutral-400 leading-relaxed text-xs">
              When terrestrial networks fail, PageCast keeps broadcasting. Receive bulletins across air-gaps via camera QR scanning and store them in an encrypted, offline-first IndexedDB vault.
            </p>
          </div>
        </section>

        {/* Footer Links */}
        <footer className="border-t border-neutral-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
          <div>PAGECAST SYSTEM • KIROWEEN 2026 • RESURRECTION CATEGORY</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-yellow-400 underline">
              Privacy Policy
            </Link>
            <Link href="/content-policy" className="hover:text-yellow-400 underline">
              Content Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
