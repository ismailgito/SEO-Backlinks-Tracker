-- Supabase Schema Migration: schema hardening
-- Prepared: 28 October 2026
--
-- Fixes found in the QA pass. Safe to re-run.
--   * Submission INSERT/UPDATE policies only checked owner_id, so a user could
--     write rows into another user's project (occupying its unique
--     (project_id, source_id) slots). They now also require the project to
--     belong to the caller.
--   * backlink_submissions.source_id was ON DELETE CASCADE: removing or
--     re-keying a catalog row silently wiped every user's tracking for it.
--   * Missing index on projects(owner_id) (scanned by every RLS check) and no
--     guarantee of a single default project per owner.

-- 1. Submissions may only reference the caller's own projects
drop policy if exists "Users can insert their own submissions" on public.backlink_submissions;
create policy "Users can insert their own submissions"
  on public.backlink_submissions for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own submissions" on public.backlink_submissions;
create policy "Users can update their own submissions"
  on public.backlink_submissions for update
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- 2. Catalog changes must not destroy user data
alter table public.backlink_submissions
  drop constraint if exists backlink_submissions_source_id_fkey;
alter table public.backlink_submissions
  add constraint backlink_submissions_source_id_fkey
  foreign key (source_id) references public.backlink_sources(id) on delete restrict;

-- 3. Indexes / constraints
create index if not exists idx_projects_owner on public.projects(owner_id);
create unique index if not exists uq_projects_one_default
  on public.projects(owner_id) where is_default;
