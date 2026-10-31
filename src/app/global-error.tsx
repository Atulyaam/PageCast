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
      <body className="flex min-h-screen items-center justify-center bg-black p-4 font-mono text-white">
        <main
          role="main"
          aria-label="Critical System Error"
          className="w-full max-w-xl border-4 border-red-600 bg-neutral-950 p-6 text-center shadow-[0_0_30px_rgba(220,38,38,0.5)]"
        >
          <div className="mb-6 flex justify-between border-b-2 border-red-600 pb-2 text-sm font-bold tracking-widest text-red-500">
            <span>PAGECAST SYSTEM</span>
            <span>CRITICAL FAULT</span>
          </div>

          <h1 className="mb-4 animate-pulse text-xl font-bold tracking-widest text-red-500 uppercase">
            ★ UNRECOVERABLE FRAME ERROR ★
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-neutral-300">
            The core rendering pipeline encountered a critical fault. Stack traces have been
            suppressed for security.
          </p>

          {error.digest && (
            <p className="mb-6 font-mono text-xs tracking-widest text-neutral-500">
              {`ERROR DIGEST: ${error.digest}`}
            </p>
          )}

          <button
            type="button"
            onClick={() => reset()}
            className="w-full cursor-pointer bg-red-600 py-3 text-sm font-black tracking-wider text-black uppercase transition-colors hover:bg-red-500"
          >
            REINITIALIZE TERMINAL
          </button>
        </main>
      </body>
    </html>
  );
}
