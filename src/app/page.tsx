import Link from "next/link";
import { WebTerminal } from "@/components/teletext/WebTerminal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Top Precision Instrumentation Rail */}
      <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-base font-black tracking-tight text-[#f6dfa9] sm:text-lg">
                PAGECAST
              </span>
              <span className="rounded-xs border border-[#3b453e] bg-[#161a17] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#879b83] uppercase">
                PT-4025 SYSTEM
              </span>
            </div>
          </div>

          <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5 font-mono text-xs sm:gap-2">
            <Link
              href="/"
              className="rounded-xs border border-[#3d4b40] bg-[#2b352e] px-2.5 py-1 font-bold text-[#f6dfa9] shadow-inner transition-all"
            >
              READER
            </Link>
            <Link
              href="/terminal"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="rounded-xs border border-transparent px-2.5 py-1 text-[#879b83] transition-all hover:border-[#3b453e] hover:text-[#b7c9a8]"
            >
              SAVED
            </Link>
            <Link
              href="/publisher/ingest"
              className="rounded-xs border border-[#74581a] bg-[#3a2e12] px-2.5 py-1 font-bold text-[#f6dfa9] transition-all hover:bg-[#4a3b16]"
            >
              PUBLISHER STUDIO
            </Link>
            <span className="hidden text-[#3a443d] lg:inline">|</span>
            <span className="hidden text-[10px] tracking-widest text-[#687565] uppercase lg:inline">
              KIROWEEN 2026
            </span>
          </nav>
        </div>
      </header>

      {/* Main Tabletop Terminal Area */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-3 sm:p-6 lg:p-8">
        <WebTerminal initialPageNumber={100} />
      </main>

      {/* Precision Hardware Footer */}
      <footer className="border-t border-[#bfbcb2] px-4 py-4 text-center font-mono text-xs text-[#5e645a]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1.5 sm:flex-row">
          <span>PAGECAST &bull; AI-Powered Physical Teletext Terminal &bull; Kiroween 2026</span>
          <span className="font-bold text-[#2e5a38]">
            100% AIR-GAP CAPABLE &bull; SUB-10 KiB BROADCASTS
          </span>
        </div>
      </footer>
    </div>
  );
}
