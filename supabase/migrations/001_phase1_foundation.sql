create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  whatsapp_number text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  server_version bigint not null default 0
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'worker', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  whatsapp_number text not null,
  role text not null default 'worker' check (role in ('manager', 'worker', 'viewer')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, full_name, whatsapp_number)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'whatsapp_number'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    whatsapp_number = excluded.whatsapp_number,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.add_project_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active');
  return new;
end;
$$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.add_project_owner();

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_project_role(target_project_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_project_invitation(
  invitation_project_id uuid,
  invitation_whatsapp_number text,
  invitation_role text default 'worker'
)
returns table (id uuid, token text, expires_at timestamptz)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
  invitation_id uuid;
  invitation_expiry timestamptz := now() + interval '7 days';
begin
  if not public.has_project_role(invitation_project_id, array['owner', 'manager']) then
    raise exception 'not authorized to invite project members';
  end if;

  if invitation_role not in ('manager', 'worker', 'viewer') then
    raise exception 'invalid invitation role';
  end if;

  insert into public.project_invitations (
    token_hash, project_id, invited_by, whatsapp_number, role, expires_at
  ) values (
    encode(digest(raw_token, 'sha256'), 'hex'),
    invitation_project_id,
    auth.uid(),
    invitation_whatsapp_number,
    invitation_role,
    invitation_expiry
  ) returning project_invitations.id into invitation_id;

  return query select invitation_id, raw_token, invitation_expiry;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invitations enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or exists (
    select 1 from public.project_members own_members
    join public.project_members target_members on target_members.project_id = own_members.project_id
    where own_members.user_id = auth.uid()
      and own_members.status = 'active'
      and target_members.user_id = profiles.id
      and target_members.status = 'active'
  ));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists projects_select_member on public.projects;
create policy projects_select_member on public.projects
  for select using (public.is_project_member(id));

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner on public.projects
  for insert with check (owner_id = auth.uid());

drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner on public.projects
  for update using (public.has_project_role(id, array['owner']))
  with check (public.has_project_role(id, array['owner']));

drop policy if exists project_members_select_member on public.project_members;
create policy project_members_select_member on public.project_members
  for select using (public.is_project_member(project_id));

drop policy if exists project_members_manage on public.project_members;
create policy project_members_manage on public.project_members
  for all using (public.has_project_role(project_id, array['owner']))
  with check (public.has_project_role(project_id, array['owner']));

drop policy if exists project_invitations_select_manager on public.project_invitations;
create policy project_invitations_select_manager on public.project_invitations
  for select using (public.has_project_role(project_id, array['owner', 'manager']));

revoke all on function public.create_project_invitation(uuid, text, text) from public;
grant execute on function public.create_project_invitation(uuid, text, text) to authenticated;