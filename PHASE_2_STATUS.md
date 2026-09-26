# Phase 2 Status: Project-Scoped Local Data

Status: **Local implementation complete; cloud synchronization pending**

## Completed

- [x] Added a local project registry.
- [x] Added a project-scoped ID bridge for SQLite repositories.
- [x] Added project identifiers to batches, feed, mortality, clients, sales, and expenses.
- [x] Added local schema migration for existing installations.
- [x] Assigned existing records to `My Poultry Project` during migration.
- [x] Added project indexes for local operational tables.
- [x] Registered selected cloud projects in the local project registry.
- [x] Moved legacy local records to the first selected cloud project.
- [x] Scoped batch, feed, mortality, client, sales, expense, and calculation queries to the active project.
- [x] Required an active project before batch and operational repository access.
- [x] Preserved the project switcher flow from the dashboard.

## Behavior

When the app starts, existing local records are assigned to a temporary local project named `My Poultry Project`. When the user selects their first cloud project, those records are moved to that project's local ID in one transaction. Later project switches do not expose records from another project.

## Not included yet

- Uploading local records to Supabase.
- Downloading project records from Supabase.
- Sync outbox and retry handling.
- Persisting active project selection across a session.
- Invitation acceptance and member management UI.
- Project-scoped Supabase tables for batches and operational records.

Those items belong to the later synchronization and membership phases.

## Validation

- TypeScript passed with `npx.cmd tsc --noEmit`.
- Lint has zero errors; existing unused-caught-error warnings remain.
- Editor diagnostics are clear for Phase 2 files.

## Next phase

Add the synchronization outbox and project-scoped Supabase operational tables before enabling multi-device data exchange.