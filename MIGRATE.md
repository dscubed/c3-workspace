# Migration Steps

## 1. Copy existing apps into monorepo

```powershell
# From Documents/
xcopy /E /I connect3\connect3 c3-workspace\apps\connect3
xcopy /E /I connect3-ticketing c3-workspace\apps\ticketing
xcopy /E /I connect3-admin c3-workspace\apps\admin
xcopy /E /I search-playground c3-workspace\apps\c3-cli
```

## 2. Update each app's package.json

Add workspace deps and rename:

**apps/connect3/package.json**
```json
{
  "name": "connect3",
  "dependencies": {
    "@c3/ui": "workspace:*",
    "@c3/supabase": "workspace:*",
    "@c3/auth": "workspace:*",
    "@c3/types": "workspace:*",
    "@c3/utils": "workspace:*"
  }
}
```

**apps/ticketing/package.json** — same, name = `ticketing`

**apps/admin/package.json** — same, name = `admin`

**apps/c3-cli/package.json**
```json
{
  "name": "c3-cli",
  "dependencies": {
    "@c3/supabase": "workspace:*",
    "@c3/types": "workspace:*"
  }
}
```

## 3. Replace duplicated code in each app

| Remove from app | Replace with |
|---|---|
| `lib/supabase/client.ts` | `import { createBrowserClient } from "@c3/supabase/client"` |
| `lib/supabase/server.ts` | `import { createServerClient } from "@c3/supabase/server"` |
| `lib/supabase/middleware.ts` | `import { updateSession } from "@c3/supabase/middleware"` |
| `lib/supabase/admin.ts` | `import { supabaseAdmin } from "@c3/supabase/admin"` |
| `stores/authStore.ts` (ticketing/admin) | `import { useAuthStore } from "@c3/auth/store"` |
| `components/ui/*` (common) | `import { Button } from "@c3/ui"` |
| `lib/utils.ts` (cn) | `import { cn } from "@c3/utils"` |

## 4. Update tsconfig.json in each app

```json
{
  "extends": "@c3/tsconfig/nextjs.json"
}
```

## 5. Install & run

```bash
cd c3-workspace
pnpm install
pnpm dev          # all 4 apps
pnpm dev:connect3 # just connect3
```

## Package dependency graph

```
@c3/tsconfig
    └── @c3/utils
    └── @c3/types
    └── @c3/supabase (depends on: next, @supabase/ssr)
        └── @c3/auth (depends on: zustand, @c3/supabase, @c3/types)
            └── @c3/ui (depends on: @c3/utils, radix-ui, shadcn)
                └── apps/* (connect3, ticketing, admin, c3-cli)
```
