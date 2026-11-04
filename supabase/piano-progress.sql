create table public.phim_lesson_completions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson_id smallint not null check (lesson_id between 1 and 20),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.phim_lesson_completions enable row level security;
revoke all on public.phim_lesson_completions from public, anon, authenticated;
grant select, insert on public.phim_lesson_completions to authenticated;

create policy "Learners read their own completions"
on public.phim_lesson_completions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Learners add their own completions"
on public.phim_lesson_completions for insert to authenticated
with check ((select auth.uid()) = user_id);
