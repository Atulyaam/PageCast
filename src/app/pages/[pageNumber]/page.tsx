import Link from "next/link";
import { notFound } from "next/navigation";
import { WebTerminal } from "@/components/teletext/WebTerminal";
import { isValidPageNumber } from "@/domain/validation/page-number";

interface PageProps {
  params: Promise<{
    pageNumber: string;
  }>;
}

export default async function PageRoute({ params }: PageProps) {
  const { pageNumber } = await params;
  const num = parseInt(pageNumber, 10);

  if (!isValidPageNumber(num)) {
    notFound();
  }

  return (
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Header */}
      <header className="border-surface-border bg-surface-panel/80 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-teletext-yellow font-mono text-xl font-bold tracking-tight transition-all hover:opacity-80"
            >
              PAGECAST
            </Link>
            <span className="bg-surface-border text-teletext-cyan rounded px-2 py-0.5 font-mono text-[11px]">
              P{num}
            </span>
          </div>

          <nav className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-text-muted hover:text-teletext-white transition-all">
              HOME
            </Link>
            <Link
              href="/catalogue"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              CATALOGUE
            </Link>
            <Link
              href="/saved"
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              SAVED
            </Link>
            <Link
              href={`/terminal?page=${num}`}
              className="text-text-muted hover:text-teletext-white transition-all"
            >
              FULLSCREEN
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Terminal */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <WebTerminal initialPageNumber={num} />
      </main>

      {/* Footer */}
      <footer className="border-surface-border text-text-muted border-t px-4 py-4 text-center font-mono text-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span>PAGECAST &bull; Teletext Page {num}</span>
          <Link href="/" className="text-teletext-yellow hover:underline">
            Back to Index (P100)
          </Link>
        </div>
      </footer>
    </div>
  );
}
