-- Add client profile fields to profiles table
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists contact_phone text;

-- Add prestataire-specific columns
alter table public.prestataire_profiles
  add column if not exists primary_category text,
  add column if not exists views integer not null default 0;

-- Add business phone for prestataires (Algeria only, unique)
alter table public.prestataire_profiles
  add column if not exists phone text;

alter table public.prestataire_profiles
  add constraint prestataire_phone_unique unique (phone);

alter table public.prestataire_profiles
  add constraint prestataire_phone_algeria
    check (phone is null or phone ~ '^\+213[5-7][0-9]{8}$');

-- RPC to safely increment profile views (security definer bypasses RLS)
create or replace function public.increment_profile_views(presta_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  update public.prestataire_profiles
  set views = views + 1
  where id = presta_id and is_visible = true;
end;
$$;
revoke execute on function public.increment_profile_views(uuid) from public;
grant execute on function public.increment_profile_views(uuid) to anon, authenticated;

-- Storage bucket for portfolio photos (public read)
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Portfolio photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "Prestataires can upload their own portfolio photos"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Prestataires can delete their own portfolio photos"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and split_part(name, '/', 1) = auth.uid()::text
  );
