-- Run this entire file in Supabase -> SQL Editor.

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id text not null,
  subject text not null check (subject in ('cse202', 'cse205')),
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

alter table public.progress enable row level security;

drop policy if exists "Users can view their own progress" on public.progress;
drop policy if exists "Users can insert their own progress" on public.progress;
drop policy if exists "Users can update their own progress" on public.progress;
drop policy if exists "Users can delete their own progress" on public.progress;

create policy "Users can view their own progress"
on public.progress for select
using (auth.uid() = user_id);

create policy "Users can insert their own progress"
on public.progress for insert
with check (auth.uid() = user_id);

create policy "Users can update their own progress"
on public.progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own progress"
on public.progress for delete
using (auth.uid() = user_id);

create index if not exists progress_user_id_idx on public.progress(user_id);
