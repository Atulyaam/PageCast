import { layoutBulletinPage } from "../domain/layout-engine/layout";
import type { TeletextPage } from "../domain/teletext/types";
import type { PagePackV1 } from "../domain/page-pack/types";

const SEED_TIMESTAMP = new Date("2026-10-31T10:00:00Z");

// Page 100: Main Index
export const page100: TeletextPage = layoutBulletinPage({
  pageNumber: 100,
  title: "PageCast Main Index",
  topic: "PAGECAST INDEX",
  headline: "WELCOME TO PAGECAST TELETEXT",
  paragraphs: [
    "Ultra-low bandwidth news, weather, and crisis information revived for 2026.",
    "101 World News Briefing (English)",
    "102 राष्ट्रीय समाचार (Hindi News)",
    "200 Technology & Economy Digest",
    "400 Emergency & Weather Advisory",
    "Use number keys 0-9 to dial pages or click the color Fastext links below.",
  ],
  fastext: { red: 101, green: 102, yellow: 200, cyan: 400 },
  fastextLabels: {
    red: "News 101",
    green: "Hindi 102",
    yellow: "Tech 200",
    cyan: "Alert 400",
  },
  timestamp: SEED_TIMESTAMP,
});

// Page 101: World News (English)
export const page101: TeletextPage = layoutBulletinPage({
  pageNumber: 101,
  title: "World News",
  topic: "WORLD NEWS",
  headline: "GLOBAL CLIMATE ACCORD SIGNED",
  paragraphs: [
    "Representatives from 195 nations signed a landmark treaty in Geneva today.",
    "The agreement establishes binding commitments to cut industrial emissions and safeguard freshwater reserves.",
    "Energy ministers announced a transition fund for emerging economies operating on constrained grids.",
  ],
  fastext: { red: 102, green: 200, yellow: 400, cyan: 100 },
  fastextLabels: {
    red: "Hindi 102",
    green: "Tech 200",
    yellow: "Alert 400",
    cyan: "Index 100",
  },
  timestamp: SEED_TIMESTAMP,
});

// Page 102: National News in Hindi (हिंदी समाचार)
export const page102: TeletextPage = layoutBulletinPage({
  pageNumber: 102,
  title: "राष्ट्रीय समाचार",
  topic: "समाचार",
  headline: "डिजिटल साक्षरता और कम-बैंडविड्थ क्रांति",
  paragraphs: [
    "ग्रामीण भारत में दूरदराज के क्षेत्रों के लिए नए कम-बैंडविड्थ नेटवर्क शुरू किए गए हैं।",
    "यह पहल आपातकालीन बुलेटिन और मौसम की जानकारी सीधे फोन पर बिना इंटरनेट ब्लोट के पहुंचाती है।",
    "शिक्षा और स्वास्थ्य सेवाओं को टेलीटेक्स्ट प्रारूप में उपलब्ध कराया जा रहा है।",
  ],
  fastext: { red: 101, green: 200, yellow: 400, cyan: 100 },
  fastextLabels: {
    red: "News 101",
    green: "Tech 200",
    yellow: "Alert 400",
    cyan: "Index 100",
  },
  language: "hi",
  timestamp: SEED_TIMESTAMP,
});

// Page 200: Technology & Economy Digest
export const page200: TeletextPage = layoutBulletinPage({
  pageNumber: 200,
  title: "Technology & Economy",
  topic: "TECH & ECONOMY",
  headline: "EDGE COMPUTING REDUCES WEB BLOAT",
  paragraphs: [
    "New research shows the average mobile website consumes 2.5 MB of data per page load.",
    "Lightweight text architectures like PageCast reduce transmission overhead by 99.6%, delivering full bulletins in under 10 KiB.",
    "Battery life on solar-powered rural devices increases up to 40% with text-first delivery.",
  ],
  fastext: { red: 101, green: 102, yellow: 400, cyan: 100 },
  fastextLabels: {
    red: "News 101",
    green: "Hindi 102",
    yellow: "Alert 400",
    cyan: "Index 100",
  },
  timestamp: SEED_TIMESTAMP,
});

// Page 400: Emergency & Weather Advisory
export const page400: TeletextPage = layoutBulletinPage({
  pageNumber: 400,
  title: "Emergency Advisory",
  topic: "EMERGENCY ADVISORY",
  headline: "COASTAL STORM WARNING: ZONE 4",
  paragraphs: [
    "Meteorological authorities issue a severe gale warning for northern maritime sectors.",
    "Wind speeds may exceed 85 km/h through Sunday morning. Coastal transit suspended.",
    "Emergency helpline: 112 / Regional control room active on HF radio 14.300 MHz.",
    "चेतावनी: तटीय क्षेत्रों में रहने वाले नागरिकों को सुरक्षित स्थानों पर रहने की सलाह दी गई है।",
  ],
  fastext: { red: 100, green: 101, yellow: 102, cyan: 200 },
  fastextLabels: {
    red: "Index 100",
    green: "News 101",
    yellow: "Hindi 102",
    cyan: "Tech 200",
  },
  timestamp: SEED_TIMESTAMP,
});

export const SEED_PAGES: readonly TeletextPage[] = [page100, page101, page102, page200, page400];

export const SEED_PAGE_PACK: PagePackV1 = {
  id: "00000000-0000-4000-8000-000000000100",
  version: 1,
  slug: "pagecast-official-seed-bulletin",
  title: "PageCast Official Broadcast Bulletin",
  magazine: 1,
  primaryPageNumber: 100,
  createdAt: SEED_TIMESTAMP.toISOString(),
  metadata: {
    sourceName: "PageCast Broadcast Network",
    author: "Editorial Desk",
    language: "en",
    aiAssisted: false,
    publisherId: "pagecast_system",
    evidenceReferences: [{ pointId: "p100-1", sourceSentenceId: "seed-official-init" }],
  },
  pages: [page100, page101],
};

export function getSeedPage(pageNumber: number): TeletextPage | undefined {
  return SEED_PAGES.find((p) => p.pageNumber === pageNumber);
}

export function getSeedPageCatalog(): readonly number[] {
  return SEED_PAGES.map((p) => p.pageNumber);
}
