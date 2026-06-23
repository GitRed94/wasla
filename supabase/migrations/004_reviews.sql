create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  prestataire_id uuid references public.prestataire_profiles(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  job_photos text[] default '{}',
  job_marked_complete boolean default false,
  created_at timestamptz default now(),
  unique(client_id, prestataire_id, conversation_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Clients can insert reviews for completed jobs"
  on public.reviews for insert
  with check (
    auth.uid() = client_id and
    job_marked_complete = true
  );
