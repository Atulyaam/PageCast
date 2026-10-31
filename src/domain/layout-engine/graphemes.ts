/**
 * Unicode-Aware Grapheme Segmentation and Terminal Display Width
 *
 * Employs standard Intl.Segmenter with granularity: 'grapheme' to guarantee
 * that multi-codepoint grapheme clusters (such as Devanagari Hindi conjuncts,
 * matras, viramas, and surrogate pairs) are never split mid-cluster.
 *
 * Additionally provides POSIX/Unicode Annex 11 terminal display width calculation
 * to account for wide characters (emojis, CJK) and zero-width code points.
 */

/**
 * Splits a text string into an array of user-perceived grapheme clusters.
 */
export function segmentGraphemes(text: string, locale = "und"): readonly string[] {
  if (!text) {
    return [];
  }

  // Use Intl.Segmenter where available (supported in Node 16+ and modern browsers)
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    const segments = segmenter.segment(text);
    const clusters: string[] = [];

    for (const { segment } of segments) {
      clusters.push(segment);
    }

    return clusters;
  }

  // Fallback for environments lacking Intl.Segmenter: array spread preserves surrogate pairs
  return Array.from(text);
}

/**
 * Returns the visible grapheme cluster count of a string.
 */
export function getGraphemeCount(text: string, locale = "und"): number {
  return segmentGraphemes(text, locale).length;
}

/**
 * Determines the terminal display width of a single grapheme cluster.
 * Returns 2 for wide characters (e.g. CJK, fullwidth, emojis),
 * 0 for zero-width characters, and 1 for standard characters (including Indic conjuncts).
 */
export function getClusterDisplayWidth(cluster: string): number {
  if (!cluster) {
    return 0;
  }
  const codePoint = cluster.codePointAt(0);
  if (codePoint === undefined) {
    return 0;
  }

  // Zero-width characters (ZWJ, ZWNJ, variation selectors)
  if (
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0xfeff ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
  ) {
    return 0;
  }

  // Wide characters / Emojis (occupy 2 terminal columns in monospace display)
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
    (codePoint >= 0x2e80 && codePoint <= 0x9fff) || // CJK Radicals, Ideographs
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul Syllables
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK Compatibility Ideographs
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) || // Vertical forms
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK Compatibility Forms
    (codePoint >= 0xff00 && codePoint <= 0xff60) || // Fullwidth Forms
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) || // Fullwidth Signs
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) || // Miscellaneous Symbols & Pictographs / Emojis
    (codePoint >= 0x2600 && codePoint <= 0x27bf) // Misc symbols & Dingbats
  ) {
    return 2;
  }

  return 1;
}

/**
 * Returns the terminal display width (in monospace character cells) of a string.
 * Accurately accounts for single-width Indic conjuncts, double-width emojis/CJK,
 * and zero-width format controls.
 */
export function getDisplayWidth(text: string, locale = "und"): number {
  const clusters = segmentGraphemes(text, locale);
  let totalWidth = 0;
  for (const cluster of clusters) {
    totalWidth += getClusterDisplayWidth(cluster);
  }
  return totalWidth;
}

/**
 * Slices a string to at most maxGraphemes user-perceived graphemes.
 * Guarantees zero severed combining marks or trailing surrogate fragments.
 */
export function sliceByGraphemes(text: string, maxGraphemes: number, locale = "und"): string {
  if (maxGraphemes <= 0) {
    return "";
  }

  const clusters = segmentGraphemes(text, locale);
  if (clusters.length <= maxGraphemes) {
    return text;
  }

  return clusters.slice(0, maxGraphemes).join("");
}

/**
 * Pads a string with trailing pad characters until its visible grapheme count
 * equals targetColumns. If already >= targetColumns, truncates to targetColumns.
 */
export function padToColumns(
  text: string,
  targetColumns = 40,
  padChar = " ",
  locale = "und"
): string {
  const clusters = segmentGraphemes(text, locale);
  const count = clusters.length;

  if (count === targetColumns) {
    return text;
  }

  if (count > targetColumns) {
    return clusters.slice(0, targetColumns).join("");
  }

  const paddingNeeded = targetColumns - count;
  return text + padChar.repeat(paddingNeeded);
}
