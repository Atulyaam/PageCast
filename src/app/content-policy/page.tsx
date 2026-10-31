import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content & Editorial Policy — PageCast",
  description:
    "PageCast editorial standards, factual attribution requirements, and content safety policies.",
};

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen bg-black p-4 font-mono text-white selection:bg-green-400 selection:text-black sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-green-400 pb-4">
          <div className="flex items-center gap-3">
            <span className="bg-green-400 px-2 py-0.5 text-xs font-black text-black">PAGECAST</span>
            <span className="text-sm tracking-widest text-neutral-400">
              P197 • EDITORIAL CHARTER
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/pages/100" className="text-yellow-400 hover:underline">
              [P100 INDEX]
            </Link>
            <Link href="/about" className="text-green-400 hover:underline">
              [ABOUT]
            </Link>
            <Link href="/" className="text-white hover:underline">
              [HOME]
            </Link>
          </div>
        </header>

        {/* Core Content Stance */}
        <section className="border-2 border-green-400/80 bg-neutral-950 p-6 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <h1 className="mb-4 text-2xl font-black tracking-wider text-green-400 uppercase sm:text-3xl">
            Truth in Low Bandwidth: Editorial Charter
          </h1>
          <p className="text-sm leading-relaxed text-neutral-300">
            In emergency, low-bandwidth, and offline environments, false information can cause
            direct physical harm. PageCast enforces strict, non-negotiable standards on factual
            attribution, sentence provenance, and human editorial oversight.
          </p>
        </section>

        {/* Detailed Guidelines */}
        <section className="space-y-6 text-sm text-neutral-300">
          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-yellow-400 uppercase">
              1. Non-Fabrication &amp; Zero Hallucination Guarantee
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              When PageCast condenses external journalism into a 40-column bulletin, the AI engine
              is instructed under non-overridable system constraints to only summarize verified
              factual claims present in the source article. Generating facts, dates, statistics, or
              quotes not found in the source is strictly prohibited.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-cyan-400 uppercase">
              2. Granular Sentence-Level Attribution
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              Every synthesized bullet point in a PageCast bulletin maintains cryptographic
              provenance linking back to specific numbered sentences in the original text (e.g.,
              <code>[&quot;s1&quot;, &quot;s3&quot;]</code>). Publishers and readers can audit the
              exact basis of every summarized claim.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-green-400 uppercase">
              3. Mandatory Human Review Gate
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              No AI-composed draft can be broadcast live without passing through human review. The
              Publisher Studio requires an editor to physically inspect the 40x25 character grid,
              verify sentence provenance, check byte budget compliance, and record an immutable
              reviewed timestamp before the publication API unlocks.
            </p>
          </div>

          <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-5">
            <h2 className="text-base font-bold tracking-wider text-red-400 uppercase">
              4. Harm Mitigation &amp; Ingestion Safety
            </h2>
            <p className="text-xs leading-relaxed text-neutral-400">
              PageCast strictly filters all fetched source content through a multi-tier security
              pipeline: blocking SSRF access to internal infrastructure, stripping malicious HTML
              tags, preventing prompt injection attacks, and ensuring bulletins remain safe and
              neutral.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <div>PAGECAST EDITORIAL CHARTER • INTEGRITY IN BROADCASTING</div>
          <div className="flex gap-4">
            <Link href="/about" className="underline hover:text-green-400">
              About
            </Link>
            <Link href="/privacy" className="underline hover:text-green-400">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
