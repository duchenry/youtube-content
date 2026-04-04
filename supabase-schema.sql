-- ============================================================
-- YouTube Script Analyzer — Supabase Schema
-- Run this once in your Supabase project → SQL Editor
-- ============================================================

-- Table for storing Reddit idea analysis
create table if not exists reddit_ideas (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- Reddit post URL (unique to prevent duplicates)
  url         text not null unique,

  -- Raw Reddit data (post title, self-text, top 10 comments)
  reddit_data jsonb,

  -- The AI analysis output (viral DNA)
  analysis    jsonb not null,

  -- Status: analyzed, processing, failed
  status      text default 'analyzed'
);

-- Index for URL lookup
create index if not exists reddit_ideas_url_idx on reddit_ideas (url);

-- Index for chronological listing
create index if not exists reddit_ideas_created_at_idx on reddit_ideas (created_at desc);

-- RLS for reddit_ideas
alter table reddit_ideas enable row level security;

create policy "Allow anon select" on reddit_ideas
  for select using (true);

create policy "Allow anon insert" on reddit_ideas
  for insert with check (true);

create policy "Allow anon delete" on reddit_ideas
  for delete using (true);

create table if not exists analyses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- Snippet of the script (first 200 chars) for display in sidebar
  script_preview  text not null,

  -- Optional raw comments
  comments    text,

  -- The full GPT analysis as JSONB — queryable, indexable
  result      jsonb not null,

  -- Step 2: research directives (AI-generated Reddit search guide)
  research    jsonb,

  -- Step 3: strategic synthesis (final strategy output)
  synthesis   jsonb,

  -- Raw Reddit data the user pasted (structured posts + comments)
  reddit_raw  text,

  -- Derived title from coreInsight for quick display
  title       text,

  -- Slug for URL routing
  slug        text
);

-- Table for storing generated draft content
create table if not exists drafts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Reference to the analysis slug
  analysis_slug text not null,

  -- The generated draft content as JSONB
  content     jsonb not null,

  -- Optional user-edited version
  edited_content jsonb,

  -- Status: generated, editing, published, etc.
  status      text default 'generated'
);

-- Index for fast chronological listing
create index if not exists analyses_created_at_idx on analyses (created_at desc);

-- Index for slug lookup
create index if not exists analyses_slug_idx on analyses (slug);

-- Indexes for drafts table
create index if not exists drafts_analysis_slug_idx on drafts (analysis_slug);
create index if not exists drafts_created_at_idx on drafts (created_at desc);
create index if not exists drafts_status_idx on drafts (status);

-- ── Row Level Security ──────────────────────────────────────
-- For a personal/team tool with no auth, allow anon read/write.
-- If you add Supabase Auth later, tighten this to auth.uid().

alter table analyses enable row level security;
alter table drafts enable row level security;

create policy "Allow anon select" on analyses
  for select using (true);

create policy "Allow anon insert" on analyses
  for insert with check (true);

create policy "Allow anon delete" on analyses
  for delete using (true);

create policy "Allow anon select" on drafts
  for select using (true);

create policy "Allow anon insert" on drafts
  for insert with check (true);

create policy "Allow anon update" on drafts
  for update using (true);

create policy "Allow anon delete" on drafts
  for delete using (true);
