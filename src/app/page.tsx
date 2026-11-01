import Link from "next/link";
import { WebTerminal } from "@/components/teletext/WebTerminal";

export default function Home() {
  return (
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Header */}
      <header className="border-surface-border bg-surface-panel/85 sticky top-0 z-30 border-b px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-teletext-yellow font-mono text-lg font-bold tracking-tight sm:text-xl">
                PAGECAST
              </span>
              <span className="bg-surface-border text-teletext-cyan rounded px-2 py-0.5 font-mono text-[11px] sm:text-xs">
                TELETEXT 2026
              </span>
            </div>
          </div>

          <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5 font-mono text-xs sm:gap-3 sm:text-sm">
            <Link
              href="/"
              className="btn-tactile text-teletext-yellow rounded px-2 py-1 font-bold transition-all hover:bg-zinc-800/60"
            >
              READER
            </Link>
            <Link
              href="/terminal"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="btn-tactile text-text-muted hover:text-teletext-white rounded px-2 py-1 transition-all hover:bg-zinc-800/60"
            >
              SAVED
            </Link>
            <Link
              href="/publisher/ingest"
              className="btn-tactile border-teletext-yellow/40 bg-teletext-yellow/10 text-teletext-yellow hover:bg-teletext-yellow/20 shrink-0 rounded border px-2.5 py-1 font-semibold transition-all"
            >
              PUBLISHER STUDIO
            </Link>
            <span className="text-surface-border-subtle hidden lg:inline">|</span>
            <span className="text-text-muted hidden lg:inline">KIROWEEN 2026</span>
          </nav>
        </div>
      </header>

      {/* Main Terminal Area */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <WebTerminal initialPageNumber={100} />
      </main>

      {/* Footer */}
      <footer className="border-surface-border text-text-muted border-t px-4 py-4 text-center font-mono text-xs">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>PAGECAST &bull; AI-Powered Low-Bandwidth Teletext &bull; Kiroween 2026</span>
          <span className="text-teletext-green">100% OFFLINE READY &bull; SUB-10 KiB</span>
        </div>
      </footer>
    </div>
  );
}
