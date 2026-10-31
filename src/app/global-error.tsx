"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("PageCast Global Root Error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white font-mono min-h-screen flex items-center justify-center p-4">
        <main
          role="main"
          aria-label="Critical System Error"
          className="w-full max-w-xl border-4 border-red-600 bg-neutral-950 p-6 text-center shadow-[0_0_30px_rgba(220,38,38,0.5)]"
        >
          <div className="border-b-2 border-red-600 pb-2 mb-6 flex justify-between font-bold text-sm tracking-widest text-red-500">
            <span>PAGECAST SYSTEM</span>
            <span>CRITICAL FAULT</span>
          </div>

          <h1 className="text-xl font-bold uppercase tracking-widest text-red-500 mb-4 animate-pulse">
            ★ UNRECOVERABLE FRAME ERROR ★
          </h1>

          <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
            The core rendering pipeline encountered a critical fault. Stack traces have been
            suppressed for security.
          </p>

          {error.digest && (
            <p className="text-xs text-neutral-500 font-mono tracking-widest mb-6">
              {`ERROR DIGEST: ${error.digest}`}
            </p>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-wider text-sm cursor-pointer transition-colors"
          >
            REINITIALIZE TERMINAL
          </button>
        </main>
      </body>
    </html>
  );
}
