import Link from "next/link";

export default function NotFound() {
  return (
    <main
      role="main"
      aria-label="404 Page Not Found"
      className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-mono text-white selection:bg-yellow-400 selection:text-black"
    >
      <div className="w-full max-w-xl border-2 border-yellow-400 bg-neutral-950 p-6 shadow-[0_0_20px_rgba(255,255,0,0.2)]">
        {/* Teletext Header Bar */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-yellow-400 pb-2 text-sm font-bold tracking-wider">
          <span className="text-yellow-400">PAGECAST</span>
          <span className="text-white">P404</span>
          <span className="text-cyan-400">SIGNAL LOST</span>
        </div>

        {/* CRT Error Message */}
        <div className="my-8 space-y-4 text-center">
          <p className="animate-pulse text-xl font-bold tracking-widest text-red-500 uppercase">
            ★ ERROR: PAGE NOT FOUND ★
          </p>
          <p className="text-sm leading-relaxed text-neutral-300">
            The requested transmission number or document does not exist in the current broadcast
            stream.
          </p>
        </div>

        {/* Fastext Navigation Shortcuts */}
        <div className="mt-6 border-t border-neutral-800 pt-6">
          <p className="mb-4 text-center text-xs tracking-wider text-neutral-400 uppercase">
            SELECT A RECOVERY FREQUENCY:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/pages/100"
              className="flex items-center justify-between border border-red-500 bg-red-950/40 px-4 py-2 font-bold text-red-300 transition-colors hover:bg-red-900/60"
            >
              <span>[RED] INDEX</span>
              <span>P100</span>
            </Link>
            <Link
              href="/pages/200"
              className="flex items-center justify-between border border-green-500 bg-green-950/40 px-4 py-2 font-bold text-green-300 transition-colors hover:bg-green-900/60"
            >
              <span>[GRN] TECH</span>
              <span>P200</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between border border-yellow-500 bg-yellow-950/40 px-4 py-2 font-bold text-yellow-300 transition-colors hover:bg-yellow-900/60"
            >
              <span>[YEL] HOME</span>
              <span>HOME</span>
            </Link>
            <Link
              href="/publisher"
              className="flex items-center justify-between border border-cyan-500 bg-cyan-950/40 px-4 py-2 font-bold text-cyan-300 transition-colors hover:bg-cyan-900/60"
            >
              <span>[CYN] STUDIO</span>
              <span>PUB</span>
            </Link>
          </div>
        </div>

        {/* Footer Prompt */}
        <div className="mt-8 text-center text-xs text-neutral-500">
          PAGECAST BROADCAST SYSTEM • 40 COLUMNS • ISO-646
        </div>
      </div>
    </main>
  );
}
