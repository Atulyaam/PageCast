import Link from "next/link";
import { WebTerminal } from "@/components/teletext/WebTerminal";
import { isValidPageNumber } from "@/domain/validation/page-number";

interface TerminalPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function TerminalPage({ searchParams }: TerminalPageProps) {
  const { page } = await searchParams;
  const num = page ? parseInt(page, 10) : 100;
  const initialPage = isValidPageNumber(num) ? num : 100;

  return (
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Bar */}
      <header className="border-surface-border bg-surface-panel/80 sticky top-0 z-30 border-b px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-teletext-yellow font-mono text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
            >
              PAGECAST
            </Link>
            <span className="bg-surface-border text-teletext-green rounded px-2 py-0.5 font-mono text-[11px]">
              DEDICATED TERMINAL
            </span>
          </div>

          <nav className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-text-muted hover:text-teletext-white transition-all">
              EXIT TERMINAL
            </Link>
            <Link
              href="/catalogue"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              CATALOGUE
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Full-Screen Terminal */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-2 sm:p-6">
        <WebTerminal initialPageNumber={initialPage} />
      </main>
    </div>
  );
}
