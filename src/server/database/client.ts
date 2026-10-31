/**
 * Supabase Client Factory Module (TASK-S3-01)
 *
 * Provides strongly-typed Supabase clients for both browser and server runtimes
 * with strict secret isolation.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let browserClientInstance: SupabaseClient | null = null;
let serverClientInstance: SupabaseClient | null = null;

/**
 * Checks whether Supabase is configured with valid credentials.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Creates or retrieves the singleton browser Supabase client.
 * Uses ONLY the public anon key. Safe for client components.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  const config = getSupabaseConfig();
  browserClientInstance = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClientInstance;
}

/**
 * Creates or retrieves the singleton server-side Supabase client.
 * Uses the privileged service-role key when available for administrative mutations
 * (page publishing, audit logging, system tables).
 *
 * Throws an error if called in a browser environment to prevent secret leakage.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: getSupabaseServerClient() cannot be invoked in a client/browser runtime."
    );
  }

  if (serverClientInstance) {
    return serverClientInstance;
  }

  const config = getSupabaseConfig();
  const keyToUse = config.serviceRoleKey || config.anonKey;

  serverClientInstance = createClient(config.url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClientInstance;
}

/**
 * Resets cached client singletons (primarily for unit testing).
 */
export function resetClientSingletonsForTesting(): void {
  browserClientInstance = null;
  serverClientInstance = null;
}
