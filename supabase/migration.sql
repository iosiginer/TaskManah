-- TaskFlow database schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- Tasks table
create table if not exists tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  due_date text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text not null default 'personal' check (category in ('personal', 'work', 'health', 'shopping', 'other')),
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists idx_tasks_user_id on tasks(user_id);

-- Enable Row Level Security
alter table tasks enable row level security;

-- Users can only see their own tasks
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

-- Users can insert their own tasks
create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

-- Users can update their own tasks
create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

-- Users can delete their own tasks
create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at();

-- Enable realtime for the tasks table
alter publication supabase_realtime add table tasks;
