import { WebTerminal } from "@/components/teletext/WebTerminal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-3 font-sans sm:p-6 lg:p-8">
      {/* Subtle Technical Studio Worktop Identifier */}
      <div className="mb-2 hidden w-full max-w-5xl items-center justify-between px-2 font-mono text-[10px] text-[#71736b] select-none sm:flex">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#879b83]" />
          <span>WORKBENCH TERMINAL DECK // STATION 01</span>
        </div>
        <div className="flex items-center gap-3">
          <span>WST TELETEXT 625-LINE</span>
          <span>•</span>
          <span>AIR-GAP BROADCAST RECEIVER</span>
        </div>
      </div>

      {/* Main Tabletop Device */}
      <main className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        <WebTerminal initialPageNumber={100} />
      </main>

      {/* Subtle Studio Desk Stamp */}
      <footer className="mt-3 text-center font-mono text-[11px] text-[#71736b] select-none">
        <span>PAGECAST PT-4025 &bull; KIROWEEN 2026 PRECISION ELECTRONIC INFORMATION TERMINAL</span>
      </footer>
    </div>
  );
}
