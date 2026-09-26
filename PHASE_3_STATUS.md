# Phase 3 Status: Invitations and Membership Management

Status: **Code complete; migration and two-account testing pending**

## Completed

- [x] Added secure invitation acceptance RPC.
- [x] Invitation tokens are hashed in the database and single-use.
- [x] Invitations expire after seven days.
- [x] Added invitation-link creation service.
- [x] Added phone-number invitation creation without opening an external sharing modal.
- [x] Added project member list screen.
- [x] Added role selection for worker, manager, and viewer invitations.
- [x] Added owner/manager member-management entry point from the project list.
- [x] Added invitation deep-link route.
- [x] Preserved invitation tokens through email sign-in.
- [x] Preserved invitation tokens through email confirmation callback.
- [x] Added local registration for accepted cloud projects.
- [x] Added recipient-side invitation inbox matched by normalized WhatsApp number.
- [x] Added accept-invitation action directly on the projects page.
- [x] Added recipient-side reject invitation action.
- [x] Limited the project list to one membership row for the logged-in user per project.
- [x] Updated the auth gate so callback and invite routes are not redirected prematurely.

## Required external setup

Apply this migration in Supabase SQL Editor after migrations 001 and 002:

```text
supabase/migrations/003_project_invitations_acceptance.sql
```

Also apply the recipient invitation inbox migration:

```text
supabase/migrations/005_phone_invitation_inbox.sql
```

If invitation creation currently fails with `gen_random_bytes(integer) does not exist`, apply this corrective migration after migration 003:

```text
supabase/migrations/004_fix_pgcrypto_search_path.sql
```

If accepting a phone-matched invitation reports `project_id is ambiguous`, apply:

```text
supabase/migrations/006_fix_ambiguous_invitation_acceptance.sql
```

If the project list shows duplicate cards for different member roles, apply:

```text
supabase/migrations/007_my_projects_current_user.sql
```

For recipient-side invitation rejection, apply:

```text
supabase/migrations/008_reject_project_invitation.sql
```

The corrected function parameter is `p_invitation_id`; the app RPC call uses that exact name. If Supabase still reports a schema-cache error after running migration 006, rerun the migration and execute `notify pgrst, 'reload schema';` in the SQL Editor.

The mobile app must be rebuilt/restarted after source changes. The Supabase redirect allow list must include the app's callback and invite URLs used by the current Expo environment.

## Manual acceptance test

1. Sign in as an owner.
2. Open **Manage members** on a project.
3. Enter a worker's WhatsApp number and select a role.
4. Select **Send invitation**.
5. Sign in as the recipient account using the matching profile WhatsApp number.
6. Confirm the invitation appears on the Projects page.
7. Accept it from the Projects page.
8. Confirm the worker appears in the member list.
9. Confirm the invitation cannot be accepted a second time.
10. Confirm an expired invitation is rejected.
11. Reject a pending invitation and confirm it disappears from the Projects page.
12. Confirm a rejected invitation cannot be accepted later.

## Limitations

- The invitation link is the first-release verification mechanism; the WhatsApp number is not independently verified.
- The current share flow uses the native share sheet; direct WhatsApp launching is not required.
- Membership data is online; full operational record synchronization is a later phase.
- Owners and managers can invite, but only owners can manage membership rows through the current RLS policy.