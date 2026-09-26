# The Project Huku: Online Project Sync Implementation Plan

## 1. Goal

Evolve The Project Huku from a single-device poultry tracker into a multi-user, project-based application where:

- Users create profiles and sign in securely.
- A user creates a project before creating batches.
- Projects have owners, managers, workers, and viewers.
- Workers are invited using WhatsApp numbers and invitation links.
- Project members share batches, sales, feed, mortality, expenses, and clients according to their permissions.
- The app remains usable offline through SQLite.
- Changes synchronize through an online backend when connectivity is available.
- Every member can see whether their device is fully synchronized.

## 2. Recommended Architecture

Use a cloud-authoritative, offline-first architecture:

```text
React Native / Expo UI
        |
        v
Local SQLite database
        |
        +-- sync_outbox: local changes waiting to upload
        +-- sync_state: server cursor and sync status
        |
        v
Sync service
        |
        v
Supabase Auth + Postgres + Realtime
        |
        v
Other project members' devices
```

### Technology choices

- Authentication: Supabase Auth
- Online database: Supabase Postgres
- Realtime updates: Supabase Realtime
- Authorization: Postgres Row Level Security
- Local cache/offline storage: existing Expo SQLite database
- Invitation delivery: WhatsApp share link
- Background retry: app lifecycle and connectivity-triggered sync

The backend is required for members on different devices or networks to receive updates automatically. WhatsApp is only used to deliver an invitation link; it is not the synchronization transport.

## 3. Product Rules

### User and project hierarchy

```text
User
  +-- Profile
  +-- Project memberships
        +-- Project
              +-- Collaborators/workers
              +-- Batches
                    +-- Feed records
                    +-- Mortality records
                    +-- Expenses
                    +-- Sales
                     [x] Add `sync_outbox` and `sync_state` tables.
                     [ ] Generate stable device IDs. Deferred until multi-device cursor ownership is materialized.
                     [ ] Generate globally unique entity IDs for new records. Current local records retain SQLite IDs in the Phase 4 operation payload.
                     [x] Wrap local record writes and outbox writes in SQLite transactions.
                     [x] Implement operation serialization.
                     [x] Implement upload batching.
                     [x] Add cursor-based download RPC contract.
                     [x] Implement idempotent operation handling.
                     [ ] Implement retry with bounded exponential backoff. Current retries preserve failed operations; backoff is deferred.
                     [x] Implement app-start and write-refresh synchronization.
                     [x] Add manual “Sync now” action.
                     [x] Store rejected operations and human-readable errors.
                     [x] Add sync status to the app context.
4. The worker opens the link and signs in or creates a profile.
5. The worker accepts the invitation.
6. The backend creates the project membership.
7. The worker's device downloads the project snapshot and begins realtime synchronization.

A phone number identifies the intended recipient. It should not be treated as verified ownership unless phone OTP verification is enabled through the authentication provider.

## 4. Data Model

### Existing local entities to retain

- batches
- feed
- mortality
- clients
- sales
- expenses

### New identity and project entities

#### profiles

```text
id                 UUID primary key, linked to auth user
full_name          TEXT
whatsapp_number    TEXT nullable
avatar_url         TEXT nullable
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### projects

```text
id                 UUID primary key
name               TEXT not null
owner_id           UUID not null
created_at         TIMESTAMP
updated_at         TIMESTAMP
archived_at        TIMESTAMP nullable
server_version     BIGINT not null
```

#### project_members

```text
id                 UUID primary key
project_id         UUID not null
user_id            UUID not null
role               TEXT not null
status             TEXT not null
joined_at          TIMESTAMP
updated_at         TIMESTAMP
UNIQUE(project_id, user_id)
```

Allowed membership statuses:

```text
invited
active
suspended
removed
```

#### project_invitations

```text
id                 UUID primary key
token_hash         TEXT not null
project_id         UUID not null
invited_by         UUID not null
whatsapp_number    TEXT not null
role               TEXT not null
expires_at         TIMESTAMP not null
accepted_at        TIMESTAMP nullable
cancelled_at       TIMESTAMP nullable
created_at         TIMESTAMP
```

Never store the raw invitation token in the database. Store a hash and only show the raw token in the invitation URL.

### Add project ownership to current entities

Every shared entity must receive:

```text
project_id         UUID not null
created_by         UUID not null
updated_by         UUID not null
created_at         TIMESTAMP
updated_at         TIMESTAMP
deleted_at         TIMESTAMP nullable
server_version     BIGINT not null
```

At minimum, add `project_id` to:

- batches
- feed
- mortality
- clients
- sales
- expenses

Batch-owned records must also retain their `batch_id`. Sales must retain their `client_id` where applicable.

### Local synchronization tables

#### sync_outbox

```text
operation_id       TEXT primary key
project_id         UUID not null
entity_type        TEXT not null
entity_id          TEXT not null
action             TEXT not null
payload_json       TEXT not null
created_at         TIMESTAMP not null
attempts           INTEGER not null default 0
last_attempt_at    TIMESTAMP nullable
last_error         TEXT nullable
status             TEXT not null
```

Allowed statuses:

```text
pending
processing
failed
completed
```

#### sync_state

```text
project_id         UUID primary key
last_server_cursor BIGINT not null default 0
last_successful_sync TIMESTAMP nullable
last_error         TEXT nullable
status             TEXT not null
```

#### sync_applied_operations

```text
operation_id       TEXT primary key
project_id         UUID not null
applied_at         TIMESTAMP not null
```

This prevents duplicate operations from being applied more than once.

#### member_sync_status

This can be stored online and optionally cached locally:

```text
project_id         UUID not null
user_id            UUID not null
device_id           TEXT not null
last_uploaded_at   TIMESTAMP nullable
last_downloaded_at TIMESTAMP nullable
last_server_cursor BIGINT not null default 0
status             TEXT not null
last_error         TEXT nullable
updated_at         TIMESTAMP
```

## 5. Synchronization Contract

### Local write flow

Every create, update, or delete must follow this sequence:

1. Validate the request.
2. Write the record to local SQLite.
3. Create an outbox operation in the same local transaction.
4. Update the UI immediately.
5. Attempt upload if the device is online.
6. Retry failed operations later.

The UI must never depend on a successful network request before displaying a valid local change.

### Operation format

```json
{
  "operationId": "device-uuid:sequence-number",
  "projectId": "project-uuid",
  "entityType": "mortality",
  "entityId": "mortality-uuid",
  "action": "create",
  "payload": {
    "batchId": "batch-uuid",
    "quantity": 3,
    "date": "2026-09-24",
    "reason": "Disease"
  },
  "createdAt": "2026-09-24T10:00:00.000Z",
  "deviceId": "device-uuid",
  "clientVersion": 1
}
```

### Upload flow

1. Select pending operations for the active project.
2. Upload in small batches.
3. Send the device's last known server cursor.
4. Backend validates membership, role, schema, and project ownership.
5. Backend applies the operation idempotently.
6. Backend assigns a server version.
7. Backend returns accepted, rejected, or conflict results.
8. Mark accepted operations completed.
9. Keep rejected operations with an actionable error.
10. Download server changes after upload.

### Download flow

1. Request changes after `last_server_cursor`.
2. Apply each change in a local SQLite transaction.
3. Skip changes already present in `sync_applied_operations`.
4. Update local records and applied-operation tracking.
5. Advance `last_server_cursor` only after the transaction succeeds.
6. Update member sync status.

Never advance the cursor before local application succeeds.

### Realtime flow

Realtime messages are an acceleration mechanism, not the source of truth.

When a realtime event arrives:

1. Check the project membership.
2. Check whether the event's server version is already applied.
3. Apply it locally if it is the next known change.
4. If there is a version gap, run cursor-based synchronization.
5. Update the UI from SQLite.

If realtime disconnects, the cursor-based sync must still recover all changes.

## 6. Conflict Rules

### Append-only operational records

Sales, feed, mortality, and expenses should use immutable create operations. Two workers creating records should result in two records, not an overwrite.

Corrections should be represented by an update or reversal record with an audit trail.

### Editable records

Project names, profiles, batch details, and membership settings require optimistic concurrency:

- Client sends the record's last known `server_version`.
- Backend accepts only if the version is still current.
- Backend rejects stale updates with a conflict response.
- The app shows the server version and local version to an authorized user.
- User chooses which values to keep or creates a merged update.

### Deletes

Use soft deletes with `deleted_at`. Do not physically delete synchronized records during normal operation. Tombstones prevent deleted records from reappearing on another device.

## 7. Security Requirements

- Use Supabase Auth; never build password storage in the app.
- Enable Row Level Security on every project-related table.
- Check project membership for every read and write.
- Check role permissions for every mutation.
- Validate invitation expiry, cancellation, and single-use status server-side.
- Never trust `project_id`, `user_id`, role, or ownership values supplied by the client.
- Use HTTPS for all online communication.
- Do not place service-role keys in the mobile app.
- Store only the minimum required WhatsApp information.
- Provide member removal and project archival behavior.
- Record who created and changed operational records.

## 8. Phased Implementation

## Phase 0: Product and Technical Decisions

### Tasks

- [ ] Confirm Supabase as the backend.
- [ ] Confirm roles and role permissions.
- [ ] Decide whether phone OTP verification is required.
- [ ] Decide whether workers may invite other workers.
- [ ] Decide whether clients are project-shared or worker-private.
- [ ] Decide how existing single-device data is assigned to the first project.
- [ ] Decide whether projects can be archived and restored.
- [ ] Define supported offline duration and maximum local outbox size.

### Deliverables

- Approved role/permission matrix.
- Approved invitation flow.
- Approved data ownership rules.
- Backend environment created for development.

### Exit criteria

- Product decisions are documented.
- No table is shared across projects without a documented ownership rule.

## Phase 1: Backend Foundation and Authentication

### Tasks

- [ ] Create Supabase development project.
- [ ] Configure Auth provider and redirect URLs.
- [ ] Add profile creation and profile update flow.
- [ ] Add `profiles` table.
- [ ] Add `projects` table.
- [ ] Add `project_members` table.
- [ ] Add owner membership automatically when creating a project.
- [ ] Add Row Level Security policies.
- [ ] Add database migrations to version control.
- [ ] Add environment variable configuration for Supabase URL and anonymous key.
- [ ] Add secure sign-in, sign-out, and session restoration.

### Deliverables

- A user can create an account and profile.
- A signed-in user can create and list their projects.
- A user cannot read another user's project.

### Exit criteria

- Authentication works after app restart.
- RLS tests prove unauthorized project access is rejected.
- No secret service-role credential exists in the mobile bundle.

## Phase 2: Project-Centered Local Data Model

### Tasks

- [x] Add project context and active-project selection to the app.
- [ ] Add local `profiles`, `projects`, and `project_members` tables. Deferred because Supabase is the Phase 1 source for identity and memberships; local `local_projects` is used as the operational cache.
- [x] Add `project_id` to local batches, feed, mortality, clients, sales, and expenses.
- [ ] Add `created_by`, `updated_by`, timestamps, and soft-delete fields.
- [x] Add local migration for current single-user databases.
- [x] Assign existing local records to a migration project.
- [x] Require an active project before creating a batch.
- [x] Update all queries to filter by active `project_id`.
- [x] Update dashboard and navigation to show the selected project.
- [x] Add project switcher.

### Deliverables

- Users can create a project before creating a batch.
- Existing batch workflows operate inside the selected project.
- Records from one project never appear in another project.

### Exit criteria

- Every shared query includes project scoping.
- A batch cannot be created without a project.
- Existing local data remains accessible after migration.

## Phase 3: Invitations and Membership Management

### Tasks

- [x] Add `project_invitations` backend and local representations.
- [x] Generate single-use, expiring invitation tokens.
- [x] Add WhatsApp share action for invitation links.
- [x] Add invitation landing/deep-link route.
- [x] Allow invited workers to create or complete their profile.
- [x] Add invitation acceptance flow.
- [x] Add member list for owners/managers.
- [x] Show pending invitations on the recipient's projects page by normalized WhatsApp number.
- [x] Allow recipients to accept invitations directly from the projects page.
- [ ] Add role assignment and role changes. Deferred to membership administration hardening.
- [ ] Add member removal and suspension.
- [ ] Add duplicate invitation handling.
- [ ] Add expired and cancelled invitation handling.

### Deliverables

- A worker can receive an invitation through WhatsApp.
- The worker can create a profile and join the project.
- The worker sees the shared project after acceptance.

### Exit criteria

- An invitation cannot be accepted twice.
- A user cannot join a project without a valid invitation or owner action.
- Removed members lose access immediately on the backend.

## Phase 4: Local Outbox and Sync Engine

### Tasks

- [ ] Add `sync_outbox`, `sync_state`, and `sync_applied_operations` tables.
- [ ] Generate stable device IDs.
- [ ] Generate globally unique entity IDs for new records.
- [ ] Wrap local record writes and outbox writes in SQLite transactions.
- [ ] Implement operation serialization.
- [ ] Implement upload batching.
- [ ] Implement cursor-based download.
- [ ] Implement idempotent operation handling.
- [ ] Implement retry with bounded exponential backoff.
- [ ] Implement connectivity detection.
- [ ] Implement app-start and app-resume synchronization.
- [ ] Add manual “Sync now” action.
- [ ] Store rejected operations and human-readable errors.
- [ ] Add sync status to the app context.

### Deliverables

- A local change appears immediately while offline.
- The change uploads after connectivity returns.
- A second device receives the change after synchronization.

### Exit criteria

- Duplicate upload does not duplicate records.
- A failed upload does not disappear from the outbox.
- A download failure does not advance the server cursor.
- Sync can recover after app termination during upload.

## Phase 5: Backend Data Synchronization

### Tasks

- [ ] Add server tables for all project-owned entities.
- [ ] Add server-side operation or change-log handling.
- [ ] Add server version assignment per project.
- [ ] Add server-side membership and role checks.
- [ ] Add append-only handling for sales, feed, mortality, and expenses.
- [ ] Add optimistic concurrency for editable entities.
- [ ] Add tombstone retention policy.
- [ ] Add cursor endpoint or RPC for project changes.
- [ ] Add operation idempotency constraints.
- [ ] Add validation for related records and project ownership.
- [ ] Add migration/backfill scripts for existing cloud records.

### Deliverables

- The backend is the shared source of truth.
- All members can eventually receive the same project state.
- Conflicts are explicit and recoverable.

### Exit criteria

- RLS prevents cross-project reads and writes.
- Server rejects stale editable updates.
- Server accepts duplicate operation submissions safely.
- Server returns deterministic sync results.

## Phase 6: Realtime Updates and Member Sync Visibility

### Tasks

- [ ] Enable Supabase Realtime for project changes.
- [ ] Subscribe only to projects the signed-in user can access.
- [ ] Apply realtime events through the same local sync path.
- [ ] Detect version gaps and trigger cursor sync.
- [ ] Add `member_sync_status` backend table or equivalent view.
- [ ] Update member status after upload/download.
- [ ] Display current user's sync state.
- [ ] Display last-seen and last-synced state for project members.
- [ ] Show offline, pending, syncing, synced, and failed states.

### Deliverables

- Active project updates appear without a manual refresh when online.
- Members can see whether their own device is synchronized.
- Owners/managers can see member sync health.

### Exit criteria

- Realtime disconnect recovery works.
- Version gaps trigger a complete cursor sync.
- A member is not shown as synced until upload and download are both complete.

## Phase 7: UI and Workflow Completion

### Tasks

- [ ] Add authentication screens.
- [ ] Add profile screen.
- [ ] Add project creation screen.
- [ ] Add project list and project switcher.
- [ ] Add project members screen.
- [ ] Add invite worker flow.
- [ ] Add invitation acceptance route.
- [ ] Add project-level dashboard.
- [ ] Require active project in all batch creation flows.
- [ ] Add role-aware button visibility.
- [ ] Add sync status indicator to the main header.
- [ ] Add pending-change count and sync error details.
- [ ] Add conflict resolution UI for editable records.
- [ ] Update empty states and navigation labels.

### Deliverables

- A new user can sign in, create a project, invite a worker, and create a batch.
- A worker can join and record project activity.
- All screens clearly show the active project and sync status.

### Exit criteria

- The primary workflow is usable without developer tools.
- A worker cannot access controls outside their role.
- Offline and online states are understandable to users.

## Phase 8: Testing, Migration, and Release

### Tasks

- [ ] Add unit tests for progress and financial calculations.
- [ ] Add sync operation serialization tests.
- [ ] Add duplicate-operation tests.
- [ ] Add offline write and reconnect tests.
- [ ] Add cursor gap recovery tests.
- [ ] Add conflict tests.
- [ ] Add invitation expiry and reuse tests.
- [ ] Add RLS/security tests.
- [ ] Test two-device project workflows.
- [ ] Test app termination during sync.
- [ ] Test large outbox retry behavior.
- [ ] Test migration of existing local data.
- [ ] Add backup/export guidance.
- [ ] Update deployment documentation and environment setup.
- [ ] Prepare staged rollout and rollback procedure.

### Release acceptance criteria

- No cross-project data is visible.
- No unauthorized member can mutate project data.
- Offline records are eventually uploaded.
- Online records are eventually delivered to every active member.
- Duplicate operations do not duplicate financial or mortality records.
- Sync status is accurate after reconnect and app restart.
- Existing data migration is verified on a copy before release.
- Production secrets and environment values are configured correctly.

## 9. Current Application Changes Required

The existing app currently assumes:

- One local database shared by one device.
- No authenticated user.
- No project identifier on batches or related records.
- Synchronous direct writes from screens into SQLite.
- No operation log or server cursor.
- No membership or role enforcement.

The most important refactor is to stop screens from writing directly to query functions without synchronization metadata. Introduce a repository/service boundary:

```text
Screen
  -> domain service
      -> local SQLite transaction
      -> sync outbox operation
      -> optional online upload
```

For example:

```text
createSale(input)
  -> validateSale(input)
  -> insertSaleLocally(input)
  -> enqueueOperation(create-sale)
  -> syncProjectIfOnline()
```

This boundary lets the UI remain stable while the transport changes from local-only to online synchronization.

## 10. Observability and Support

Track the following without storing sensitive content in logs:

- Sync attempt count
- Upload success/failure
- Download success/failure
- Last successful cursor
- Outbox size
- Conflict count
- Rejected operation count
- App version and database schema version
- Device platform

Provide a support export containing:

- Project ID
- Current user ID
- Local database schema version
- Sync cursor
- Outbox count
- Last sync time
- Recent sync error codes

Do not include passwords, auth tokens, invitation secrets, or unnecessary personal data.

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Data appears duplicated | Stable operation IDs and idempotency constraints |
| Worker loses internet during recording | Local SQLite write plus outbox queue |
| Realtime event is missed | Cursor-based catch-up synchronization |
| Two workers edit the same batch | Server version checks and conflict UI |
| Removed worker still has cached data | Revoke backend access and mark local project access suspended |
| Existing local schema differs | Versioned SQLite migrations and tested migration project |
| Financial records are overwritten | Append-only operation rules for sales, feed, mortality, and expenses |
| Unauthorized project access | RLS plus server-side membership validation |
| Sync queue grows indefinitely | Retry limits, visible errors, and support export |
| Backend outage blocks work | Continue local operation and retry later |

## 12. Definition Of Done

The implementation is complete when:

- A user can create and manage a profile.
- A user can create a project before creating batches.
- A project owner can invite a worker through WhatsApp.
- A worker can create a profile and accept the invitation.
- Members see only projects to which they belong.
- Members can record shared poultry operations according to their roles.
- The app works offline and records pending changes locally.
- Pending changes synchronize automatically when online.
- Realtime updates reach active members.
- Missed realtime events are recovered through cursor synchronization.
- Conflicts do not silently destroy data.
- Each member can see their own sync status.
- Owners/managers can see project member sync status.
- Existing single-device data is migrated or deliberately archived.
- Security, migration, sync, and two-device workflows pass testing.
