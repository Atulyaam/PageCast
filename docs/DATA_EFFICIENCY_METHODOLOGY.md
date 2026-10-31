# PageCast — Data Efficiency Methodology & Empirical Benchmarking
## Technical Specification for Payload Measurement & Network Simulation

**Author:** Principal Software Architect & Performance Engineer  
**Date:** 31 October 2026  
**Status:** Approved Specification  
**Associated Route:** `/lab` (`src/app/lab/page.tsx`)  
**Domain Calculator:** [`src/domain/efficiency-lab/calculator.ts`](file:///c:/Users/Atul2/OneDrive/Desktop/KiroHackethon/pagecast/src/domain/efficiency-lab/calculator.ts)  

---

## 1. Executive Intent & Scientific Integrity

The PageCast Data Efficiency Lab provides transparent, reproducible measurements of the data savings achieved when converting modern web articles into 40×25 Teletext PagePacks.

To maintain absolute scientific and engineering credibility:
1. **Measured Values vs Simulated Estimates:** We explicitly differentiate empirically measured UTF-8 byte weights from theoretical network transfer calculations.
2. **No False "Compression" Claims:** Semantic summarization is **never** termed "lossless compression". It is an **information distillation and spatial constraints pipeline**.
3. **Reproducibility:** All calculations are deterministic, open-source, and verifiable via automated regression tests.

---

## 2. Measurement Definitions

### 2.1 Original Web Article HTTP Response Bytes ($B_{\text{web}}$)
- **Definition:** The aggregate uncompressed byte weight of an average modern web news article, including the initial HTML document, JavaScript application chunks (framework runtimes, analytics, client-side hydration), external web font files, CSS bundles, tracking scripts, and embedded telemetry beacons.
- **Source Data:** Benchmarked against real news and government portals (Reuters, PIB, Nature Electronics, Weather.gov, IMD). Average modern web page payload size is empirically documented at 1.8 MB to 3.2 MB (HTTP Archive 2026 state of the web).

### 2.2 Extracted Article Text Bytes ($B_{\text{clean}}$)
- **Definition:** The raw UTF-8 byte count of the extracted readable article body produced by the Mozilla Readability parser in `src/server/ingestion/extractor.ts`, with all HTML tags, scripts, styles, and advertising boilerplate removed.
- **Formula:**
  $$\text{ExtractedBytes} = \text{new TextEncoder}().\text{encode}(\text{cleanText}).\text{byteLength}$$

### 2.3 Serialized PagePack V1 Bytes ($B_{\text{pack}}$)
- **Definition:** The exact byte weight of the canonical compact JSON representation of a `PagePackV1` entity, measured via `measurePagePack()` in `src/domain/page-pack/codec.ts`.
- **Ceiling:** Strictly capped at **10,240 UTF-8 bytes** (10 KiB) as enforced by `assertPagePackBudget()`.

---

## 3. Mathematical Formulas

### 3.1 Payload Reduction Percentage ($R_{\%}$)
$$\text{ReductionPercent} = \left( 1 - \frac{B_{\text{pack}}}{B_{\text{web}}} \right) \times 100$$
*Boundary Condition:* If $B_{\text{web}} \le 0$, $R_{\%} = 0$. Clamped strictly between $0\%$ and $100\%$.

### 3.2 Reduction Factor ($F$)
$$F = \frac{B_{\text{web}}}{\max(1, B_{\text{pack}})}$$
*Interpretation:* Represents the multiple by which the original payload exceeds the PagePack (e.g. $794\times$ smaller).

### 3.3 Theoretical Network Transfer Latency ($T_{\text{ms}}$)
$$\text{BytesPerSecond} = \frac{\text{Bandwidth}_{\text{kbps}} \times 1000}{8}$$
$$T_{\text{ms}} = \left( \frac{\text{PayloadBytes}}{\text{BytesPerSecond}} \times 1000 \right) + \text{RTT}_{\text{ms}}$$

### 3.4 Storage Density Capacity ($C_{\text{pages}}$)
$$C_{\text{pages}} = \left\lfloor \frac{\text{StorageQuota}_{\text{bytes}}}{B_{\text{pack}}} \right\rfloor$$
*Example:* Under a standard 5 MB mobile browser IndexedDB quota, a 3,120-byte PagePack yields a local storage capacity of approximately **1,678 complete offline bulletins**.

---

## 4. Standardized Network Connection Profiles

| Profile Name | Bandwidth ($\text{kbps}$) | RTT Latency ($\text{ms}$) | Operational Context |
|---|---:|---:|---|
| **2G Edge** | 150 | 400 | Rural areas, developing regions, degraded cell coverage |
| **3G Standard** | 1,500 | 150 | Suburban commuter trains, crowded public Wi-Fi |
| **4G LTE** | 15,000 | 50 | Urban mobile broadband, modern fiber-to-tower |
| **Satellite Link** | 2,000 | 600 | Maritime operations, isolated disaster zones, remote islands |

---

## 5. Limitations & Caveats

1. **Protocol Overhead:** Formulas model application-layer payload transfer times. They do not account for TCP slow-start congestion windows or TLS handshake round-trips, which disproportionately penalize multi-request web originals (80+ requests) compared to PageCast (1 request).
2. **Local Caching:** Once saved offline in IndexedDB, subsequent PagePack access latency is **0 ms network transfer time**, drawing exclusively from local disk.

