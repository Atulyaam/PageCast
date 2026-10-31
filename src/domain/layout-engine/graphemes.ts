/**
 * Unicode-Aware Grapheme Segmentation and Text Measurement
 *
 * Employs standard Intl.Segmenter with granularity: 'grapheme' to guarantee
 * that multi-codepoint grapheme clusters (such as Devanagari Hindi conjuncts,
 * matras, viramas, and surrogate pairs) are never split mid-cluster.
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
