-- PageCast Core PostgreSQL Schema Migration
-- Migration: 20261031000001_initial_pagecast_schema.sql
-- Invariant: Supports strict 40x25 Teletext pages, 10,240-byte PagePack ceilings,
-- source sentence provenance, and multi-page magazine grouping.

-- 1. Profiles Table (linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('admin', 'publisher', 'reader')) default 'publisher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Sources Table (Ingested article provenance)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  canonical_url text,
  title text not null,
  publisher text,
  published_at text,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  language text not null check (language in ('en', 'hi')) default 'en',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_sources_content_hash on public.sources (content_hash);
create index if not exists idx_sources_created_by on public.sources (created_by);

-- 3. Source Sentences Table (Granular sentence-level SHA-256 fingerprints)
create table if not exists public.source_sentences (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  sentence_index int not null,
  sentence_hash text not null,
  sentence_text text not null,
  created_at timestamptz not null default now(),
  constraint uq_source_sentence_index unique (source_id, sentence_index)
);

create index if not exists idx_source_sentences_source_id on public.source_sentences (source_id);

-- 4. Magazines Table (Magazines 1 to 8 based on hundreds digit of 100-899)
create table if not exists public.magazines (
  id int primary key check (id >= 1 and id <= 8),
  title text not null,
  description text not null,
  icon text
);

-- Seed Magazines 1-8
insert into public.magazines (id, title, description, icon) values
  (1, 'News & Index', 'General news, breaking headlines and main index', 'newspaper'),
  (2, 'Technology & Resilience', 'Low-bandwidth computing and decentralization', 'cpu'),
  (3, 'Weather & Environment', 'Weather forecasts, climate alerts and air quality', 'cloud-sun'),
  (4, 'Sports & Scores', 'Match reports, tables and sporting news', 'trophy'),
  (5, 'Culture & Features', 'Arts, literature and entertainment', 'film'),
  (6, 'Markets & Finance', 'Economic indices, commodity prices and currencies', 'trending-up'),
  (7, 'Public Notices', 'Community announcements and civic bulletins', 'megaphone'),
  (8, 'Emergency & System', 'Emergency dispatches, system info and assistance', 'alert-triangle')
on conflict (id) do nothing;

-- 5. Pages Table (Core published and draft page entities)
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  page_number int not null check (page_number >= 100 and page_number <= 899),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  language text not null check (language in ('en', 'hi')) default 'en',
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  current_revision int not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Active published pages must have unique page numbers
create unique index if not exists idx_pages_active_page_number
  on public.pages (page_number)
  where (status = 'published');

create index if not exists idx_pages_created_by on public.pages (created_by);
create index if not exists idx_pages_status on public.pages (status);

-- 6. Page Revisions Table (Immutable versioned PagePacks)
create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  revision int not null check (revision >= 1),
  page_pack_json jsonb not null,
  payload_bytes int not null check (payload_bytes <= 10240),
  renderer_version text not null default '1.0.0',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint uq_page_revision unique (page_id, revision)
);

create index if not exists idx_page_revisions_page_id on public.page_revisions (page_id);

-- 7. Page Sources Table (Attribution junction)
create table if not exists public.page_sources (
  page_revision_id uuid not null references public.page_revisions(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  primary key (page_revision_id, source_id)
);

-- 8. Bulletin Pages (Multi-page subpages for carousel bulletins, e.g. 101/1, 101/2)
create table if not exists public.bulletin_pages (
  id uuid primary key default gen_random_uuid(),
  bulletin_id uuid not null references public.pages(id) on delete cascade,
  page_number int not null check (page_number >= 100 and page_number <= 899),
  subpage_index int not null check (subpage_index >= 1 and subpage_index <= 99),
  page_revision_id uuid not null references public.page_revisions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_bulletin_subpage unique (bulletin_id, subpage_index)
);

-- 9. Publisher Audit Log Table
create table if not exists public.publisher_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null check (action in ('create_draft', 'update_draft', 'publish_page', 'unpublish_page', 'archive_page', 'export_pack')),
  resource_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_publisher_audit_log_actor on public.publisher_audit_log (actor_id);
create index if not exists idx_publisher_audit_log_created_at on public.publisher_audit_log (created_at);
