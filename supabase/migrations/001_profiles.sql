-- Auto-create a profile row when a user signs up
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('client', 'prestataire')),
  preferred_language text default 'fr' check (preferred_language in ('fr', 'ar', 'en')),
  wilaya text,
  commune text,
  strike_count int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow public to read prestataire profiles (needed for browse)
create policy "Public can view prestataire profiles"
  on public.profiles for select
  using (role = 'prestataire');

-- Trigger: insert profile row on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (new.id, (new.raw_user_meta_data->>'role')::text);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
