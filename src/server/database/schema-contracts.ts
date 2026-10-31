/**
 * Database Schema Contracts & Type Definitions (TASK-S3-02)
 *
 * Strongly-typed mirror of the PageCast PostgreSQL schema defined in
 * `supabase/migrations/20261031000001_initial_pagecast_schema.sql`.
 */

import type { PagePackV1 } from "@/domain/page-pack/types";

export type UserRole = "admin" | "publisher" | "reader";
export type PageStatus = "draft" | "published" | "archived";
export type LanguageCode = "en" | "hi";

export type AuditAction =
  | "create_draft"
  | "update_draft"
  | "publish_page"
  | "unpublish_page"
  | "archive_page"
  | "export_pack";

export interface ProfileRow {
  readonly id: string; // uuid
  readonly display_name: string;
  readonly role: UserRole;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SourceRow {
  readonly id: string; // uuid
  readonly canonical_url: string | null;
  readonly title: string;
  readonly publisher: string | null;
  readonly published_at: string | null;
  readonly fetched_at: string;
  readonly content_hash: string;
  readonly language: LanguageCode;
  readonly created_by: string | null;
  readonly created_at: string;
}

export interface SourceSentenceRow {
  readonly id: string; // uuid
  readonly source_id: string; // uuid
  readonly sentence_index: number;
  readonly sentence_hash: string;
  readonly sentence_text: string;
  readonly created_at: string;
}

export interface MagazineRow {
  readonly id: number; // 1 to 8
  readonly title: string;
  readonly description: string;
  readonly icon: string | null;
}

export interface PageRow {
  readonly id: string; // uuid
  readonly page_number: number; // 100 to 899
  readonly slug: string;
  readonly language: LanguageCode;
  readonly status: PageStatus;
  readonly current_revision: number;
  readonly created_by: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface PageRevisionRow {
  readonly id: string; // uuid
  readonly page_id: string; // uuid
  readonly revision: number;
  readonly page_pack_json: PagePackV1;
  readonly payload_bytes: number; // <= 10240
  readonly renderer_version: string;
  readonly reviewed_by: string | null;
  readonly reviewed_at: string | null;
  readonly created_at: string;
}

export interface PageSourceRow {
  readonly page_revision_id: string; // uuid
  readonly source_id: string; // uuid
}

export interface BulletinPageRow {
  readonly id: string; // uuid
  readonly bulletin_id: string; // uuid
  readonly page_number: number;
  readonly subpage_index: number; // 1 to 99
  readonly page_revision_id: string; // uuid
  readonly created_at: string;
}

export interface PublisherAuditLogRow {
  readonly id: string; // uuid
  readonly actor_id: string | null;
  readonly action: AuditAction;
  readonly resource_id: string;
  readonly details: Record<string, unknown> | null;
  readonly created_at: string;
}
