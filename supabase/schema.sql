-- Random Football database schema (PostgreSQL / Supabase)
create extension if not exists pgcrypto;

create type team_kind as enum ('national','club');
create type data_status as enum ('demo','verified','unverified');
create type player_position as enum ('GK','LB','CB','RB','CDM','CM','CAM','LW','RW','ST');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind team_kind not null,
  country_code char(2),
  created_at timestamptz not null default now(),
  unique(name,kind)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  known_as text,
  nationality text,
  birth_date date,
  data_status data_status not null default 'unverified',
  created_at timestamptz not null default now()
);
create index players_name_idx on public.players using gin (to_tsvector('simple', full_name));

-- A player can represent multiple teams across their career.
create table public.player_teams (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  joined_on date,
  left_on date,
  relationship text not null default 'played_for',
  unique(player_id,team_id,relationship),
  check(left_on is null or joined_on is null or left_on >= joined_on)
);

create table public.player_positions (
  player_id uuid not null references public.players(id) on delete cascade,
  position player_position not null,
  is_primary boolean not null default false,
  primary key(player_id,position)
);

create table public.rating_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  edition text,
  season_year int,
  source_url text,
  rights_notes text,
  unique(source_name,edition)
);

create table public.player_ratings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  source_id uuid references public.rating_sources(id),
  overall smallint not null check(overall between 1 and 99),
  position player_position,
  is_peak boolean not null default false,
  status data_status not null default 'unverified',
  verified_at timestamptz,
  unique(player_id,source_id,position)
);

create table public.formations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  positions jsonb not null,
  is_active boolean not null default true
);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  formation_id uuid not null references public.formations(id),
  team_ids uuid[] not null check(array_length(team_ids,1)=3),
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.drafts(id) on delete cascade,
  position_key text not null,
  player_id uuid not null references public.players(id),
  source_team_id uuid not null references public.teams(id),
  pick_order smallint not null,
  unique(draft_id,position_key),
  unique(draft_id,player_id),
  unique(draft_id,pick_order)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_draft_id uuid not null references public.drafts(id),
  away_draft_id uuid not null references public.drafts(id),
  status text not null default 'pending' check(status in ('pending','simulated','live','completed')),
  home_score smallint,
  away_score smallint,
  engine_version text,
  created_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null default 'single_elimination',
  max_players int not null default 16 check(max_players in (8,16,32,64)),
  status text not null default 'registration' check(status in ('registration','in_progress','completed')),
  created_at timestamptz not null default now()
);
create table public.tournament_entries (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  draft_id uuid not null references public.drafts(id),
  seed int,
  primary key(tournament_id,draft_id)
);
create table public.tournament_rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number smallint not null,
  match_id uuid references public.matches(id),
  winner_draft_id uuid references public.drafts(id),
  unique(tournament_id,round_number,match_id)
);

-- Public read access for catalog data; write operations are reserved for trusted server workflows.
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.player_teams enable row level security;
alter table public.player_positions enable row level security;
alter table public.rating_sources enable row level security;
alter table public.player_ratings enable row level security;
alter table public.formations enable row level security;
alter table public.drafts enable row level security;
alter table public.draft_picks enable row level security;
alter table public.matches enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.tournament_rounds enable row level security;

create policy "catalog teams readable" on public.teams for select using (true);
create policy "catalog players readable" on public.players for select using (true);
create policy "player teams readable" on public.player_teams for select using (true);
create policy "player positions readable" on public.player_positions for select using (true);
create policy "rating sources readable" on public.rating_sources for select using (true);
create policy "ratings readable" on public.player_ratings for select using (true);
create policy "formations readable" on public.formations for select using (is_active);
create policy "tournaments readable" on public.tournaments for select using (true);

insert into public.formations(code,name,positions) values
('4-3-3','4-3-3','["GK","LB","CB","CB","RB","CM","CM","CDM","LW","ST","RW"]'::jsonb),
('4-2-3-1','4-2-3-1','["GK","LB","CB","CB","RB","CDM","CDM","CAM","LW","ST","RW"]'::jsonb),
('3-5-2','3-5-2','["GK","CB","CB","CB","LM","CM","CM","RM","CAM","ST","ST"]'::jsonb)
on conflict(code) do nothing;
