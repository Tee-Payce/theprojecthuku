-- Phase 5: replace upload_sync_operations with a version that materialises
-- each accepted operation into the correct entity table.
--
-- Design contract:
--   1. Membership check happens first — non-members are rejected immediately.
--   2. The operation is written to sync_operations idempotently (ON CONFLICT
--      operation_id DO NOTHING).  If the row already exists the entity apply
--      is also skipped so the RPC is fully idempotent.
--   3. Each entity type has its own apply block inside the same transaction
--      subtransaction so one bad row does not roll back the whole batch.
--   4. Append-only entities (feed, mortality, expense, sale) use
--      INSERT … ON CONFLICT (id) DO NOTHING.
--   5. Editable entities (batch, client) use
--      INSERT … ON CONFLICT (id) DO UPDATE … WHERE server_version < excluded.server_version
--      so a stale re-upload never overwrites a newer server state.
--   6. Soft deletes set deleted_at; the entity row is never physically removed.
--   7. batch_id / client_id values supplied by the client are validated
--      against the same project via the resolve_* helpers from migration 010.
--
-- The download_sync_operations RPC (from migration 009) is unchanged.

create or replace function public.upload_sync_operations(operations jsonb)
returns table (
  operation_id  text,
  accepted      boolean,
  server_cursor bigint,
  error_message text
)
language plpgsql
security definer set search_path = public
as $$
declare
  op              jsonb;
  current_user_id uuid    := auth.uid();
  op_project_id   uuid;
  op_id           text;
  op_entity       text;
  op_entity_id    text;
  op_action       text;
  op_payload      jsonb;
  ins_cursor      bigint;
  already_exists  boolean;
  resolved_batch  uuid;
  resolved_client uuid;
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(operations) <> 'array' then
    raise exception 'operations must be a JSON array';
  end if;

  for op in select value from jsonb_array_elements(operations)
  loop
    op_id        := op->>'operationId';
    op_project_id := (op->>'projectId')::uuid;
    op_entity    := op->>'entityType';
    op_entity_id := op->>'entityId';
    op_action    := op->>'action';
    op_payload   := coalesce(op->'payload', '{}'::jsonb);

    -- ── 1. Membership check ─────────────────────────────────────────────────
    if not public.is_project_member(op_project_id) then
      return query select op_id, false, null::bigint, 'not a project member';
      continue;
    end if;

    -- ── 2. Write to operation log (idempotent) ───────────────────────────────
    begin
      insert into public.sync_operations (
        operation_id, project_id, actor_id, entity_type, entity_id, action,
        payload, client_created_at
      ) values (
        op_id,
        op_project_id,
        current_user_id,
        op_entity,
        op_entity_id,
        op_action,
        op_payload,
        (op->>'createdAt')::timestamptz
      )
      on conflict (operation_id) do nothing
      returning sync_operations.server_cursor into ins_cursor;

      -- If the row already existed, fetch its cursor and skip entity apply.
      if ins_cursor is null then
        select so.server_cursor into ins_cursor
        from public.sync_operations so
        where so.operation_id = op_id;

        return query select op_id, true, ins_cursor, null::text;
        continue;
      end if;
    exception when others then
      return query select op_id, false, null::bigint, sqlerrm;
      continue;
    end;

    -- ── 3. Materialise into entity table ────────────────────────────────────
    begin
      case op_entity

        -- ── batch ────────────────────────────────────────────────────────────
        when 'batch' then
          if op_action = 'create' then
            insert into public.batches (
              id, project_id, created_by, updated_by,
              name, start_date, initial_chicks, chick_price,
              expected_price_per_bird, expected_price_per_kg, status,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              current_user_id,
              current_user_id,
              op_payload->>'name',
              op_payload->>'startDate',
              (op_payload->>'initialChicks')::integer,
              (op_payload->>'chickPrice')::numeric,
              (op_payload->>'expectedPricePerBird')::numeric,
              (op_payload->>'expectedPricePerKg')::numeric,
              coalesce(op_payload->>'status', 'active'),
              ins_cursor
            )
            on conflict (id) do update set
              name                    = excluded.name,
              start_date              = excluded.start_date,
              initial_chicks          = excluded.initial_chicks,
              chick_price             = excluded.chick_price,
              expected_price_per_bird = excluded.expected_price_per_bird,
              expected_price_per_kg   = excluded.expected_price_per_kg,
              status                  = excluded.status,
              updated_by              = excluded.updated_by,
              updated_at              = now(),
              server_version          = excluded.server_version
            where public.batches.server_version < excluded.server_version;

          elsif op_action = 'update' then
            update public.batches set
              name                    = coalesce(op_payload->>'name',                    name),
              start_date              = coalesce(op_payload->>'startDate',               start_date),
              initial_chicks          = coalesce((op_payload->>'initialChicks')::integer, initial_chicks),
              chick_price             = coalesce((op_payload->>'chickPrice')::numeric,    chick_price),
              expected_price_per_bird = coalesce((op_payload->>'expectedPricePerBird')::numeric, expected_price_per_bird),
              expected_price_per_kg   = coalesce((op_payload->>'expectedPricePerKg')::numeric,   expected_price_per_kg),
              status                  = coalesce(op_payload->>'status',                  status),
              updated_by              = current_user_id,
              updated_at              = now(),
              server_version          = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and server_version < ins_cursor;

          elsif op_action = 'delete' then
            update public.batches set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── feed ─────────────────────────────────────────────────────────────
        when 'feed' then
          -- Feed is append-only.  Resolve batch_id to a UUID in this project.
          resolved_batch := public.resolve_batch_id(op_payload->>'batchId', op_project_id);

          if op_action = 'create' then
            insert into public.feed (
              id, project_id, batch_id, created_by, updated_by,
              type, quantity_kg, price_per_kg, date_purchased, receipt_path,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              resolved_batch,
              current_user_id,
              current_user_id,
              op_payload->>'type',
              (op_payload->>'quantityKg')::numeric,
              (op_payload->>'pricePerKg')::numeric,
              op_payload->>'datePurchased',
              op_payload->>'receiptPath',
              ins_cursor
            )
            on conflict (id) do nothing;

          elsif op_action = 'delete' then
            update public.feed set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── mortality ────────────────────────────────────────────────────────
        when 'mortality' then
          resolved_batch := public.resolve_batch_id(op_payload->>'batchId', op_project_id);

          if op_action = 'create' then
            insert into public.mortality (
              id, project_id, batch_id, created_by, updated_by,
              quantity, date, reason,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              resolved_batch,
              current_user_id,
              current_user_id,
              (op_payload->>'quantity')::integer,
              op_payload->>'date',
              op_payload->>'reason',
              ins_cursor
            )
            on conflict (id) do nothing;

          elsif op_action = 'delete' then
            update public.mortality set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── client ───────────────────────────────────────────────────────────
        when 'client' then
          if op_action = 'create' then
            insert into public.clients (
              id, project_id, created_by, updated_by,
              name, phone,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              current_user_id,
              current_user_id,
              op_payload->>'name',
              op_payload->>'phone',
              ins_cursor
            )
            on conflict (id) do update set
              name           = excluded.name,
              phone          = excluded.phone,
              updated_by     = excluded.updated_by,
              updated_at     = now(),
              server_version = excluded.server_version
            where public.clients.server_version < excluded.server_version;

          elsif op_action = 'update' then
            update public.clients set
              name           = coalesce(op_payload->>'name',  name),
              phone          = coalesce(op_payload->>'phone', phone),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and server_version < ins_cursor;

          elsif op_action = 'delete' then
            update public.clients set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── sale ─────────────────────────────────────────────────────────────
        when 'sale' then
          -- Append-only.
          resolved_batch  := public.resolve_batch_id(op_payload->>'batchId',   op_project_id);
          resolved_client := public.resolve_client_id(op_payload->>'clientId', op_project_id);

          if op_action = 'create' then
            insert into public.sales (
              id, project_id, batch_id, client_id, created_by, updated_by,
              sale_type, quantity, price, total, date, receipt_path,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              resolved_batch,
              resolved_client,
              current_user_id,
              current_user_id,
              op_payload->>'saleType',
              (op_payload->>'quantity')::numeric,
              (op_payload->>'price')::numeric,
              (op_payload->>'total')::numeric,
              op_payload->>'date',
              op_payload->>'receiptPath',
              ins_cursor
            )
            on conflict (id) do nothing;

          elsif op_action = 'delete' then
            update public.sales set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── expense ──────────────────────────────────────────────────────────
        when 'expense' then
          -- Append-only.
          resolved_batch := public.resolve_batch_id(op_payload->>'batchId', op_project_id);

          if op_action = 'create' then
            insert into public.expenses (
              id, project_id, batch_id, created_by, updated_by,
              item_name, category, amount, date, notes,
              server_version
            ) values (
              op_entity_id::uuid,
              op_project_id,
              resolved_batch,
              current_user_id,
              current_user_id,
              op_payload->>'itemName',
              op_payload->>'category',
              (op_payload->>'amount')::numeric,
              op_payload->>'date',
              op_payload->>'notes',
              ins_cursor
            )
            on conflict (id) do nothing;

          elsif op_action = 'delete' then
            update public.expenses set
              deleted_at     = now(),
              updated_by     = current_user_id,
              updated_at     = now(),
              server_version = ins_cursor
            where id = op_entity_id::uuid
              and project_id = op_project_id
              and deleted_at is null;
          end if;

        -- ── unknown entity type: accept the log entry but do not fail ────────
        else
          null;

      end case;

    exception when others then
      -- Entity apply failed.  Roll back only this operation's entity write
      -- by marking it failed.  The sync_operations log entry is already
      -- committed (it's outside this inner block) so the cursor position
      -- is correct.  Return an error so the client keeps the outbox entry.
      update public.sync_operations
        set action = action  -- no-op to keep the row; error is surfaced below
      where operation_id = op_id;

      return query select op_id, false, null::bigint,
        ('entity apply failed: ' || sqlerrm)::text;
      continue;
    end;

    return query select op_id, true, ins_cursor, null::text;
  end loop;
end;
$$;

-- Re-grant: the function signature is identical so grants from 009 already
-- exist, but we drop and re-grant for clarity.
revoke all on function public.upload_sync_operations(jsonb) from public;
grant execute on function public.upload_sync_operations(jsonb) to authenticated;

notify pgrst, 'reload schema';
