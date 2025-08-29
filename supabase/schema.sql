-- Supabase schema for Polling App
-- Tables: polls, poll_options, votes
-- Includes indexes, constraints, and RLS policies

-- Extensions
create extension if not exists "pgcrypto";

-- Utility: updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- polls
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 200),
  description text,
  is_public boolean not null default true,
  allow_multiple boolean not null default false,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_polls_owner on public.polls(owner_id);
create index if not exists idx_polls_is_public on public.polls(is_public);
create index if not exists idx_polls_expires_at on public.polls(expires_at);

drop trigger if exists trg_polls_set_updated_at on public.polls;
create trigger trg_polls_set_updated_at
before update on public.polls
for each row
execute function public.set_updated_at();

-- poll_options
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null check (char_length(option_text) > 0),
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (poll_id, option_text)
);

create index if not exists idx_poll_options_poll on public.poll_options(poll_id);
create unique index if not exists uq_poll_options_poll_id_id on public.poll_options(poll_id, id);

-- votes
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id uuid null references auth.users(id) on delete set null,
  voter_ip inet null,
  voter_fingerprint text null,
  created_at timestamptz not null default now(),
  -- Ensure the option belongs to the same poll (composite FK)
  constraint votes_option_belongs_to_poll
    foreign key (poll_id, option_id)
    references public.poll_options(poll_id, id)
    on delete cascade
    deferrable initially deferred
);

create index if not exists idx_votes_poll on public.votes(poll_id);
create index if not exists idx_votes_option on public.votes(option_id);
create index if not exists idx_votes_voter on public.votes(voter_id);

-- Only one vote per authenticated user per poll (when voter_id present)
create unique index if not exists votes_unique_user_per_poll
  on public.votes(poll_id, voter_id)
  where voter_id is not null;

-- Optionally limit anonymous duplicates if fingerprint provided
create unique index if not exists votes_unique_fp_per_poll
  on public.votes(poll_id, voter_fingerprint)
  where voter_id is null and voter_fingerprint is not null;

-- RLS enablement
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

-- RLS Policies: polls
drop policy if exists "Public or owner can read polls" on public.polls;
create policy "Public or owner can read polls"
  on public.polls for select
  using (
    is_public or auth.uid() = owner_id
  );

drop policy if exists "Owner can insert polls" on public.polls;
create policy "Owner can insert polls"
  on public.polls for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can update polls" on public.polls;
create policy "Owner can update polls"
  on public.polls for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can delete polls" on public.polls;
create policy "Owner can delete polls"
  on public.polls for delete
  using (auth.uid() = owner_id);

-- RLS Policies: poll_options
drop policy if exists "Read options if poll public or owner" on public.poll_options;
create policy "Read options if poll public or owner"
  on public.poll_options for select
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.is_public or p.owner_id = auth.uid())
    )
  );

drop policy if exists "Owner can manage options" on public.poll_options;
create policy "Owner can manage options"
  on public.poll_options for all
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.owner_id = auth.uid()
    )
  );

-- RLS Policies: votes
drop policy if exists "Read votes if poll public or owner" on public.votes;
create policy "Read votes if poll public or owner"
  on public.votes for select
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and (p.is_public or p.owner_id = auth.uid())
    )
  );

drop policy if exists "Insert vote if poll public and not expired" on public.votes;
create policy "Insert vote if poll public and not expired"
  on public.votes for insert
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id
        and p.is_public = true
        and (p.expires_at is null or now() < p.expires_at)
    )
  );

drop policy if exists "Owner can delete votes" on public.votes;
create policy "Owner can delete votes"
  on public.votes for delete
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.owner_id = auth.uid()
    )
  );

-- Helpful view: option vote counts per poll
create or replace view public.poll_option_counts as
select
  po.poll_id,
  po.id     as option_id,
  po.option_text,
  count(v.id)      as vote_count
from public.poll_options po
left join public.votes v
  on v.option_id = po.id
group by po.poll_id, po.id, po.option_text;

grant select on public.poll_option_counts to anon, authenticated;

-- Privileges: make tables accessible via RLS to anon/authenticated
grant usage on schema public to anon, authenticated;
grant select on table public.polls to anon, authenticated;
grant select on table public.poll_options to anon, authenticated;
grant select on table public.votes to anon, authenticated;
grant insert on table public.polls to authenticated;
grant insert on table public.poll_options to authenticated;
grant insert on table public.votes to anon, authenticated;
grant update, delete on table public.polls to authenticated;
grant update, delete on table public.poll_options to authenticated;
grant delete on table public.votes to authenticated;

-- Done