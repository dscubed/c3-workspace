# Step 1: Server-Side Auth Check (edit page)

**File**: `app/events/[id]/edit/page.tsx`  
**Helper**: `lib/api/fetchEventServer.ts` → `checkEventEditAccess()`

---

## What happens when you visit `/events/[id]/edit`

This is a **Next.js server component** — all logic runs on the server at request time. No API calls, no client JS for auth.

```
┌──────────────────────────────────────────────────┐
│  page.tsx (server component)                     │
│                                                  │
│  1. createClient() reads auth cookie from req    │
│  2. supabase.auth.getUser() verifies the session │
│  3. checkEventEditAccess(id, userId)             │
│  4. If allowed → render EditEventClient          │
│     If not_found → notFound() (404)              │
│     Otherwise → Unauthorized component           │
└──────────────────────────────────────────────────┘
```

### Why this is safe without an API route

- `createClient()` from `@c3/supabase/server` reads the Supabase auth cookie from the incoming HTTP request — it cannot be spoofed from the client.
- `supabaseAdmin` (service_role key) lives in `process.env.SUPABASE_SECRET_KEY` and is **never bundled** into client JS.
- The authorization decision happens entirely server-side. The client only receives the `<EditEventClient>` component or the `<Unauthorized>` page.

---

## checkEventEditAccess — the permission ladder

Takes `(eventId, userId)` and returns either `{ allowed: true }` or `{ allowed: false, reason }`.

Checks go in priority order. The first match wins:

### 1. `not_authenticated`
```ts
if (!userId) return { allowed: false, reason: "not_authenticated" };
```
No user is logged in.

### 2. `not_found`
```ts
const event = await fetchEventServer(eventId, { requirePublished: false });
if (!event) return { allowed: false, reason: "not_found" };
```
The event doesn't exist in the database. We use `requirePublished: false` so drafts/archived events are found — otherwise a draft would return `not_found` instead of `forbidden`.

### 3. Creator
```ts
if (event.creator_profile_id === userId) return { allowed: true };
```
You made the event. `creator_profile_id` is stored on the `events` table at creation time.

### 4. Accepted host
```ts
const isHost = event.hosts.some(
  (h) => h.profile_id === userId && h.status === "accepted"
);
```
You're a co-host with `status = "accepted"`. Pending invites do NOT grant access.

### 5. Club admin of creator
```ts
const adminRow = await getClubAdminRow(event.creator_profile_id, userId);
if (adminRow) return { allowed: true };
```
You're **not** the creator, but you're an admin of the club that created the event. Handles multi-admin clubs (president, treasurer, vp can all edit).

### 6. Club admin of collaborator
```ts
for (const collabId of collaboratorIds) {
  const adminRow = await getClubAdminRow(collabId, userId);
  if (adminRow) return { allowed: true };
}
```
You're an admin of one of the co-hosting clubs. If Club A invites Club B as a host, Club B's admins get edit access.

### Default: `forbidden`
None of the above matched. Access denied.

---

## getClubAdminRow

From `@c3/supabase/club-admin` (re-exported via `@/lib/auth/clubAdmin.ts`):

```ts
export async function getClubAdminRow(clubId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from("club_admins")
    .select("id, club_id, user_id, role, status")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  return data;
}
```

Simple DB lookup: is this user an accepted admin of this club?

---

## Import architecture

```
fetchEventServer.ts
  ├── supabaseAdmin from @c3/supabase/admin        (raw service_role client)
  └── getClubAdminRow from @/lib/auth/clubAdmin     (business-logic helper)
        └── re-exports from @c3/supabase/club-admin
```

Two separate packages with different concerns:
- `@c3/supabase/admin` — the low-level DB client
- `@c3/supabase/club-admin` — helper functions for club admin checks

The local barrel at `@/lib/auth/clubAdmin.ts` is just a pass-through for convenience.

---

## fetchEventForEdit — auth + data in one call

```ts
// lib/event-server/check-access.ts
export async function fetchEventForEdit(eventId: string, userId: string | null) {
  const access = await checkEventEditAccess(eventId, userId);
  if (!access.allowed) return access;

  const publicData = await fetchFullEventData({
    row: access._row,      // pre-fetched — skip re-query
    hosts: access._hosts,   // pre-fetched — skip re-query
  });

  const data = publicToFetchedData(publicData);
  return { allowed: true, data };
}
```

Single server round-trip. Returns `{ allowed: true, data }` or `{ allowed: false, reason }`.

---

## What renders next

If allowed, `page.tsx` renders `<EventForm eventId={id} data={result.data} />`.

`EventForm` wraps children in 3 providers (each reads from one above):

1. **EventFormDataProvider** — form state, images, hosts, sections, theme, auto-save  
2. **EventCollabProvider** — realtime presence, field locks, remote changes  
3. **EventEditorProvider** — edit/preview mode, publish/unpublish
