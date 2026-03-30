-- ============================================================
-- Add label and notes columns to reddit_ideas table
-- ============================================================

-- Add new columns if they don't exist
alter table reddit_ideas 
add column if not exists label text default 'Untagged',
add column if not exists notes text,
add column if not exists updated_at timestamptz default now();

-- Create index for label filtering
create index if not exists reddit_ideas_label_idx on reddit_ideas (label);

-- Update RLS to allow updates
create policy "Allow anon update" on reddit_ideas
  for update using (true);
