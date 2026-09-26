create sequence if not exists public.project_sync_cursor;

create table if not exists public.sync_operations (
  operation_id text primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload jsonb not null,
  client_created_at timestamptz not null,
  server_cursor bigint not null default nextval('public.project_sync_cursor'),
  created_at timestamptz not null default now()
);

create index if not exists idx_sync_operations_project_cursor
  on public.sync_operations(project_id, server_cursor);

alter table public.sync_operations enable row level security;

drop policy if exists sync_operations_select_member on public.sync_operations;
create policy sync_operations_select_member on public.sync_operations
  for select using (public.is_project_member(project_id));

create or replace function public.upload_sync_operations(operations jsonb)
returns table (operation_id text, accepted boolean, server_cursor bigint, error_message text)
language plpgsql
security definer set search_path = public
as $$
declare
  operation jsonb;
  current_user_id uuid := auth.uid();
  operation_project_id uuid;
  inserted_cursor bigint;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(operations) <> 'array' then
    raise exception 'operations must be a JSON array';
  end if;

  for operation in select value from jsonb_array_elements(operations)
  loop
    operation_project_id := (operation->>'projectId')::uuid;

    if not public.is_project_member(operation_project_id) then
      return query select operation->>'operationId', false, null::bigint, 'not a project member';
      continue;
    end if;

    begin
      insert into public.sync_operations (
        operation_id, project_id, actor_id, entity_type, entity_id, action,
        payload, client_created_at
      ) values (
        operation->>'operationId',
        operation_project_id,
        current_user_id,
        operation->>'entityType',
        operation->>'entityId',
        operation->>'action',
        coalesce(operation->'payload', '{}'::jsonb),
        (operation->>'createdAt')::timestamptz
      )
      on conflict (operation_id) do nothing
      returning sync_operations.server_cursor into inserted_cursor;

      if inserted_cursor is null then
        select sync_operations.server_cursor into inserted_cursor
        from public.sync_operations
        where sync_operations.operation_id = operation->>'operationId';
      end if;

      return query select operation->>'operationId', true, inserted_cursor, null::text;
    exception when others then
      return query select operation->>'operationId', false, null::bigint, sqlerrm;
    end;
  end loop;
end;
$$;

create or replace function public.download_sync_operations(target_project_id uuid, after_cursor bigint default 0, batch_size integer default 100)
returns table (
  operation_id text,
  project_id uuid,
  actor_id uuid,
  entity_type text,
  entity_id text,
  action text,
  payload jsonb,
  client_created_at timestamptz,
  server_cursor bigint,
  created_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    operations.operation_id,
    operations.project_id,
    operations.actor_id,
    operations.entity_type,
    operations.entity_id,
    operations.action,
    operations.payload,
    operations.client_created_at,
    operations.server_cursor,
    operations.created_at
  from public.sync_operations operations
  where operations.project_id = target_project_id
    and operations.server_cursor > after_cursor
    and public.is_project_member(target_project_id)
  order by operations.server_cursor
  limit least(greatest(batch_size, 1), 500);
$$;

revoke all on function public.upload_sync_operations(jsonb) from public;
grant execute on function public.upload_sync_operations(jsonb) to authenticated;
revoke all on function public.download_sync_operations(uuid, bigint, integer) from public;
grant execute on function public.download_sync_operations(uuid, bigint, integer) to authenticated;

notify pgrst, 'reload schema';
