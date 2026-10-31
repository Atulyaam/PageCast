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
      className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-mono text-white selection:bg-red-500 selection:text-black"
    >
      <div className="w-full max-w-xl border-2 border-red-500 bg-neutral-950 p-6 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
        {/* Teletext Header Bar */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-red-500 pb-2 text-sm font-bold tracking-wider">
          <span className="text-red-500">PAGECAST</span>
          <span className="text-white">P888</span>
          <span className="text-yellow-400">SIGNAL FAULT</span>
        </div>

        {/* CRT Error Message */}
        <div className="my-6 space-y-4 text-center">
          <p className="animate-pulse text-xl font-bold tracking-widest text-red-500 uppercase">
            ★ TRANSMISSION INTERRUPTED ★
          </p>
          <p className="text-sm leading-relaxed text-neutral-300">
            A signal decoding anomaly occurred while rendering this broadcast frame. No broadcast
            data was lost.
          </p>
          {error.digest && (
            <p className="font-mono text-xs tracking-widest text-neutral-500">
              {`DIAGNOSTIC DIGEST: ${error.digest}`}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 space-y-3 border-t border-neutral-800 pt-6">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full cursor-pointer bg-red-600 py-3 text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-red-500"
          >
            [RETRY SIGNAL RECEPTION]
          </button>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/pages/100"
              className="flex items-center justify-center border border-neutral-700 bg-neutral-900 px-4 py-2 text-center font-bold text-yellow-300 transition-colors hover:bg-neutral-800"
            >
              [100] MAIN INDEX
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center border border-neutral-700 bg-neutral-900 px-4 py-2 text-center font-bold text-cyan-300 transition-colors hover:bg-neutral-800"
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
