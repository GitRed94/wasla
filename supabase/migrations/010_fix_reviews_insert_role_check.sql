-- Fix: add explicit role='client' check to reviews INSERT policy
-- Previously relied on c.client_id = auth.uid() as proxy (functionally correct
-- but inconsistent with conversations policy which has the explicit check).

drop policy if exists "clients insert reviews after conversation" on public.reviews;

create policy "clients insert reviews after conversation"
  on public.reviews for insert
  with check (
    client_id = auth.uid()
    and (select role from public.profiles where id = auth.uid()) = 'client'
    and exists (
      select 1 from public.conversations c
      join public.messages m on m.conversation_id = c.id
      where c.id = reviews.conversation_id
        and c.client_id = auth.uid()
    )
  );
