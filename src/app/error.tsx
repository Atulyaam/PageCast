"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // Log error to client console or server-side logging pipeline
    console.error("PageCast Client Error Boundary caught:", error);
  }, [error]);

  return (
    <main
      role="main"
      aria-label="Application Error"
      className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-4 selection:bg-red-500 selection:text-black"
    >
      <div className="w-full max-w-xl border-2 border-red-500 bg-neutral-950 p-6 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
        {/* Teletext Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-red-500 pb-2 mb-6 text-sm font-bold tracking-wider">
          <span className="text-red-500">PAGECAST</span>
          <span className="text-white">P888</span>
          <span className="text-yellow-400">SIGNAL FAULT</span>
        </div>

        {/* CRT Error Message */}
        <div className="space-y-4 text-center my-6">
          <p className="text-red-500 font-bold text-xl uppercase tracking-widest animate-pulse">
            ★ TRANSMISSION INTERRUPTED ★
          </p>
          <p className="text-neutral-300 text-sm leading-relaxed">
            A signal decoding anomaly occurred while rendering this broadcast frame. No broadcast
            data was lost.
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-500 font-mono tracking-widest">
              {`DIAGNOSTIC DIGEST: ${error.digest}`}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="border-t border-neutral-800 pt-6 mt-6 space-y-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-wider text-sm transition-colors cursor-pointer"
          >
            [RETRY SIGNAL RECEPTION]
          </button>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/pages/100"
              className="flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-yellow-300 px-4 py-2 font-bold transition-colors text-center"
            >
              [100] MAIN INDEX
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 px-4 py-2 font-bold transition-colors text-center"
            >
              [HOME] RETURN
            </Link>
          </div>
        </div>

        {/* Invariant Footer */}
        <div className="mt-8 text-center text-xs text-neutral-600">
          SECURE ISOLATION ACTIVE • ZERO LEAKED STACK TRACES
        </div>
      </div>
    </main>
  );
}
