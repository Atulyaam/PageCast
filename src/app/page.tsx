import Link from "next/link";
import { WebTerminal } from "@/components/teletext/WebTerminal";

export default function Home() {
  return (
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Header */}
      <header className="border-surface-border bg-surface-panel/80 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-teletext-yellow font-mono text-xl font-bold tracking-tight">
              PAGECAST
            </span>
            <span className="bg-surface-border text-teletext-cyan rounded px-2 py-0.5 font-mono text-[11px]">
              TELETEXT 2026
            </span>
          </div>

          <nav className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-teletext-yellow transition-all hover:underline">
              READER
            </Link>
            <Link
              href="/catalogue"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              CATALOGUE
            </Link>
            <Link
              href="/publisher/ingest"
              className="border-teletext-yellow/40 bg-teletext-yellow/10 text-teletext-yellow hover:bg-teletext-yellow/20 rounded border px-2 py-0.5 transition-all"
            >
              PUBLISHER STUDIO
            </Link>
            <span className="text-surface-border-subtle hidden sm:inline">|</span>
            <span className="text-text-muted hidden sm:inline">KIROWEEN 2026</span>
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
