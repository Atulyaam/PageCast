/**
 * Supabase Configuration & Secret Isolation Module (TASK-S3-01)
 *
 * Reads and validates Supabase environment variables while strictly
 * enforcing server/client secret boundaries.
 */

export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string | null;
  readonly isConfigured: boolean;
}

/**
 * Validates whether a URL is a valid Supabase endpoint.
 */
export function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url === "https://your-project.supabase.co") return false; // Default placeholder
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Checks if a key is a real non-placeholder key.
 */
export function isNonPlaceholderKey(key: string | undefined): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  return !lower.includes("your-supabase") && !lower.includes("placeholder") && key.length > 10;
}

/**
 * Retrieves the current Supabase configuration.
 * Safe to call in both browser and server environments.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key";

  // Only read service role key on server
  const isServer = typeof window === "undefined";
  const serviceRoleKey = isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY || null : null;

  const validUrl = isValidSupabaseUrl(url);
  const validAnon = isNonPlaceholderKey(anonKey);
  const isConfigured = validUrl && validAnon;

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured,
  };
}

/**
 * Helper to mask sensitive keys for logging.
 */
export function maskKey(key: string | null | undefined): string {
  if (!key) return "[NOT_SET]";
  if (key.length <= 8) return "[MASKED]";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
