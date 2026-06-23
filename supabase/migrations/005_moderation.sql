create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id),
  reported_user_id uuid references public.profiles(id),
  conversation_id uuid references public.conversations(id),
  message_id uuid references public.messages(id),
  reason text check (reason in ('profanity', 'harassment', 'inappropriate')),
  created_at timestamptz default now(),
  reviewed boolean default false
);

alter table public.reports enable row level security;

create policy "Authenticated users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create table public.user_warnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  strike_number int not null check (strike_number between 1 and 3),
  created_at timestamptz default now()
);

alter table public.user_warnings enable row level security;

create policy "Users can view their own warnings"
  on public.user_warnings for select
  using (auth.uid() = user_id);
