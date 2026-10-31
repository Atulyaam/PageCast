import Link from "next/link";
import { SEED_PAGES } from "@/data/seed-pages";
import { getMagazineNumber } from "@/domain/validation/page-number";

export default function CataloguePage() {
  const magazineLabels: Record<number, string> = {
    1: "Magazine 1: General & World News",
    2: "Magazine 2: Technology & Economy",
    4: "Magazine 4: Emergency & Weather Advisories",
  };

  // Group pages by magazine
  const groupedPages: Record<number, (typeof SEED_PAGES)[number][]> = {};
  for (const page of SEED_PAGES) {
    const mag = getMagazineNumber(page.pageNumber);
    if (!groupedPages[mag]) {
      groupedPages[mag] = [];
    }
    groupedPages[mag].push(page);
  }

  return (
    <div className="bg-surface-ground text-teletext-white flex min-h-screen flex-col font-sans">
      {/* Top Header */}
      <header className="border-surface-border bg-surface-panel/80 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-teletext-yellow font-mono text-xl font-bold tracking-tight transition-all hover:opacity-80"
            >
              PAGECAST
            </Link>
            <span className="bg-surface-border text-teletext-cyan rounded px-2 py-0.5 font-mono text-[11px]">
              BROADCAST CATALOGUE
            </span>
          </div>

          <nav className="flex items-center gap-4 font-mono text-xs">
            <Link href="/" className="text-text-muted hover:text-teletext-white transition-all">
              TERMINAL
            </Link>
            <Link href="/catalogue" className="text-teletext-yellow">
              CATALOGUE
            </Link>
          </nav>
        </div>
      </header>

      {/* Catalogue Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-teletext-yellow mb-1 font-mono text-2xl font-bold">
            BROADCAST CATALOGUE
          </h1>
          <p className="text-text-muted font-mono text-xs">
            Curated ultra-low bandwidth Teletext bulletins &bull; 40x25 Logical Grid &bull; Under 10
            KiB
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPages).map(([magStr, pages]) => {
            const mag = parseInt(magStr, 10);
            return (
              <section
                key={`mag-${mag}`}
                className="bg-surface-panel border-surface-border rounded-terminal border p-4 sm:p-5"
              >
                <h2 className="text-teletext-cyan border-surface-border mb-3 border-b pb-2 font-mono text-sm font-bold">
                  {magazineLabels[mag] ?? `Magazine ${mag}`}
                </h2>

                <div className="grid grid-cols-1 gap-2.5">
                  {pages.map((p) => (
                    <Link
                      key={`page-${p.pageNumber}`}
                      href={`/pages/${p.pageNumber}`}
                      className="bg-surface-terminal border-surface-border-subtle hover:border-teletext-yellow hover:bg-surface-border/50 group flex items-center justify-between rounded border p-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-teletext-yellow font-mono text-base font-bold transition-all group-hover:scale-105">
                          P{p.pageNumber}
                        </span>
                        <div>
                          <p className="text-teletext-white group-hover:text-teletext-yellow text-sm font-semibold transition-all">
                            {p.title}
                          </p>
                          <p className="text-text-muted max-w-md truncate font-mono text-xs">
                            {p.rows[2]?.spans[0]?.text?.trim() || "Teletext Bulletin"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.language === "hi" ? (
                          <span className="bg-teletext-magenta/20 text-teletext-magenta border-teletext-magenta/30 rounded border px-2 py-0.5 font-mono text-[10px] font-bold">
                            HINDI (हिंदी)
                          </span>
                        ) : (
                          <span className="text-text-muted bg-surface-panel border-surface-border rounded border px-2 py-0.5 font-mono text-[10px]">
                            ENGLISH
                          </span>
                        )}
                        <span className="text-teletext-cyan font-mono text-xs font-bold">
                          OPEN &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-surface-border text-text-muted border-t px-4 py-4 text-center font-mono text-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span>PAGECAST &bull; Kiroween 2026</span>
          <Link href="/" className="text-teletext-yellow hover:underline">
            Terminal Reader &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}
