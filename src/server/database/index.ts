/**
 * Database & Persistence Layer Entrypoint (TASK-S3-03)
 */

import { isSupabaseConfigured } from "./client";
import { MemoryPersistenceRepository } from "./memory-repository";
import { SupabasePersistenceRepository } from "./supabase-repository";
import type { IPersistenceRepository } from "./repository";

export * from "./config";
export * from "./client";
export * from "./schema-contracts";
export * from "./repository";
export * from "./memory-repository";
export * from "./supabase-repository";

let memoryRepoInstance: MemoryPersistenceRepository | null = null;
let supabaseRepoInstance: SupabasePersistenceRepository | null = null;

/**
 * Returns the active persistence repository singleton.
 * Uses Supabase when configured with valid live credentials,
 * otherwise transparently falls back to the in-memory repository
 * for local development, offline usage, and CI tests.
 */
export function getPersistenceRepository(): IPersistenceRepository {
  if (isSupabaseConfigured()) {
    if (!supabaseRepoInstance) {
      supabaseRepoInstance = new SupabasePersistenceRepository();
    }
    return supabaseRepoInstance;
  }

  if (!memoryRepoInstance) {
    memoryRepoInstance = new MemoryPersistenceRepository();
  }
  return memoryRepoInstance;
}

/**
 * Resets persistence singletons for unit and integration testing.
 */
export function resetPersistenceRepositoryForTesting(): void {
  if (memoryRepoInstance) {
    memoryRepoInstance.reset();
  }
  memoryRepoInstance = null;
  supabaseRepoInstance = null;
}
