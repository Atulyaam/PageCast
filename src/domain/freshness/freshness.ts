/**
 * PageCast — Bulletin Freshness and Versioning Utilities (ENH-06)
 *
 * Provides pure functions for evaluating relative freshness, stale copy alerts,
 * and non-destructive validity window expiry.
 */

/**
 * Calculates human-readable relative time string (e.g. "just now", "15m ago", "3h ago", "2d ago").
 */
export function formatRelativeFreshness(isoDate?: string | null, now = new Date()): string {
  if (!isoDate) return "Unknown";

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "Unknown";

  const diffMs = now.getTime() - timestamp;
  if (diffMs < 0) return "Just now"; // future clock skew

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

/**
 * Checks whether a time-sensitive bulletin's validity window has elapsed.
 */
export function isNoticeExpired(validUntil?: string | null, now = new Date()): boolean {
  if (!validUntil) return false;
  const expiryTime = new Date(validUntil).getTime();
  if (Number.isNaN(expiryTime)) return false;
  return now.getTime() > expiryTime;
}

/**
 * Evaluates whether an offline saved copy should be considered stale.
 * A copy is stale if its saved timestamp exceeds maxAgeHours (default 24h).
 */
export function isCopyStale(savedAt?: string | null, maxAgeHours = 24, now = new Date()): boolean {
  if (!savedAt) return false;
  const savedTime = new Date(savedAt).getTime();
  if (Number.isNaN(savedTime)) return false;

  const ageMs = now.getTime() - savedTime;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
}

/**
 * Formats a notice validity window for human display.
 */
export function formatNoticeValidityWindow(
  publishedAt?: string | null,
  validUntil?: string | null
): string {
  if (!validUntil) return "Standard Broadcast (No Expiry)";

  const expiry = new Date(validUntil);
  if (Number.isNaN(expiry.getTime())) return "Standard Broadcast";

  return `Valid until: ${expiry.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
