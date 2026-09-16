# Real Estate CRM — Frontend

A complete, role-aware web app for the `nestjs-crm-backend` API. Animated login, live-refreshing
dashboards per role, and full CRUD for every mounted backend module — built mobile-first with a
bottom tab bar on phones and a sidebar on desktop.

This app lives in its own folder (`crm-frontend/`) inside the `Real Estate CRM` project, independent
of the backend.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite 8 + React 19 + TypeScript | Fast dev server, strict typing |
| Data fetching / caching | **TanStack Query** (`@tanstack/react-query`) | Smart polling, cache invalidation, request de-dupe |
| Routing | **TanStack Router** (`@tanstack/react-router`), code-based route tree | Type-safe routes, `beforeLoad` guards for auth + roles |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js` needed) | Fast, consistent, easy theming |
| Forms & validation | React Hook Form + Zod (`@hookform/resolvers`) | Schemas mirror the backend DTOs exactly |
| Animation | Framer Motion | Login page, modals, page transitions, drawers |
| State (auth session) | Zustand (persisted to `localStorage`) | Small, no boilerplate |
| Charts | Recharts | Lead-status donut, team workload bar chart |
| HTTP client | Axios, with a single interceptor pair for JWT + refresh-token rotation | Matches the backend's 15-min access / 7-day single-use refresh tokens |
| Icons / toasts | lucide-react, sonner | |

**Note on `@tanstack/react-table`:** it was installed, then removed. The version that resolved
(`v9`) ships a completely rewritten, low-level API (no `useReactTable` hook — it's built around
`constructTable`/feature composition) that isn't documented anywhere near current tutorials. Rather
than risk fragile code against an unfamiliar API, all tables are custom (`src/components/ui/data-table.tsx`)
— plain, accessible HTML tables with the same sorting/pagination needs handled via component state
and the backend's own `page`/`pageSize` query params. TanStack Query and Router are still the backbone
of the "TanStack" stack as requested.

---

## 2. What was built

### Login (`/login`)
Split-screen animated login: left panel has drifting gradient blobs (CSS `@keyframes`, GPU-cheap)
and feature highlights; right panel is the sign-in form (React Hook Form + Zod). Includes
one-click-fill demo account chips for `SUPER_ADMIN` and `ADMIN` (the two accounts the backend seed
script creates). On success it stores the JWT pair + user profile and redirects to `/dashboard`.

### Role-aware dashboards (`/dashboard`)
One route, four different components picked at runtime by `user.role`:
- **Super Admin** — organization counts by status, recent organizations table.
- **Admin** — managers/projects/users counts, org-wide lead-status donut, recent leads.
- **Manager** — team headcount, team workload bar chart (active leads per member), recent leads.
- **Presales / Postsales / Agent** — personal workload, conversions, personal lead-status donut,
  recent leads assigned to them.

### Every mounted backend module has a screen
| Screen | Route | Roles | Backend endpoints used |
|---|---|---|---|
| Organizations | `/organizations` | SUPER_ADMIN | `GET/POST/PATCH /organizations`, `POST /organizations/:id/admin`, `PATCH .../suspend`, `PATCH .../reactivate`, `DELETE /organizations/:id` |
| Managers | `/managers` | ADMIN | `GET/POST/PATCH/DELETE /managers`, `PATCH .../deactivate`, `PATCH .../reactivate` |
| Projects | `/projects` | ADMIN | `GET/POST/PATCH/DELETE /projects`, `POST/GET/DELETE /projects/:id/managers[/:managerId]` |
| My Team | `/team` | MANAGER | `GET/POST/PATCH /manager/team-members`, `GET /manager/team-members/:id`, `POST /manager/team-members/:id/projects` |
| Users | `/users` | SUPER_ADMIN, ADMIN, MANAGER | `GET/POST /users`, `PATCH /users/:id/deactivate`, `DELETE /users/:id` |
| Leads (list + detail + timeline) | `/leads`, `/leads/:leadId` | everyone (scoped by the backend) | `GET /leads`, `GET /leads/:id`, `POST /leads/manual`, `PATCH /leads/:id/assign` |
| Reports | `/reports` | everyone (different view per role) | `GET /employees/team-summary`, `GET /employees/:id/summary` |
| Integrations | `/integrations` | ADMIN (full), MANAGER (view-only) | `GET/POST/PATCH /platform-integrations`, `DELETE .../:id`, `POST .../:id/reveal-secret` |

Every create/edit form's field set matches its DTO **exactly** — the backend's global
`forbidNonWhitelisted: true` validation 400s on any stray key, so payloads are built explicitly
rather than spreading whole form objects.

### Real-time-ish data
Per your call, the backend has no WebSocket/SSE — so "live" means **smart polling**: TanStack
Query refetches every 20s (`REFRESH_INTERVAL_MS` in `src/lib/constants.ts`), refetches on window
focus, and there's a manual refresh button (top bar, next to the pulsing "Live" badge) that
invalidates every active query on demand.

### Mobile app-like UI
Below the `lg` breakpoint the sidebar disappears and a **bottom tab bar** takes over (up to 4
primary destinations per role + a "More" tab that opens a slide-in drawer with the rest of the nav
and sign-out) — the same pattern as a native mobile app. Every page, table (horizontally scrollable
where needed), modal (becomes a bottom sheet on small screens) and form is responsive down to
~360px.

### Integrations (`/integrations` — Admin edits, Manager views)
A Zapier/Notion-style directory for the 20 external portals and ad platforms that can send leads via
webhook (99acres, MagicBricks, Housing.com, NoBroker, Square Yards, PropTiger, Real Estate India,
Makaan, CommonFloor, OLX, Home Online, Tata Housing, Facebook, Instagram, Meta Lead Ads,
Click‑to‑WhatsApp, Google Ads, Google Search, Google Business Profile, YouTube Ads) — the curated
subset of `LeadSource` that maps to a real RM relationship, as opposed to offline sources like
Walk-in or Referral. Each card carries a real brand mark (official SVG path + hex color, sourced from
[simple-icons](https://github.com/simple-icons/simple-icons), CC0-licensed and explicitly meant for
"we integrate with X" use) for the handful of globally recognizable brands, and a colored
monogram badge in that brand's real color for the regional portals that don't have a redistributable
mark — so it reads as a real integrations page, not a placeholder grid.

**Flow:** click a card → **Connect** → optionally fill in the RM's name/email/phone → the backend
generates a per-platform webhook URL + secret → shown once, with copy buttons, a sample JSON payload,
and a ready-to-run `curl` example, so you can hand it straight to the RM. Already-connected cards show
a live status pill and open in **Manage** (Admin) or **View** (Manager) mode instead — RM details,
webhook URL, and a "Reveal secret" action (Admin-only; the secret is never included in the regular
list/detail response, only right after creation or via an explicit reveal call) plus
Deactivate/Reactivate.

**Role split, enforced on both ends:** the backend's `PlatformIntegrationController` was originally
`@Roles(ADMIN, SUPER_ADMIN)` for every route, including the read-only ones — so Managers got a flat
403 even just looking. Fixed with a small, additive change in
`nestjs-crm-backend/src/modules/platform_IntegrationModule/controllers/platform-integration.controller.ts`:
`GET /platform-integrations` and `GET /platform-integrations/:id` now also allow `MANAGER` (method-level
`@Roles` overrides the class-level one), while create/update/deactivate/reveal-secret stay
Admin/Super-Admin only. The frontend mirrors this: the `/integrations` route itself is gated to
`[ADMIN, MANAGER]`, and within the page `canEdit` (derived from the signed-in role) hides every
mutating control — Connect buttons, Edit, Reveal secret, Deactivate/Reactivate — for Managers, who get
read-only "View" instead.

### Theme
Teal + white, "eye-soothing": soft slate-50 backgrounds, white cards, teal-600 (`#0d9488`) as the
single accent color, generous rounded corners (`rounded-xl`/`2xl`), soft shadows instead of hard
borders. Font is **Plus Jakarta Sans** (Google Fonts), a professional, rounded-but-serious grotesk.
Defined once in `src/index.css` under Tailwind v4's `@theme` block — change `--color-brand-*` there
to re-theme the whole app.

---

## 3. Project structure

```
crm-frontend/
  src/
    api/            One file per backend resource — thin axios wrappers, typed request/response
    hooks/queries/   TanStack Query hooks (useX / useCreateX / ...), toasts + cache invalidation
    store/           auth-store.ts — Zustand, persisted session (tokens + user)
    lib/             api-client.ts (axios + refresh interceptor), constants, nav config, utils,
                     platform-catalog.ts (curated integration list), brand-icons.ts (SVG path data)
    types/           All enums + entity types, mirroring prisma/schema.prisma
    components/
      ui/            Design-system primitives (Button, Input, Modal, DataTable, Toggle, ...)
      layout/        Sidebar, Topbar, mobile bottom nav + drawer, AppShell
      dashboard/     StatCard, StatusDonut, WorkloadBar, RecentLeadsTable
      <resource>/    Form modals specific to one resource (organizations/, projects/, leads/, ...)
    pages/           One component per route
    router.tsx       Code-based TanStack Router route tree + auth/role guards
    main.tsx         App entry — QueryClientProvider + RouterProvider
```

---

## 4. Running it

```bash
cd crm-frontend
npm install
cp .env.example .env    # already done; edit VITE_API_BASE_URL if your backend isn't on :3000
npm run dev              # http://localhost:5174
```

The backend must be running separately (`cd ../nestjs-crm-backend && npm run start:dev`) with
Postgres up and seeded (`npm run prisma:seed`). Its `.env` already whitelists
`CORS_ORIGINS=http://localhost:5174`, which is why `vite.config.ts` pins the dev server to that exact
port (`strictPort: true`) instead of letting Vite auto-pick one.

```bash
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve the production build locally
```

---

## 5. How to test it

**Already verified this build**, end to end, against the real backend + Postgres (not mocked):
logged in as both seeded accounts, confirmed live data renders (an existing org — "Sagar Realty Pvt
Ltd" — showed up correctly alongside the demo org), created a project with multi-selected platforms,
opened the create-lead form, connected a real integration (99acres) as Admin and got back a live
webhook URL + secret from the running backend, confirmed a Manager account sees the same data but
strictly read-only, and resized to a 375px mobile viewport and drove the bottom nav — zero console
errors anywhere in it. (Test fixtures — the throwaway manager account and the test integration — were
cleaned up afterwards.)

To re-verify yourself:

1. **Login animation & demo accounts** — open `/login`, watch the blob animation on the left panel,
   click the "Super Admin" chip (auto-fills credentials), sign in.
2. **Super Admin flow** — `/organizations`: filter by status/plan, create an org (with or without a
   nested first admin), suspend one (reason required), reactivate it, add a second admin.
3. **Admin flow** — sign out, log in as `admin@demorealty.com` / `Admin@123`. Create a manager
   (`/managers`), create a project with a few `activePlatforms` selected (`/projects`), assign the
   manager to it, then check `/users` and `/reports` (pick an employee from the dropdown once one
   exists).
4. **Manager flow** — log in as a manager you created above. `/team`: add a team member (AGENT/
   PRESALES/POSTSALES), open their detail modal, toggle active/inactive.
5. **Leads, any role** — `/leads`: add a lead manually, filter by status/source, click a row to see
   the full detail page with its activity timeline; as Manager/Admin/Super Admin, use the row-level
   assign button.
6. **Integrations** — `/integrations` as Admin: click **Connect** on any card (e.g. 99acres), fill in
   an RM contact, submit — copy the generated webhook URL/secret. Reopen that card ("Manage") to edit
   the RM, reveal the secret again, or deactivate/reactivate it. Then log in as a Manager in the same
   org and open `/integrations` again — same data, but every mutating control (Connect, Edit, Reveal
   secret, Deactivate) is gone; it's "View" only, enforced by the backend role guard too, not just
   hidden in the UI.
7. **Mobile** — open dev tools, switch to a 375×812 viewport (or any phone), confirm the sidebar is
   replaced by a bottom tab bar and that the "More" tab opens a full nav drawer.
8. **Session handling** — leave the tab open past the 15-minute access-token lifetime; the next
   request should silently refresh via `/auth/refresh` and retry, with no visible interruption.
   Logging out calls `/auth/logout` to revoke the refresh token, then clears local state.

---

## 6. Things discovered while building this that are worth knowing

- **`project_info__1.md`/`project_info__2.md` are slightly stale.** Running the backend live
  (`npm run start:dev`) showed a few differences from those docs:
  - `PlatformIntegrationController` **is** mounted now (`/platform-integrations/*` routes exist) —
    the docs say it isn't. This is now built (see the Integrations section above), including a small
    backend role-guard fix to let Managers view it.
  - There's an undocumented `POST /leads/portal-ingest` route.
  - The manager-scoped lead-assign route is actually `PATCH /manager/leads/:leadId/assign` (body
    `{ userId }`), **not** `/leads/:leadId/assign` — so it does *not* collide with the general
    `PATCH /leads/:id/assign` (body `{ assignedToId }`) that this app uses everywhere. No ambiguity
    in practice.
  - Worth re-generating that doc from the running server next time it's needed.
- **The backend team has since dropped pagination from `GET /leads` entirely** (this was found — and
  fixed — after leads created via Postman weren't showing up in the dashboard, even though they were
  correctly saved). `LeadsController.findAll` now reads only `@Query('status')` and
  `LeadsService.findAll` returns a plain `Lead[]`, not `{ items, total, page, pageSize }` — the shape
  `project_info__1.md` describes and this app originally shipped against. `source`/`fromDate`/`toDate`
  filtering and pagination are handled **client-side** now (`src/pages/leads-page.tsx`), with `status`
  still filtered server-side since the backend supports that much. If the backend later re-adds proper
  pagination/filtering (there's still a dead, now-unused `LeadQueryDto` sitting in
  `lead-ingestion/dto/lead-querry-dto.ts` — looks like exactly that was underway), move the source/date
  filters back server-side in `src/api/leads.api.ts` and `leads-page.tsx`.
- **Managers have no "list all projects" endpoint.** `/projects` is Admin-only, and
  `/manager/team-members` returns plain users without their project assignments. So on the Team page,
  a manager can see a member's *existing* project assignments (from `GET
  /manager/team-members/:id`), but assigning a *new* one requires pasting a project ID — there's no
  picker. Flagged in the UI with a hint. If you want a real picker here, the backend would need a
  manager-scoped "list projects in my org" endpoint.
- **A few endpoints intentionally leak `passwordHash`** in their JSON response (`POST /managers`,
  `PATCH /managers/:id`, `GET/PATCH /manager/team-members/:id`, `POST /organizations/:id/admin`) —
  documented as a backend quirk. The frontend never reads or displays that field.
- **`price` / `budgetMin` / `budgetMax`** come back as strings (Prisma `Decimal`) — handled via
  `formatCurrency()` in `src/lib/utils.ts`.
#   R e a l E s t a t e - C R M - F r o n t e n d  
 