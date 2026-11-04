create table public.phim_full_lesson_access (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.phim_full_lesson_access enable row level security;
revoke all on public.phim_full_lesson_access from public, anon, authenticated;
grant select on public.phim_full_lesson_access to authenticated;

create policy "Learners read their own full lesson grant"
on public.phim_full_lesson_access for select to authenticated
using ((select auth.uid()) = user_id);
