-- Digital Heroes — Supabase schema (run in SQL editor on a new project)

create extension if not exists "pgcrypto";

create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  featured boolean not null default false,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  draw_logic text not null default 'random' check (draw_logic in ('random', 'algorithmic')),
  jackpot_rollover numeric(12, 2) not null default 0,
  monthly_price_gbp numeric(10, 2) not null default 9.99,
  yearly_price_gbp numeric(10, 2) not null default 99.99,
  pool_share_percent numeric(5, 2) not null default 30
);

insert into public.platform_settings (id) values (1) on conflict do nothing;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  charity_id uuid references public.charities (id),
  charity_percent numeric(5, 2) not null default 10 check (charity_percent >= 10 and charity_percent <= 100),
  stripe_customer_id text,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'cancelled', 'lapsed')),
  plan_type text check (plan_type in ('monthly', 'yearly')),
  subscription_renews_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.golf_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score int not null check (score between 1 and 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)
);

create index golf_scores_user_played on public.golf_scores (user_id, played_on desc);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  winning_numbers int[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'simulated', 'published')),
  logic_used text check (logic_used in ('random', 'algorithmic')),
  simulation_snapshot jsonb,
  published_at timestamptz,
  unique (year, month)
);

create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_count int not null default 0 check (match_count between 0 and 5),
  unique (draw_id, user_id)
);

create table public.draw_winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier int not null check (tier in (3, 4, 5)),
  prize_amount numeric(12, 2) not null default 0,
  proof_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected', 'not_required')),
  payout_status text not null default 'pending'
    check (payout_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table public.standalone_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  charity_id uuid not null references public.charities (id),
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.charities enable row level security;
alter table public.platform_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.golf_scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.draw_winners enable row level security;
alter table public.standalone_donations enable row level security;

-- Public read charities
create policy "charities_public_read" on public.charities for select using (true);
create policy "charities_admin_write" on public.charities for all using (public.is_admin());

create policy "settings_public_read" on public.platform_settings for select using (true);
create policy "settings_admin_write" on public.platform_settings for all using (public.is_admin());

create policy "profiles_read_own_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "scores_own_or_admin" on public.golf_scores for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "draws_public_read_published" on public.draws for select
  using (status = 'published' or public.is_admin());
create policy "draws_admin_write" on public.draws for all using (public.is_admin());

create policy "entries_own_or_admin" on public.draw_entries for select
  using (auth.uid() = user_id or public.is_admin());
create policy "entries_admin_write" on public.draw_entries for all using (public.is_admin());

create policy "winners_own_or_admin" on public.draw_winners for select
  using (auth.uid() = user_id or public.is_admin());
create policy "winners_update_own_proof" on public.draw_winners for update
  using (auth.uid() = user_id or public.is_admin());
create policy "winners_admin_write" on public.draw_winners for insert with check (public.is_admin());

create policy "donations_insert_auth" on public.standalone_donations for insert
  with check (auth.uid() is not null);
create policy "donations_read_own_or_admin" on public.standalone_donations for select
  using (auth.uid() = user_id or public.is_admin());

-- Storage bucket for winner proofs (create in dashboard: winner-proofs, authenticated upload)
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', false)
on conflict do nothing;

create policy "proof_upload_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "proof_read_own_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'winner-proofs'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- Seed charities
insert into public.charities (name, slug, description, featured, events) values
(
  'Fairway Futures',
  'fairway-futures',
  'Youth programmes that use sport to build confidence and community ties across the UK.',
  true,
  '[{"title":"Spring charity round","date":"2026-04-12","location":"Surrey"}]'::jsonb
),
(
  'Green Horizon Trust',
  'green-horizon',
  'Restoring urban green spaces and funding accessible outdoor education.',
  false,
  '[{"title":"Community golf day","date":"2026-06-20","location":"Manchester"}]'::jsonb
),
(
  'Links of Hope',
  'links-of-hope',
  'Mental health support for athletes and families, delivered through local clubs.',
  true,
  '[]'::jsonb
);
