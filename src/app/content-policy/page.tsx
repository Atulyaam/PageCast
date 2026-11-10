import Link from "next/link";
import type { Metadata } from "next";
import { PageCastDeviceShell } from "@/components/device/PageCastDeviceShell";

export const metadata: Metadata = {
  title: "Content & Editorial Policy — PageCast",
  description:
    "PageCast editorial standards, factual attribution requirements, and content safety policies.",
};

export default function ContentPolicyPage() {
  return (
    <PageCastDeviceShell mode="reader">
      <div className="space-y-6 font-mono text-[#b8d1a2]">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#253328] pb-3">
          <div className="flex items-center gap-3">
            <span className="bg-[#22c55e] px-2 py-0.5 text-xs font-black text-[#080d0a]">
              PAGECAST
            </span>
            <span className="text-xs tracking-widest text-[#879b83]">P197 • EDITORIAL CHARTER</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/pages/100" className="text-[#f6dfa9] hover:underline">
              [P100 INDEX]
            </Link>
            <Link href="/about" className="text-[#54b77a] hover:underline">
              [ABOUT]
            </Link>
            <Link href="/" className="text-[#e5e7eb] hover:underline">
              [HOME]
            </Link>
          </div>
        </header>

        {/* Core Content Stance */}
        <section className="rounded border border-[#22c55e] bg-[#0d140f] p-4 sm:p-5">
          <h1 className="mb-3 text-lg font-black tracking-wider text-[#22c55e] uppercase sm:text-xl">
            Truth in Low Bandwidth: Editorial Charter
          </h1>
          <p className="text-xs leading-relaxed text-[#b8d1a2] sm:text-sm">
            In emergency, low-bandwidth, and offline environments, false information can cause
            direct physical harm. PageCast enforces strict, non-negotiable standards on factual
            attribution, sentence provenance, and human editorial oversight.
          </p>
        </section>

        {/* Detailed Guidelines */}
        <section className="space-y-4 text-xs text-[#879b83]">
          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#f6dfa9] uppercase">
              1. Non-Fabrication &amp; Zero Hallucination Guarantee
            </h2>
            <p className="leading-relaxed">
              When PageCast condenses external journalism into a 40-column bulletin, the AI engine
              is instructed under non-overridable system constraints to only summarize verified
              factual claims present in the source article. Generating facts, dates, statistics, or
              quotes not found in the source is strictly prohibited.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#38bdf8] uppercase">
              2. Granular Sentence-Level Attribution
            </h2>
            <p className="leading-relaxed">
              Every synthesized bullet point in a PageCast bulletin maintains cryptographic
              provenance linking back to specific numbered sentences in the original text (e.g.,
              <code>[&quot;s1&quot;, &quot;s3&quot;]</code>). Publishers and readers can audit the
              exact basis of every summarized claim.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#54b77a] uppercase">
              3. Mandatory Human Review Gate
            </h2>
            <p className="leading-relaxed">
              No AI-composed draft can be broadcast live without passing through human review. The
              Publisher Studio requires an editor to physically inspect the 40x25 character grid,
              verify sentence provenance, check byte budget compliance, and record an immutable
              reviewed timestamp before the publication API unlocks.
            </p>
          </div>

          <div className="space-y-2 rounded border border-[#253328] bg-[#0d140f] p-4">
            <h2 className="text-sm font-bold tracking-wider text-[#f87171] uppercase">
              4. Harm Mitigation &amp; Ingestion Safety
            </h2>
            <p className="leading-relaxed">
              PageCast strictly filters all fetched source content through a multi-tier security
              pipeline: blocking SSRF access to internal infrastructure, stripping malicious HTML
              tags, preventing prompt injection attacks, and ensuring bulletins remain safe and
              neutral.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#253328] pt-4 text-xs text-[#879b83]">
          <div>PAGECAST EDITORIAL CHARTER • INTEGRITY IN BROADCASTING</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="underline hover:text-[#54b77a]">
              Privacy Policy
            </Link>
            <Link href="/about" className="underline hover:text-[#54b77a]">
              About
            </Link>
          </div>
        </footer>
      </div>
    </PageCastDeviceShell>
  );
}
