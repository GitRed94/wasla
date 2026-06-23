-- Harden handle_new_user: reject anything that isn't explicitly 'client' or 'prestataire'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when (new.raw_user_meta_data->>'role') in ('client', 'prestataire')
        then (new.raw_user_meta_data->>'role')::text
      else 'client'
    end
  );
  return new;
end;
$$;

-- Add role sub-select check and WITH CHECK to prevent badge self-promotion
drop policy "Prestataires can update their own profile" on public.prestataire_profiles;

create policy "Prestataires can update their own profile"
  on public.prestataire_profiles for update
  using (
    auth.uid() = id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'prestataire'
    )
  )
  with check (
    auth.uid() = id
    and badge = (select badge from public.prestataire_profiles where id = auth.uid())
  );
