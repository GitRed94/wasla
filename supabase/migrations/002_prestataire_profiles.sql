create table public.prestataire_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  display_name text not null,
  bio text,
  avatar_url text,
  categories text[] default '{}',
  wilaya text not null,
  commune text not null,
  years_experience int,
  badge text default 'unverified' check (badge in ('unverified', 'verified', 'trusted')),
  is_visible boolean default true,
  created_at timestamptz default now()
);

alter table public.prestataire_profiles enable row level security;

create policy "Anyone can view visible prestataire profiles"
  on public.prestataire_profiles for select
  using (is_visible = true);

create policy "Prestataires can update their own profile"
  on public.prestataire_profiles for update
  using (auth.uid() = id);

create policy "Prestataires can insert their own profile"
  on public.prestataire_profiles for insert
  with check (auth.uid() = id);

create table public.portfolio_photos (
  id uuid default gen_random_uuid() primary key,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz default now()
);

alter table public.portfolio_photos enable row level security;

create policy "Anyone can view portfolio photos"
  on public.portfolio_photos for select
  using (true);

create policy "Prestataires can view their own photos for management"
  on public.portfolio_photos for select
  using (auth.uid() = prestataire_id);

create policy "Prestataires can insert their own photos"
  on public.portfolio_photos for insert
  with check (auth.uid() = prestataire_id);

create policy "Prestataires can delete their own photos"
  on public.portfolio_photos for delete
  using (auth.uid() = prestataire_id);
