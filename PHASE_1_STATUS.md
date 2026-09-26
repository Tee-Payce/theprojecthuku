# Phase 1 Status: Backend Foundation and Authentication

Status: **Code complete; external Supabase setup pending**

Setup instructions: [PHASE_1_EXTERNAL_SETUP_GUIDE.md](PHASE_1_EXTERNAL_SETUP_GUIDE.md)

## Completed

- [x] Added Supabase JavaScript client dependency.
- [x] Added Expo SecureStore session persistence.
- [x] Added React Native URL polyfill.
- [x] Added `.env.example` with public Supabase configuration names.
- [x] Added `.env` ignore rules while keeping `.env.example` tracked.
- [x] Added Supabase client with persisted sessions.
- [x] Added sign-up, sign-in, sign-out, profile read, and profile update services.
- [x] Confirmed email/password authentication for the first release; SMS and WhatsApp OTP are deferred.
- [x] Added project creation, project listing, member listing, and invitation service methods.
- [x] Added `AuthProvider` and session restoration.
- [x] Added authentication gate for protected routes.
- [x] Added sign-in/sign-up screen.
- [x] Added authenticated project list and project creation screen.
- [x] Added Supabase SQL migration for profiles, projects, memberships, invitations, triggers, RPC, and RLS policies.
- [x] Added Phase 1 setup instructions to the README.

## Pending external setup

1. Create or select the Supabase project.
2. Apply `supabase/migrations/001_phase1_foundation.sql` in the Supabase SQL editor or through Supabase CLI.
3. Copy `.env.example` to `.env`.
4. Set `EXPO_PUBLIC_SUPABASE_URL`.
5. Set `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
6. Configure the Supabase Auth email redirect and confirmation settings.
7. Start the app and verify sign-up, sign-in, project creation, and sign-out on a device.

Do not put a Supabase service-role key in `.env` or the mobile app.

## Validation

- TypeScript: passed with `npx.cmd tsc --noEmit`.
- Lint: passed with zero errors; existing unused-caught-error warnings remain in older screens.
- Editor diagnostics: clear for all Phase 1 files.
- Dependencies: installed with `npm.cmd install` and lockfile synchronized.

## Phase 1 limitations

- The existing batch and operational tables are not yet project-scoped. That is Phase 2.
- The project selected in the project list does not yet persist as an active project context. That is Phase 2.
- Invitation acceptance/deep-link UI is not yet implemented. That is Phase 3.
- The invitation RPC returns the one-time token to the authenticated inviter; the app still needs to construct and share the WhatsApp link in Phase 3.
