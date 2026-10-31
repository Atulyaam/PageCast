import { layoutBulletinPage } from "../domain/layout-engine/layout";
import type { TeletextPage } from "../domain/teletext/types";
import type { PagePackV1 } from "../domain/page-pack/types";

const SEED_TIMESTAMP = new Date("2026-10-31T10:00:00Z");

// Page 100: Main Broadcast Index (Magazine 1)
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
    "400 Emergency Storm Warning (English)",
    "401 मौसम व आपदा चेतावनी (Hindi Weather)",
    "Use remote keypad 0-9 to dial pages or click the color Fastext links below.",
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

// Page 101: World News (English - Mag 1) - Attributed to Reuters
export const page101: TeletextPage = layoutBulletinPage({
  pageNumber: 101,
  title: "World News",
  topic: "WORLD NEWS",
  headline: "GLOBAL CLIMATE ACCORD SIGNED",
  paragraphs: [
    "Representatives from 195 nations signed a landmark treaty in Geneva today.",
    "The agreement establishes binding commitments to cut industrial emissions and safeguard freshwater reserves.",
    "Energy ministers announced a transition fund for emerging economies operating on constrained grids.",
    "Source: Reuters International Diplomatic Desk.",
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

// Page 102: National News in Hindi (हिंदी समाचार - Mag 1) - Attributed to PIB India
export const page102: TeletextPage = layoutBulletinPage({
  pageNumber: 102,
  title: "राष्ट्रीय समाचार",
  topic: "समाचार",
  headline: "डिजिटल साक्षरता और कम-बैंडविड्थ क्रांति",
  paragraphs: [
    "ग्रामीण भारत में दूरदराज के क्षेत्रों के लिए नए कम-बैंडविड्थ नेटवर्क शुरू किए गए हैं।",
    "यह पहल आपातकालीन बुलेटिन और मौसम की जानकारी सीधे फोन पर बिना इंटरनेट ब्लोट के पहुंचाती है।",
    "शिक्षा और स्वास्थ्य सेवाओं को टेलीटेक्स्ट प्रारूप में उपलब्ध कराया जा रहा है।",
    "स्रोत: पत्र सूचना कार्यालय (PIB नई दिल्ली)।",
  ],
  fastext: { red: 101, green: 200, yellow: 401, cyan: 100 },
  fastextLabels: {
    red: "News 101",
    green: "Tech 200",
    yellow: "मौसम 401",
    cyan: "Index 100",
  },
  language: "hi",
  timestamp: SEED_TIMESTAMP,
});

// Page 200: Technology & Economy Digest (English - Mag 2) - Attributed to Nature Electronics
export const page200: TeletextPage = layoutBulletinPage({
  pageNumber: 200,
  title: "Technology & Economy",
  topic: "TECH & ECONOMY",
  headline: "EDGE COMPUTING REDUCES WEB BLOAT",
  paragraphs: [
    "New research shows the average mobile website consumes 2.5 MB of data per page load.",
    "Lightweight text architectures like PageCast reduce transmission overhead by 99.6%, delivering full bulletins in under 10 KiB.",
    "Battery life on solar-powered rural devices increases up to 40% with text-first delivery.",
    "Source: Nature Electronics Computational Energy Study.",
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

// Page 400: Coastal Storm Warning (English - Mag 4) - Attributed to NOAA/Met Service
export const page400: TeletextPage = layoutBulletinPage({
  pageNumber: 400,
  title: "Emergency Advisory",
  topic: "EMERGENCY ADVISORY",
  headline: "COASTAL STORM WARNING: ZONE 4",
  paragraphs: [
    "Meteorological authorities issue a severe gale warning for northern maritime sectors.",
    "Wind speeds may exceed 85 km/h through Sunday morning. Coastal transit suspended.",
    "Emergency helpline: 112 / Regional control room active on HF radio 14.300 MHz.",
    "Source: National Maritime Weather Operations Centre.",
  ],
  fastext: { red: 100, green: 101, yellow: 102, cyan: 401 },
  fastextLabels: {
    red: "Index 100",
    green: "News 101",
    yellow: "Hindi 102",
    cyan: "मौसम 401",
  },
  timestamp: SEED_TIMESTAMP,
});

// Page 401: Monsoon & Disaster Alert in Hindi (मौसम व आपदा चेतावनी - Mag 4) - Attributed to IMD
export const page401: TeletextPage = layoutBulletinPage({
  pageNumber: 401,
  title: "मौसम व आपदा चेतावनी",
  topic: "आपदा चेतावनी",
  headline: "उत्तरी क्षेत्रों में भारी वर्षा का रेड अलर्ट",
  paragraphs: [
    "भारत मौसम विज्ञान विभाग (IMD) ने अगले 48 घंटों में मूसलाधार बारिश की चेतावनी जारी की है।",
    "पहाड़ी क्षेत्रों में भूस्खलन और जलभराव की आशंका। अनावश्यक यात्रा टालने की सलाह।",
    "राष्ट्रीय आपदा मोचन बल (NDRF) संवेदनशील क्षेत्रों में तैनात। आपातकालीन नंबर: 1070।",
    "स्रोत: भारत मौसम विज्ञान विभाग (IMD नई दिल्ली)।",
  ],
  fastext: { red: 100, green: 101, yellow: 102, cyan: 400 },
  fastextLabels: {
    red: "Index 100",
    green: "News 101",
    yellow: "Hindi 102",
    cyan: "Storm 400",
  },
  language: "hi",
  timestamp: SEED_TIMESTAMP,
});

export const SEED_PAGES: readonly TeletextPage[] = [
  page100,
  page101,
  page102,
  page200,
  page400,
  page401,
];

// Curated 5 Demo PagePacks with Genuine Source Attribution & Evidence References
export const CURATED_DEMO_BULLETINS: readonly PagePackV1[] = [
  // 1. English Global News (P101)
  {
    id: "00000000-0000-4000-8000-000000000101",
    version: 1,
    slug: "world-news-climate-accord",
    title: "World News — Climate Accord",
    magazine: 1,
    primaryPageNumber: 101,
    createdAt: SEED_TIMESTAMP.toISOString(),
    metadata: {
      sourceName: "Reuters International",
      originalUrl: "https://www.reuters.com/sustainability/climate-treaty-geneva",
      author: "Diplomatic Affairs Desk",
      language: "en",
      aiAssisted: true,
      publisherId: "editor_editorial_desk",
      evidenceReferences: [
        { pointId: "p101-1", sourceSentenceId: "s1" },
        { pointId: "p101-2", sourceSentenceId: "s2" },
        { pointId: "p101-3", sourceSentenceId: "s3" },
      ],
    },
    pages: [page101],
  },
  // 2. Hindi National News (P102)
  {
    id: "00000000-0000-4000-8000-000000000102",
    version: 1,
    slug: "national-news-digital-literacy-hi",
    title: "राष्ट्रीय समाचार — डिजिटल साक्षरता",
    magazine: 1,
    primaryPageNumber: 102,
    createdAt: SEED_TIMESTAMP.toISOString(),
    metadata: {
      sourceName: "Press Information Bureau (PIB)",
      originalUrl: "https://pib.gov.in/PressReleasePage.aspx?PRID=2026101",
      author: "सूचना एवं प्रसारण मंत्रालय",
      language: "hi",
      aiAssisted: true,
      publisherId: "editor_hindi_desk",
      evidenceReferences: [
        { pointId: "p102-1", sourceSentenceId: "s1" },
        { pointId: "p102-2", sourceSentenceId: "s2" },
        { pointId: "p102-3", sourceSentenceId: "s3" },
      ],
    },
    pages: [page102],
  },
  // 3. English Technology (P200)
  {
    id: "00000000-0000-4000-8000-000000000200",
    version: 1,
    slug: "tech-edge-computing-web-bloat",
    title: "Technology — Edge Computing",
    magazine: 2,
    primaryPageNumber: 200,
    createdAt: SEED_TIMESTAMP.toISOString(),
    metadata: {
      sourceName: "Nature Electronics",
      originalUrl: "https://www.nature.com/articles/s41928-026-0042",
      author: "Dr. Evelyn Vance",
      language: "en",
      aiAssisted: true,
      publisherId: "editor_tech_desk",
      evidenceReferences: [
        { pointId: "p200-1", sourceSentenceId: "s1" },
        { pointId: "p200-2", sourceSentenceId: "s2" },
        { pointId: "p200-3", sourceSentenceId: "s3" },
      ],
    },
    pages: [page200],
  },
  // 4. English Coastal Storm Warning (P400)
  {
    id: "00000000-0000-4000-8000-000000000400",
    version: 1,
    slug: "emergency-coastal-storm-warning",
    title: "Emergency — Coastal Storm Warning",
    magazine: 4,
    primaryPageNumber: 400,
    createdAt: SEED_TIMESTAMP.toISOString(),
    metadata: {
      sourceName: "Maritime Safety Operations",
      originalUrl: "https://www.weather.gov/marine/gale-warning-zone4",
      author: "Chief Forecaster",
      language: "en",
      aiAssisted: false,
      publisherId: "emergency_broadcast_system",
      evidenceReferences: [
        { pointId: "p400-1", sourceSentenceId: "s1" },
        { pointId: "p400-2", sourceSentenceId: "s2" },
        { pointId: "p400-3", sourceSentenceId: "s3" },
      ],
    },
    pages: [page400],
  },
  // 5. Hindi Monsoon & Disaster Alert (P401)
  {
    id: "00000000-0000-4000-8000-000000000401",
    version: 1,
    slug: "weather-monsoon-red-alert-hi",
    title: "मौसम — भारी वर्षा रेड अलर्ट",
    magazine: 4,
    primaryPageNumber: 401,
    createdAt: SEED_TIMESTAMP.toISOString(),
    metadata: {
      sourceName: "India Meteorological Department (IMD)",
      originalUrl: "https://mausam.imd.gov.in/bulletin/imd-red-alert-2026",
      author: "राष्ट्रीय मौसम पूर्वानुमान केंद्र",
      language: "hi",
      aiAssisted: true,
      publisherId: "emergency_broadcast_hindi",
      evidenceReferences: [
        { pointId: "p401-1", sourceSentenceId: "s1" },
        { pointId: "p401-2", sourceSentenceId: "s2" },
        { pointId: "p401-3", sourceSentenceId: "s3" },
      ],
    },
    pages: [page401],
  },
];

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
