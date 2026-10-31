import Link from "next/link";

export default function NotFound() {
  return (
    <main
      role="main"
      aria-label="404 Page Not Found"
      className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-4 selection:bg-yellow-400 selection:text-black"
    >
      <div className="w-full max-w-xl border-2 border-yellow-400 bg-neutral-950 p-6 shadow-[0_0_20px_rgba(255,255,0,0.2)]">
        {/* Teletext Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-yellow-400 pb-2 mb-6 text-sm font-bold tracking-wider">
          <span className="text-yellow-400">PAGECAST</span>
          <span className="text-white">P404</span>
          <span className="text-cyan-400">SIGNAL LOST</span>
        </div>

        {/* CRT Error Message */}
        <div className="space-y-4 text-center my-8">
          <p className="text-red-500 font-bold text-xl uppercase tracking-widest animate-pulse">
            ★ ERROR: PAGE NOT FOUND ★
          </p>
          <p className="text-neutral-300 text-sm leading-relaxed">
            The requested transmission number or document does not exist in the current broadcast
            stream.
          </p>
        </div>

        {/* Fastext Navigation Shortcuts */}
        <div className="border-t border-neutral-800 pt-6 mt-6">
          <p className="text-neutral-400 text-xs uppercase tracking-wider mb-4 text-center">
            SELECT A RECOVERY FREQUENCY:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/pages/100"
              className="flex items-center justify-between bg-red-950/40 hover:bg-red-900/60 border border-red-500 text-red-300 px-4 py-2 font-bold transition-colors"
            >
              <span>[RED] INDEX</span>
              <span>P100</span>
            </Link>
            <Link
              href="/pages/200"
              className="flex items-center justify-between bg-green-950/40 hover:bg-green-900/60 border border-green-500 text-green-300 px-4 py-2 font-bold transition-colors"
            >
              <span>[GRN] TECH</span>
              <span>P200</span>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500 text-yellow-300 px-4 py-2 font-bold transition-colors"
            >
              <span>[YEL] HOME</span>
              <span>HOME</span>
            </Link>
            <Link
              href="/publisher"
              className="flex items-center justify-between bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500 text-cyan-300 px-4 py-2 font-bold transition-colors"
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
