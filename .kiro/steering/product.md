---
inclusion: always
---

# PageCast — Product Steering Guide

## 1. Project Overview & Context

**PageCast** is an AI-powered, low-bandwidth Teletext information platform created for the **Kiroween 2026 Hackathon** under the **Resurrection** category. 

It resurrects the golden age of broadcast Teletext (such as BBC Ceefax, ITV Oracle, and ARD Videotext) by transforming modern, bloated web articles and live feeds into ultra-compact, distraction-free **Teletext Page Packs** that load instantaneously over edge connections and work completely offline.

---

## 2. The Core Problem & Value Proposition

### The Problem
The modern web suffers from extreme bloat. The average webpage weighs over 2.5 megabytes, loaded with JavaScript trackers, ad networks, render-blocking stylesheets, and complex DOM trees. In low-bandwidth areas (rural broadband, 2G/3G networks, satellite links, emergency/disaster zones, congested transit), this bloat causes:
- Multi-minute loading times or complete request timeouts.
- High data consumption and mobile bandwidth costs.
- Inaccessible essential news, weather, and public bulletins.

### The Solution: PageCast
PageCast combines retro 1970s broadcast engineering principles with 2026 AI language modeling:
1. **Sub-5KB Page Packs:** An entire multi-page bulletin (3 to 6 teletext pages including index, news, weather, and summaries) packages into under 5,120 bytes uncompressed (and sub-2KB gzipped/brotli).
2. **AI-Composed Teletext Layout:** Uses Google Gemini 2.5 Flash to distill raw article content into fixed 40-column × 24-row grid pages, preserving factual essence and creating Teletext ASCII/mosaic banners.
3. **Authentic 40×24 CRT Experience:** Renders in authentic high-contrast monospaced typography with CRT scanlines, flicker toggles, page dialing (100–899), and 4-button Fastext navigation (Red, Green, Yellow, Cyan).
4. **Offline-First Delivery:** Once fetched, Page Packs persist locally via IndexedDB and Service Worker caches, allowing uninterrupted reading without active connectivity.

---

## 3. Target Audiences & Use Cases

### Audience A: Readers
- **Low-Bandwidth & Emerging Market Users:** Readers relying on metered 2G/3G data or intermittent connections who need fast access to information.
- **Distraction-Free News Readers:** Users overwhelmed by algorithmic feeds, autoplay videos, cookie banners, and popups who want pure headline news.
- **Retro Tech Enthusiasts & Digital Preservationists:** Fans of Ceefax, Minitel, Prestel, and classic computing aesthetics.
- **Emergency & Crisis Information Access:** Citizens needing urgent status bulletins, weather advisories, and disaster relief guidance during infrastructure disruptions.

### Audience B: Publishers
- **Community Journalists & Hyperlocal Media:** Publishers providing lean local news to underserved areas.
- **Emergency Management & Government Agencies:** Broadcast authorities delivering rapid, low-footprint crisis bulletins.
- **Developers & Content Curators:** Creators distributing newsletters, weather digests, transit alerts, or tech updates via ultra-low-footprint RSS/article imports.

---

## 4. Key Hackathon Deliverables

- **Publisher Studio:** Input an article URL or raw text, run AI conversion into a structured 40×24 Teletext Page Pack, inspect page budget breakdown, edit lines, and publish.
- **Web Teletext Terminal:** Fully interactive web-based Teletext CRT display with 40×24 grid, 100–899 page dialing, 4 Fastext shortcut links, sub-page carousel cycling, and CRT visual controls.
- **Low-Bandwidth Architecture:** Strict enforcement of the sub-5KB byte budget per pack with deterministic property-based testing and zero client runtime dependencies beyond React.
