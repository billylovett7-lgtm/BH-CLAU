-- ─── Codex Build Hub — Initial Supabase schema ──────────────────────────────
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- All tables use UUID primary keys and mirror the Dexie/Zod schemas.
-- RLS is enabled on every table — workspace isolation via workspaceId.

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- fast ilike search

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create or replace function now_iso() returns text language sql as $$
  select to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
$$;

-- ─── workspaces ──────────────────────────────────────────────────────────────

create table if not exists workspaces (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null default 'My Workspace',
  created_at    timestamptz not null default now()
);

alter table workspaces enable row level security;

create policy "workspace_owner_all" on workspaces
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── builds ──────────────────────────────────────────────────────────────────

create table if not exists builds (
  id               uuid primary key,
  owner_id         uuid not null references auth.users(id) on delete cascade,
  workspace_id     uuid not null,
  schema_version   smallint not null default 1,
  title            text not null,
  genre            text not null default '',
  subgenre         text not null default '',
  bpm              numeric,
  key              text,
  root             text,
  status           text not null default 'in-progress',
  priority         text not null default 'medium',
  due_date         text,
  favourite        boolean not null default false,
  archived         boolean not null default false,
  tags             text[] not null default '{}',
  progress         smallint not null default 0,
  current_stage    text not null default 'overview',
  source_summary   text not null default '',
  notes            text not null default '',
  created_at       text not null,
  updated_at       text not null,
  deleted_at       text
);

create index on builds (workspace_id, deleted_at);
create index on builds using gin (title gin_trgm_ops);

alter table builds enable row level security;

create policy "builds_owner_all" on builds
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── build_stages ─────────────────────────────────────────────────────────────

create table if not exists build_stages (
  id            uuid primary key,
  build_id      uuid not null references builds(id) on delete cascade,
  stage_key     text not null,
  title         text not null,
  "order"       smallint not null,
  completed     boolean not null default false,
  completed_at  text,
  task_checks   jsonb not null default '[]'
);

create index on build_stages (build_id, stage_key);

alter table build_stages enable row level security;

create policy "build_stages_via_build" on build_stages
  using (exists (
    select 1 from builds b
    where b.id = build_stages.build_id and b.owner_id = auth.uid()
  ));

-- ─── blocks ──────────────────────────────────────────────────────────────────

create table if not exists blocks (
  id          uuid primary key,
  build_id    uuid not null references builds(id) on delete cascade,
  stage_key   text not null,
  "order"     smallint not null,
  locked      boolean not null default false,
  type        text not null,
  data        jsonb not null default '{}'
);

create index on blocks (build_id, stage_key);

alter table blocks enable row level security;

create policy "blocks_via_build" on blocks
  using (exists (
    select 1 from builds b
    where b.id = blocks.build_id and b.owner_id = auth.uid()
  ));

-- ─── chain_racks ─────────────────────────────────────────────────────────────

create table if not exists chain_racks (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  name            text not null,
  role            text not null default '',
  genre           text not null default '',
  variant         text not null default '',
  devices         jsonb not null default '[]',
  macros          jsonb not null default '[]',
  gain_notes      text not null default '',
  mono_safety     boolean not null default false,
  favourite       boolean not null default false,
  tags            text[] not null default '{}',
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table chain_racks enable row level security;
create policy "chain_racks_owner" on chain_racks using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── midi_patterns ───────────────────────────────────────────────────────────

create table if not exists midi_patterns (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  name            text not null,
  type            text not null default 'drum',
  genre           text not null default '',
  bpm             numeric,
  key             text,
  scale           text,
  root            text,
  bars            smallint not null default 1,
  grid            smallint not null default 16,
  swing           numeric not null default 0,
  ppq             smallint not null default 96,
  note_events     jsonb not null default '[]',
  clip_variations jsonb not null default '[]',
  placement       text not null default '',
  tags            text[] not null default '{}',
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table midi_patterns enable row level security;
create policy "midi_patterns_owner" on midi_patterns using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── samples ─────────────────────────────────────────────────────────────────

create table if not exists samples (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  asset_id        uuid,
  name            text not null,
  type            text not null default 'other',
  genre           text not null default '',
  root            text,
  key             text,
  bpm             numeric,
  duration        numeric,
  channels        smallint,
  sample_rate     integer,
  bit_depth       smallint,
  format          text not null default '',
  role            text not null default '',
  tags            text[] not null default '{}',
  notes           text not null default '',
  local_only      boolean not null default true,
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table samples enable row level security;
create policy "samples_owner" on samples using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── presets ─────────────────────────────────────────────────────────────────

create table if not exists presets (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  asset_id        uuid,
  name            text not null,
  synth           text not null default 'Serum',
  type            text not null default 'other',
  genre           text not null default '',
  version         text not null default '',
  macros          jsonb not null default '[]',
  oscillators     text not null default '',
  filter          text not null default '',
  envelopes       text not null default '',
  modulation      text not null default '',
  effects         text not null default '',
  tags            text[] not null default '{}',
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table presets enable row level security;
create policy "presets_owner" on presets using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── grooves ─────────────────────────────────────────────────────────────────

create table if not exists grooves (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  name            text not null,
  genre           text not null default '',
  grid            smallint not null default 16,
  swing           numeric not null default 0,
  timing          jsonb not null default '[]',
  random          numeric not null default 0,
  velocity        jsonb not null default '[]',
  targets         text[] not null default '{}',
  exclude         text[] not null default '{}',
  notes           text not null default '',
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table grooves enable row level security;
create policy "grooves_owner" on grooves using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── arrangements ────────────────────────────────────────────────────────────

create table if not exists arrangements (
  id              uuid primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid not null,
  schema_version  smallint not null default 1,
  name            text not null,
  genre           text not null default '',
  bars            smallint not null default 128,
  phrase_size     smallint not null default 8,
  sections        jsonb not null default '[]',
  energy_plan     text not null default '',
  hook_strategy   text not null default '',
  mix_in          text not null default '',
  mix_out         text not null default '',
  notes           text not null default '',
  created_at      text not null,
  updated_at      text not null,
  deleted_at      text
);

alter table arrangements enable row level security;
create policy "arrangements_owner" on arrangements using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── share_links ─────────────────────────────────────────────────────────────

create table if not exists share_links (
  id          uuid primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  build_id    uuid not null references builds(id) on delete cascade,
  slug        text not null unique,
  visibility  text not null default 'unlisted',
  expires_at  text,
  allow_copy  boolean not null default false,
  created_at  text not null
);

create index on share_links (slug);
create index on share_links (build_id);

alter table share_links enable row level security;

-- owner can manage their own links
create policy "share_links_owner" on share_links
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- anyone can read public/unlisted links by slug (for public share page)
create policy "share_links_public_read" on share_links
  for select
  using (visibility in ('public', 'unlisted'));

-- ─── import_jobs ─────────────────────────────────────────────────────────────

create table if not exists import_jobs (
  id                uuid primary key,
  owner_id          uuid not null references auth.users(id) on delete cascade,
  file_name         text not null,
  file_type         text not null,
  status            text not null default 'pending',
  parser_version    text not null default '1.0.0',
  detected_metadata jsonb,
  preview_blocks    jsonb not null default '[]',
  errors            jsonb not null default '[]',
  created_at        text not null
);

alter table import_jobs enable row level security;
create policy "import_jobs_owner" on import_jobs using (owner_id = auth.uid()) with check (owner_id = auth.uid());
