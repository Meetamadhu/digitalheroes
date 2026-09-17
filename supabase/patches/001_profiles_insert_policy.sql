-- Run in Supabase SQL Editor if login loops (user in auth but no profiles row / insert blocked)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
  with check (auth.uid() = id);
