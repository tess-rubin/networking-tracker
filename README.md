# Bear Connect — Secure Networking Tracker

Bear Connect is a private relationship tracker for Berkeley students and community members. After signing in, each person can save the people they want to remember, including where they met, company, role, notes, and follow-up priority. A React interface talks to a separate Node.js API, while Neon Postgres Row Level Security ensures that every signed-in user can access only their own contacts.

> **Live application:** Add the production Vercel URL here after deployment.

## Product walkthrough

1. Create an account or sign in with email and password.
2. Add a contact and record the context behind the introduction.
3. Search by name, company, role, or meeting place; filter by priority; and sort the table.
4. Edit or delete a contact. The data remains available after refresh and future sign-ins.
5. Sign out to return to the authentication screen.

Add final desktop and mobile screenshots here after the production environment is connected.

## Features

- Managed signup, sign-in, persistent session, and sign-out through Neon Auth (Better Auth)
- Private contacts with create, view, edit, and delete workflows
- Server-side search, priority filtering, and sorting
- Desktop table and mobile card layouts
- Clear loading, empty, filtered-empty, success, validation, and failure states
- Browser and Node validation with a database constraint as the final data-integrity layer
- Per-operation PostgreSQL RLS policies for defense-in-depth ownership enforcement
- Automated validation/API tests and an optional live two-account RLS test

## Technology and architecture

| Layer | Technology | Why |
| --- | --- | --- |
| Frontend | React 19, Vite, JavaScript | Fast, focused SPA development with a small production bundle |
| UI | Tailwind CSS, Radix/shadcn-style primitives, Lucide, Sonner | Responsive styling and accessible dialogs, selects, confirmations, and feedback |
| Backend | Node.js Vercel Functions | Keeps validation and response handling separate from the React application |
| Validation | Zod | One explicit allowlist shared by browser and API code |
| Authentication | Neon Managed Auth, built on Better Auth | Managed user accounts and JWTs compatible with the Neon Data API |
| Database | Neon Postgres + Data API | Durable relational data, authenticated HTTPS access, and database-level RLS |
| Hosting | Vercel | Hosts the static Vite build and Node API functions from one repository |

```text
Browser
  ├─ Neon Auth endpoint: signup, sign-in, session, JWT, sign-out
  └─ /api/contacts + JWT
       └─ Node.js function: authentication presence + Zod validation
            └─ Neon Data API: validates JWT
                 └─ Postgres RLS: auth.user_id() must equal contacts.user_id
```

The browser never sends or chooses a `user_id`. The Node API forwards the current short-lived JWT through `@neondatabase/neon-js`; the Data API exposes the verified identity through `auth.user_id()`. RLS, not a client-supplied filter, is the final authorization boundary.

## Repository layout

```text
frontend/       React UI and auth session
api/            Node.js Vercel Functions
shared/         Allowlisted contact/query validation
database/       Versioned Postgres migration and migration runner
tests/          Unit, API, and live RLS tests
vercel.json     Vercel build, function, and SPA routing
```

## Local setup

Prerequisites: Node.js 20+, npm, and a Neon project with Managed Auth and the Data API enabled for the same branch.

1. Clone this repository and enter it.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and replace placeholders. Never commit `.env.local`.
4. In the Neon console, enable email/password authentication, add `http://localhost:5173` as a trusted origin, and configure the Data API to use Neon Auth.
5. Load environment variables into your shell and run `npm run db:migrate` once.
6. Run `npx vercel dev` to serve the Vite frontend and Node functions together. For frontend-only work, `npm run dev` runs Vite, but contact requests still require an API on port 3000.
7. Open the local URL shown in the terminal.

### Environment variables

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `VITE_NEON_AUTH_URL` | Browser-safe HTTPS endpoint | Neon Managed Auth endpoint |
| `VITE_NEON_DATA_API_URL` | Browser-safe HTTPS endpoint | Neon Data API `/rest/v1` endpoint; also used by Node functions |
| `NEON_AUTH_BASE_URL` | Server only | Reserved for server-side Neon Auth integrations |
| `NEON_AUTH_COOKIE_SECRET` | Server only | At least 32 random characters; reserved for signed server session cookies |
| `DATABASE_URL` | Server only | Direct Postgres connection used only to apply migrations |
| `ALLOWED_ORIGIN` | Server only | Optional comma-separated origins for cross-origin API development |
| `TEST_USER_A_EMAIL/PASSWORD` | Server/test only | Dedicated first RLS test account |
| `TEST_USER_B_EMAIL/PASSWORD` | Server/test only | Dedicated second RLS test account |

The Vite-prefixed values are public URLs, not secrets. `DATABASE_URL`, cookie secrets, and passwords must exist only in local/Vercel environment configuration.

## Database schema and authorization

The migration in `database/001_contacts.sql` creates:

| Column | Type | Rules |
| --- | --- | --- |
| `id` | `uuid` | Primary key; defaults to `gen_random_uuid()` |
| `user_id` | `text` | Not null; defaults to `auth.user_id()` |
| `name` | `text` | Not null; trimmed value cannot be empty |
| `company` | `text` | Not null; defaults to an empty string |
| `role` | `text` | Not null; defaults to an empty string |
| `where_met` | `text` | Not null; defaults to an empty string |
| `notes` | `text` | Not null; defaults to an empty string |
| `priority` | `text` | `high`, `medium`, or `low`; defaults to `medium` |
| `created_at` | `timestamptz` | Defaults to the current time |
| `updated_at` | `timestamptz` | Maintained by an update trigger |

RLS is enabled and forced. Four separate policies apply to the `authenticated` role:

- Select and delete use `USING (auth.user_id() = user_id)`.
- Insert uses `WITH CHECK (auth.user_id() = user_id)`.
- Update uses the ownership expression in both `USING` and `WITH CHECK`, so a user cannot edit another user's row or transfer ownership of their own row.

## Testing

Run the deterministic suite:

```bash
npm test
```

It verifies blank-name rejection, the priority allowlist, trimming and field mapping, rejection of client-supplied ownership, safe sort parameters, unauthenticated API responses, and CORS preflight behavior.

To prove live database isolation, create two ordinary test accounts, add their credentials only to the local environment variables above, then run:

```bash
npm run test:rls
```

The script signs both users in, creates one contact per user, proves cross-user reads/updates/deletes return no rows, proves ownership transfer fails, cleans up each user's own record, and signs out. Record the successful output or add a screenshot here before submission. The test intentionally requires a configured Neon branch and is not part of the offline unit suite.

## Deploying to Vercel

1. Push the repository to a public GitHub repository and import it into Vercel.
2. Add all required environment variables in Vercel. Use production Neon endpoints and never expose `DATABASE_URL` as a `VITE_` variable.
3. Add the Vercel production and preview domains to Neon Auth's trusted origins.
4. Apply the migration to the production Neon branch from a secure local shell or CI secret store.
5. Deploy. `vercel.json` builds the Vite SPA, keeps `/api/*` on Node.js functions, and routes other paths to the SPA.
6. On the live URL, verify signup/sign-in, CRUD, refresh persistence, filters, sorting, mobile layout, sign-out, and the two-account isolation test.
7. Replace the placeholder Live application line and screenshot notes in this README.

## Security checklist

- [x] No database connection string or cookie secret is referenced by browser code
- [x] `.env*` is ignored except for placeholder-only `.env.example`
- [x] API schemas reject unknown fields, including `userId`
- [x] Data API calls carry a verified Neon Auth JWT
- [x] Every exposed contacts operation is protected by its own RLS policy
- [x] Update uses `WITH CHECK` to prevent ownership changes
- [ ] Production two-account RLS script run recorded after Neon is configured
- [ ] Public repository and live Vercel links added before submission

## Known limitations and next improvements

- The first version uses email/password only; password recovery UI and OAuth are not customized.
- Search covers contact identity/context fields but not long-form notes.
- Contacts are loaded as one collection; cursor pagination would be the next scale improvement.
- Automated browser end-to-end tests could supplement the unit and database isolation suites.
- Final live screenshots and URLs depend on the owner's Neon, GitHub, and Vercel projects.
