-- Remove redundant SELECT policy (covered by "Anyone can view portfolio photos")
-- and add role check to INSERT
drop policy "Prestataires can view their own photos for management" on public.portfolio_photos;
drop policy "Prestataires can insert their own photos" on public.portfolio_photos;

create policy "Prestataires can insert their own photos"
  on public.portfolio_photos for insert
  with check (
    auth.uid() = prestataire_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'prestataire'
    )
  );

-- Require reporter to be a participant in the referenced conversation
drop policy "Authenticated users can file reports" on public.reports;

create policy "Authenticated users can file reports"
  on public.reports for insert
  with check (
    auth.uid() = reporter_id
    and (
      conversation_id is null
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_id
        and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
      )
    )
  );
