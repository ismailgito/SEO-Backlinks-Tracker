-- Supabase Schema Migration: Backlinks SEO Application
-- Prepared: 8 October 2026

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  email text null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PROJECTS (Multi-site tracking)
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website_url text not null,
  description text null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. BACKLINK SOURCES (Global inventory)
create table if not exists public.backlink_sources (
  id text primary key,
  name text not null,
  submission_url text null,
  domain text null,
  dr numeric not null default 0,
  dr_band text not null,
  categories text[] not null default '{}',
  source_follow_status text not null check (source_follow_status in ('dofollow', 'nofollow', 'unverified')),
  source_status_note text null,
  source_list_reference text not null default 'Backlinks.md (2026 Edition)',
  source_verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. BACKLINK SUBMISSIONS (User/Project tracking)
create table if not exists public.backlink_submissions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id text not null references public.backlink_sources(id) on delete cascade,
  status text not null check (status in ('unsubmitted', 'on_progress', 'submitted', 'secured', 'rejected', 'unable')),
  submitted_at timestamptz null,
  secured_at timestamptz null,
  live_url text null,
  observed_follow_status text null check (observed_follow_status in ('dofollow', 'nofollow', 'unverified')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_project_source unique (project_id, source_id)
);

-- 5. SUBMISSION EVENTS (Audit log)
create table if not exists public.submission_events (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.backlink_submissions(id) on delete cascade,
  actor_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  old_status text null,
  new_status text null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. APP SETTINGS
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text null,
  updated_at timestamptz not null default now()
);

-- Insert default free tier threshold: 5 secured backlinks
insert into public.app_settings (key, value, description)
values ('free_tier_secured_limit', '{"limit": 5}'::jsonb, 'Maximum secured backlinks allowed for guest or free accounts')
on conflict (key) do nothing;

-- INDEXES
create index if not exists idx_sources_dr on public.backlink_sources(dr desc);
create index if not exists idx_sources_follow on public.backlink_sources(source_follow_status);
create index if not exists idx_sources_band on public.backlink_sources(dr_band);
create index if not exists idx_submissions_project on public.backlink_submissions(project_id);
create index if not exists idx_submissions_owner on public.backlink_submissions(owner_id);
create index if not exists idx_submissions_status on public.backlink_submissions(status);
create index if not exists idx_events_submission on public.submission_events(submission_id);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.backlink_sources enable row level security;
alter table public.backlink_submissions enable row level security;
alter table public.submission_events enable row level security;
alter table public.app_settings enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policies for Projects
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = owner_id);

-- Policies for Backlink Sources (Global read-only)
create policy "Anyone can read backlink sources"
  on public.backlink_sources for select
  to public
  using (true);

-- Policies for Submissions
create policy "Users can view their own submissions"
  on public.backlink_submissions for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own submissions"
  on public.backlink_submissions for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own submissions"
  on public.backlink_submissions for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own submissions"
  on public.backlink_submissions for delete
  using (auth.uid() = owner_id);

-- Policies for Events
create policy "Users can view events for their submissions"
  on public.submission_events for select
  using (
    exists (
      select 1 from public.backlink_submissions s
      where s.id = submission_events.submission_id and s.owner_id = auth.uid()
    )
  );
