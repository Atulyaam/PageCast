-- PageCast Row Level Security (RLS) Policies Migration
-- Migration: 20261031000002_row_level_security.sql
-- Invariant: Least-privilege access model protecting publisher drafts,
-- source attribution, and audit records while granting public read
-- to active published bulletins.

-- 1. Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.source_sentences enable row level security;
alter table public.magazines enable row level security;
alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.page_sources enable row level security;
alter table public.bulletin_pages enable row level security;
alter table public.publisher_audit_log enable row level security;

-- 2. Profiles Policies
create policy "Public can view profile display names"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Magazines Policies (Public catalogue)
create policy "Public can view all magazine categories"
  on public.magazines for select
  using (true);

-- 4. Pages Policies
create policy "Public can view published pages"
  on public.pages for select
  using (status = 'published');

create policy "Publishers can view their own pages and drafts"
  on public.pages for select
  to authenticated
  using (auth.uid() = created_by or status = 'published');

create policy "Publishers can insert their own pages"
  on public.pages for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Publishers can update their own pages"
  on public.pages for update
  to authenticated
  using (auth.uid() = created_by);

-- 5. Page Revisions Policies
create policy "Public can view revisions of published pages"
  on public.page_revisions for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_revisions.page_id
      and p.status = 'published'
    )
  );

create policy "Publishers can view revisions of their own pages"
  on public.page_revisions for select
  to authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_revisions.page_id
      and (p.created_by = auth.uid() or p.status = 'published')
    )
  );

create policy "Publishers can create revisions for their own pages"
  on public.page_revisions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pages p
      where p.id = page_revisions.page_id
      and p.created_by = auth.uid()
    )
  );

-- 6. Sources Policies
create policy "Public can view sources of published page revisions"
  on public.sources for select
  using (
    exists (
      select 1 from public.page_sources ps
      join public.page_revisions pr on pr.id = ps.page_revision_id
      join public.pages p on p.id = pr.page_id
      where ps.source_id = sources.id
      and p.status = 'published'
    )
  );

create policy "Publishers can view their own created sources"
  on public.sources for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Publishers can insert their own sources"
  on public.sources for insert
  to authenticated
  with check (auth.uid() = created_by);

-- 7. Source Sentences Policies
create policy "Public can view sentences of published sources"
  on public.source_sentences for select
  using (
    exists (
      select 1 from public.page_sources ps
      join public.page_revisions pr on pr.id = ps.page_revision_id
      join public.pages p on p.id = pr.page_id
      where ps.source_id = source_sentences.source_id
      and p.status = 'published'
    )
  );

create policy "Publishers can view sentences of their created sources"
  on public.source_sentences for select
  to authenticated
  using (
    exists (
      select 1 from public.sources s
      where s.id = source_sentences.source_id
      and s.created_by = auth.uid()
    )
  );

create policy "Publishers can insert sentences for their created sources"
  on public.source_sentences for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sources s
      where s.id = source_sentences.source_id
      and s.created_by = auth.uid()
    )
  );

-- 8. Page Sources Junction Policies
create policy "Public can view page sources of published pages"
  on public.page_sources for select
  using (
    exists (
      select 1 from public.page_revisions pr
      join public.pages p on p.id = pr.page_id
      where pr.id = page_sources.page_revision_id
      and p.status = 'published'
    )
  );

create policy "Publishers can manage page sources for their pages"
  on public.page_sources for all
  to authenticated
  using (
    exists (
      select 1 from public.page_revisions pr
      join public.pages p on p.id = pr.page_id
      where pr.id = page_sources.page_revision_id
      and p.created_by = auth.uid()
    )
  );

-- 9. Bulletin Pages Policies
create policy "Public can view bulletin pages of published bulletins"
  on public.bulletin_pages for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = bulletin_pages.bulletin_id
      and p.status = 'published'
    )
  );

create policy "Publishers can manage bulletin pages for their own bulletins"
  on public.bulletin_pages for all
  to authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = bulletin_pages.bulletin_id
      and p.created_by = auth.uid()
    )
  );

-- 10. Publisher Audit Log Policies
create policy "Publishers can view their own audit logs"
  on public.publisher_audit_log for select
  to authenticated
  using (auth.uid() = actor_id);

create policy "Publishers can insert audit log records"
  on public.publisher_audit_log for insert
  to authenticated
  with check (auth.uid() = actor_id);
