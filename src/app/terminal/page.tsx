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
    <div className="flex min-h-screen flex-col font-sans">
      {/* Top Instrumentation Rail */}
      <header className="sticky top-0 z-30 border-b border-[#1b201c] bg-[#222723] px-3 py-2 text-[#b7c9a8] shadow-md sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="font-mono text-base font-black tracking-tight text-[#f6dfa9] transition-opacity hover:opacity-80 sm:text-lg"
            >
              PAGECAST
            </Link>
            <span className="rounded-xs border border-[#3b453e] bg-[#161a17] px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#22c55e] uppercase">
              DEDICATED TERMINAL
            </span>
          </div>

          <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto font-mono text-xs sm:gap-3">
            <Link
              href="/"
              className="rounded-xs border border-[#3b453e] bg-[#2b352e] px-2.5 py-1 font-bold text-[#b7c9a8] transition-all hover:text-white"
            >
              EXIT TERMINAL
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
          </nav>
        </div>
      </header>

      {/* Main Full-Screen Terminal */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center p-2 sm:p-6 lg:p-8">
        <WebTerminal initialPageNumber={initialPage} />
      </main>
    </div>
  );
}
