# Phase 4 Status: Local Outbox and Sync Transport

Status: **Code complete; migration and two-device transport testing pending**

## Completed

- [x] Added local `sync_outbox` table.
- [x] Added per-project `sync_state` table.
- [x] Added applied-operation tracking table.
- [x] Added stable operation IDs and retry metadata.
- [x] Wrapped operational create writes and outbox enqueue in one SQLite transaction.
- [x] Wired batch, feed, mortality, client, sales, and expense creation.
- [x] Added Supabase operation log and project cursor.
- [x] Added idempotent upload RPC.
- [x] Added cursor-based download RPC contract.
- [x] Added app-triggered sync on active-project selection and refresh writes.
- [x] Added dashboard sync status and manual sync action.

## Required external setup

Apply this migration after migrations 001 through 008:

```text
supabase/migrations/009_sync_operation_log.sql
```

## Current scope

Phase 4 transports local operations into the online project operation log. Applying downloaded operations to local operational tables and materializing shared cloud entity tables are the next synchronization-data phase.

## Manual test

1. Apply migration 009.
2. Sign in and select a project.
3. Create a batch while online.
4. Confirm the dashboard shows syncing and then synced.
5. Temporarily disable network access.
6. Create a feed, mortality, expense, client, or sale record.
7. Confirm the record remains usable locally and pending changes increases.
8. Restore network access and select **Sync now**.
9. Confirm pending changes returns to zero.
10. Submit the same operation twice and confirm the online operation log keeps one operation ID.

## Validation

- TypeScript and editor diagnostics must pass.
- Lint must have zero errors.
- Existing non-blocking lint warnings may remain.
