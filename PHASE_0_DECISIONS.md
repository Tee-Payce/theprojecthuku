# Phase 0: Product and Technical Decisions

Status: **Complete**

This document records the decisions required before implementing authentication, projects, memberships, and online synchronization.

## Decision Summary

| Area | Recommended decision | Status |
|---|---|---|
| Online backend | Supabase Auth, Postgres, Realtime, and Row Level Security | Recommended |
| Project roles | Owner, Manager, Worker, Viewer | Recommended |
| Invitation authority | Owner and managers may invite workers | Decided |
| Authentication | Email/password for the first release; phone OTP deferred | Decided |
| Client ownership | Clients are shared at project level | Recommended |
| Existing local data | Create `My Poultry Project` and migrate all existing records into it | Decided |
| Project lifecycle | Support archive and restore; do not hard-delete synchronized projects | Recommended |
| Offline operation | Continue working offline and sync when online | Confirmed |
| Outbox limit | Warn at 5,000 pending operations; block new writes at 10,000 until resolved | Recommended |
| Currency | USD for all project financial values | Decided |
| Worker financial visibility | Workers can view full project finances | Decided |
| Conflict policy | Append operational records; version-check editable records | Recommended |

## 1. Backend

**Decision:** Use Supabase.

Supabase provides the required combination of authentication, relational project data, realtime delivery, and Row Level Security without requiring us to operate a custom server initially.

The mobile app will contain only the Supabase URL and public anonymous key. Service-role credentials must remain outside the app.

**Phase 0 status:** Decided unless rejected.

## 2. Roles and Permissions

Use these roles:

- **Owner:** Full project access, membership management, project settings, archive/restore.
- **Manager:** Operational management and batch records; no member removal unless granted by the owner.
- **Worker:** Create operational records and view project data.
- **Viewer:** Read-only project access.

Initial invitation rule: the owner and managers can invite workers. Managers cannot remove members or change roles unless explicitly granted by the owner.

**Phase 0 status:** Decided unless rejected.

## 3. WhatsApp Invitations and Verification

A WhatsApp number will be stored as the intended recipient identifier. The invitation is delivered through a WhatsApp share link containing a single-use, expiring token.

Initial implementation:

- No custom WhatsApp messaging backend.
- No assumption that receiving a WhatsApp message proves number ownership.
- Worker must open the invitation link and authenticate or create a profile.
- Backend validates the token, expiry, project, role, and one-time acceptance.

Email/password authentication is the approved first-release method. Phone/SMS OTP and WhatsApp OTP are deferred because they require paid messaging providers and additional verification flows.

**Decision:** Use email/password authentication for account access. Use invitation links for project invitations. Phone/SMS OTP is deferred.

## 4. Client Ownership

Clients are project-shared records. All members with the appropriate project permissions can see the same client list and sales history.

Reason: sales are project financial records, and separate worker-private client records would make revenue and customer reporting inconsistent.

**Phase 0 status:** Decided unless rejected.

## 5. Existing Local Data Migration

When the upgraded app starts for the first time:

1. Require the current user to create or sign in to a profile.
2. Automatically create a first project named `My Poultry Project`.
3. Assign all existing local batches, feed, mortality, expenses, clients, and sales to that project.
4. Mark the migration complete with a local schema/migration version.
5. Upload the migrated project after the user is online.

Do not silently discard current local data. The migration must be transactional and recoverable.

**Decision:** Use `My Poultry Project` for the first migration project.

## 6. Project Lifecycle

Projects can be archived and restored by the owner. Synchronized project data is never hard-deleted during normal operation.

Archived projects:

- Are hidden from the default active-project list.
- Remain available to the owner and permitted viewers.
- Reject new operational writes.
- Retain their records and audit history.

Permanent deletion, if ever required, should be a separate owner-confirmed administrative workflow with an export warning.

**Phase 0 status:** Decided unless rejected.

## 7. Offline Behavior and Outbox Limits

The app remains usable offline. Valid writes are saved to SQLite and placed into the sync outbox.

Recommended limits:

- At 5,000 pending operations: show a persistent sync warning.
- At 10,000 pending operations: block new synchronized writes and ask the user to reconnect or resolve sync failures.
- Failed operations remain visible with retry and error details.
- The app never silently drops pending operations.

These limits protect device storage and keep sync recovery manageable. They can be adjusted after field testing.

**Phase 0 status:** Decided unless rejected.

## 8. Conflict Policy

### Append-only records

Sales, feed, mortality, and expenses are treated as append-only operational records. Concurrent entries from multiple workers are retained as separate records.

Corrections use an explicit edit, reversal, or correction record with audit information.

### Editable records

Project names, profile data, batch details, and membership settings use optimistic version checks. A stale update is rejected and shown as a conflict instead of silently overwriting another member's change.

**Phase 0 status:** Decided unless rejected.

## 9. Approved Decisions Before Phase 1

The product decisions are approved as follows:

1. Use email/password authentication for the first release; defer phone/SMS OTP.
2. Migrate existing local data into `My Poultry Project`.
3. Allow owners and managers to invite workers.
4. Use USD for project financial values.
5. Allow workers to view full project financial totals.

## 10. Phase 0 Exit Criteria

Phase 0 is complete when:

- [x] Supabase is selected as the backend direction.
- [x] Project roles are defined.
- [x] Client ownership is defined as project-shared.
- [x] Existing-data migration behavior is defined.
- [x] Archive behavior is defined.
- [x] Offline and outbox behavior is defined.
- [x] Conflict policy is defined.
- [x] Email authentication decision is approved.
- [x] Migration naming decision is approved.
- [x] Manager invitation policy is approved.
- [x] Currency is approved.
- [x] Financial visibility policy is approved.

## 11. Phase 0 Approval

Phase 0 is complete as of 2026-09-24. Phase 1 may begin with these decisions treated as the initial product contract.
