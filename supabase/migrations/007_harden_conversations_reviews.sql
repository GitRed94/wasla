-- Require caller to be a client and prestataire to be visible
drop policy "Clients can create conversations" on public.conversations;

create policy "Clients can create conversations"
  on public.conversations for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
    and exists (
      select 1 from public.prestataire_profiles
      where id = prestataire_id and is_visible = true
    )
  );

-- Require at least one message in the conversation before allowing a review
drop policy "Clients can insert reviews after conversation" on public.reviews;

create policy "Clients can insert reviews after conversation"
  on public.reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.conversations c
      join public.messages m on m.conversation_id = c.id
      where c.client_id = auth.uid()
      and c.prestataire_id = reviews.prestataire_id
    )
  );
