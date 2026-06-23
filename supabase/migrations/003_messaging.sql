create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(client_id, prestataire_id)
);

alter table public.conversations enable row level security;

create policy "Conversation participants can view"
  on public.conversations for select
  using (auth.uid() = client_id or auth.uid() = prestataire_id);

create policy "Clients can create conversations"
  on public.conversations for insert
  with check (auth.uid() = client_id);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz,
  is_flagged boolean default false
);

alter table public.messages enable row level security;

create policy "Conversation participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.client_id = auth.uid() or c.prestataire_id = auth.uid())
    )
  );
