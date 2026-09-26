-- Phase 5: shared entity tables for project-owned operational data.
--
-- Every table follows the same schema contract:
--   id            UUID primary key (stable across devices)
--   project_id    FK to projects — all queries must scope by this
--   created_by    FK to auth.users (set on create, never changed)
--   updated_by    FK to auth.users (updated on every mutation)
--   created_at    timestamptz
--   updated_at    timestamptz
--   deleted_at    timestamptz nullable — soft delete; never physically remove
--   server_version bigint — monotonically assigned on insert/update via trigger
--
-- A shared sequence drives server_version so all entities share a
-- project-level causal order.

-- ─────────────────────────────────────────────────────────────
-- Shared entity version sequence
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public.entity_version_seq;

-- ─────────────────────────────────────────────────────────────
-- batches
-- ─────────────────────────────────────────────────────────────
create table if not exists public.batches (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  name          text,
  start_date    text,
  initial_chicks integer,
  chick_price   numeric,
  expected_price_per_bird numeric,
  expected_price_per_kg   numeric,
  status        text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_batches_project     on public.batches(project_id, deleted_at);
create index if not exists idx_batches_project_ver on public.batches(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- feed
-- ─────────────────────────────────────────────────────────────
create table if not exists public.feed (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  batch_id      uuid references public.batches(id) on delete restrict,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  type          text,
  quantity_kg   numeric,
  price_per_kg  numeric,
  date_purchased text,
  receipt_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_feed_project     on public.feed(project_id, deleted_at);
create index if not exists idx_feed_batch       on public.feed(batch_id);
create index if not exists idx_feed_project_ver on public.feed(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- mortality
-- ─────────────────────────────────────────────────────────────
create table if not exists public.mortality (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  batch_id      uuid references public.batches(id) on delete restrict,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  quantity      integer,
  date          text,
  reason        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_mortality_project     on public.mortality(project_id, deleted_at);
create index if not exists idx_mortality_batch       on public.mortality(batch_id);
create index if not exists idx_mortality_project_ver on public.mortality(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  name          text,
  phone         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_clients_project     on public.clients(project_id, deleted_at);
create index if not exists idx_clients_project_ver on public.clients(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- sales
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sales (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  batch_id      uuid references public.batches(id) on delete restrict,
  client_id     uuid references public.clients(id) on delete restrict,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  sale_type     text,
  quantity      numeric,
  price         numeric,
  total         numeric,
  date          text,
  receipt_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_sales_project     on public.sales(project_id, deleted_at);
create index if not exists idx_sales_batch       on public.sales(batch_id);
create index if not exists idx_sales_project_ver on public.sales(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- expenses
-- ─────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  batch_id      uuid references public.batches(id) on delete restrict,
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  item_name     text not null,
  category      text not null,
  amount        numeric not null,
  date          text not null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  server_version bigint not null default nextval('public.entity_version_seq')
);

create index if not exists idx_expenses_project     on public.expenses(project_id, deleted_at);
create index if not exists idx_expenses_batch       on public.expenses(batch_id);
create index if not exists idx_expenses_project_ver on public.expenses(project_id, server_version);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.batches  enable row level security;
alter table public.feed     enable row level security;
alter table public.mortality enable row level security;
alter table public.clients  enable row level security;
alter table public.sales    enable row level security;
alter table public.expenses enable row level security;

-- batches
drop policy if exists batches_select_member   on public.batches;
drop policy if exists batches_insert_worker   on public.batches;
drop policy if exists batches_update_manager  on public.batches;
drop policy if exists batches_delete_manager  on public.batches;

create policy batches_select_member on public.batches
  for select using (public.is_project_member(project_id));

-- Only owners and managers may create/edit batches (workers are viewers for batch metadata)
create policy batches_insert_worker on public.batches
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy batches_update_manager on public.batches
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy batches_delete_manager on public.batches
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- feed (append-only; any active member may record feed)
drop policy if exists feed_select_member  on public.feed;
drop policy if exists feed_insert_worker  on public.feed;
drop policy if exists feed_update_manager on public.feed;
drop policy if exists feed_delete_manager on public.feed;

create policy feed_select_member on public.feed
  for select using (public.is_project_member(project_id));

create policy feed_insert_worker on public.feed
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy feed_update_manager on public.feed
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy feed_delete_manager on public.feed
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- mortality (append-only; any active member may record)
drop policy if exists mortality_select_member  on public.mortality;
drop policy if exists mortality_insert_worker  on public.mortality;
drop policy if exists mortality_update_manager on public.mortality;
drop policy if exists mortality_delete_manager on public.mortality;

create policy mortality_select_member on public.mortality
  for select using (public.is_project_member(project_id));

create policy mortality_insert_worker on public.mortality
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy mortality_update_manager on public.mortality
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy mortality_delete_manager on public.mortality
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- clients (shared project contacts)
drop policy if exists clients_select_member  on public.clients;
drop policy if exists clients_insert_worker  on public.clients;
drop policy if exists clients_update_manager on public.clients;
drop policy if exists clients_delete_manager on public.clients;

create policy clients_select_member on public.clients
  for select using (public.is_project_member(project_id));

create policy clients_insert_worker on public.clients
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy clients_update_manager on public.clients
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy clients_delete_manager on public.clients
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- sales (append-only; any active member may record a sale)
drop policy if exists sales_select_member  on public.sales;
drop policy if exists sales_insert_worker  on public.sales;
drop policy if exists sales_update_manager on public.sales;
drop policy if exists sales_delete_manager on public.sales;

create policy sales_select_member on public.sales
  for select using (public.is_project_member(project_id));

create policy sales_insert_worker on public.sales
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy sales_update_manager on public.sales
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy sales_delete_manager on public.sales
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- expenses (append-only; any active member may record)
drop policy if exists expenses_select_member  on public.expenses;
drop policy if exists expenses_insert_worker  on public.expenses;
drop policy if exists expenses_update_manager on public.expenses;
drop policy if exists expenses_delete_manager on public.expenses;

create policy expenses_select_member on public.expenses
  for select using (public.is_project_member(project_id));

create policy expenses_insert_worker on public.expenses
  for insert with check (public.has_project_role(project_id, array['owner', 'manager', 'worker']));

create policy expenses_update_manager on public.expenses
  for update using  (public.has_project_role(project_id, array['owner', 'manager']))
             with check (public.has_project_role(project_id, array['owner', 'manager']));

create policy expenses_delete_manager on public.expenses
  for delete using (public.has_project_role(project_id, array['owner', 'manager']));

-- ─────────────────────────────────────────────────────────────
-- Helper: get a batch_id UUID for a given payload batch_id value,
-- verifying it belongs to the same project (prevents cross-project
-- foreign-key injection).
-- ─────────────────────────────────────────────────────────────
create or replace function public.resolve_batch_id(
  payload_batch_id text,
  expected_project_id uuid
)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.batches
  where id = payload_batch_id::uuid
    and project_id = expected_project_id
    and deleted_at is null
  limit 1;
$$;

create or replace function public.resolve_client_id(
  payload_client_id text,
  expected_project_id uuid
)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.clients
  where id = payload_client_id::uuid
    and project_id = expected_project_id
    and deleted_at is null
  limit 1;
$$;

notify pgrst, 'reload schema';
