# c3-workspace

Turborepo monorepo for the Connect3 platform. Contains three Next.js apps and a set of shared packages.

## Apps

| App | Directory | Dev Port | Description |
|-----|-----------|----------|-------------|
| **connect3** | `apps/connect3` | `:3000` | Main Connect3 web app |
| **ticketing** | `apps/ticketing` | `:3001` | Event ticketing & Stripe checkout |
| **admin** | `apps/admin` | `:3002` | Internal admin dashboard |

## Shared Packages

| Package | Directory | Description |
|---------|-----------|-------------|
| `@c3/auth` | `packages/auth` | Auth helpers (Supabase SSR) |
| `@c3/supabase` | `packages/supabase` | Supabase client factory |
| `@c3/types` | `packages/types` | Shared TypeScript types |
| `@c3/ui` | `packages/ui` | Shared UI component library |
| `@c3/utils` | `packages/utils` | Shared utility functions |
| `@c3/tsconfig` | `packages/tsconfig` | Base TypeScript configs |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10 — `npm install -g pnpm`

---

## Installation

```bash
# Clone the repo
git clone <repo-url> c3-workspace
cd c3-workspace

# Install all dependencies (installs for all apps and packages)
pnpm install
```

---

## Environment Variables

Each app needs its own env file in its directory. Copy and fill in the values below.

### `apps/connect3/.env`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-role-key>

# OpenAI
OPENAI_API_KEY=<openai-api-key>
OPENAI_USER_VECTOR_STORE_ID=<vector-store-id>
OPENAI_ORG_VECTOR_STORE_ID=<vector-store-id>
OPENAI_EVENTS_VECTOR_STORE_ID=<vector-store-id>
OPENAI_UNI_VECTOR_STORE_ID=<vector-store-id>

# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# GCP / Google Wallet (optional)
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=<service-account-email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<private-key>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<wallet-service-account-email>
GOOGLE_ISSUER_ID=<google-wallet-issuer-id>
GOOGLE_PRIVATE_KEY=<google-wallet-private-key>

# Apple Wallet (optional)
APPLE_WALLET_SIGNER_CERT=<cert>
APPLE_WALLET_PRIVATE_KEY=<key>
APPLE_WALLET_WWDR_CERT=<cert>
APPLE_WALLET_PASS_TYPE_ID=<pass-type-id>
APPLE_WALLET_TEAM_ID=<team-id>

# Secrets
CRON_SECRET=<random-uuid>
ADMIN_SECRET=<random-hex>
PASS_ENCRYPTION_SECRET=<random-hex>

# Email (Resend)
SUPPORT_EMAIL=support@mail.connect3.app
NOREPLY_EMAIL=noreply@mail.connect3.app
RESEND_API_KEY=<resend-api-key>
```

### `apps/ticketing/.env`

```env
# Supabase — same project as connect3
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-role-key>

# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_CONNECT3_URL=http://localhost:3000

# SSO — points to connect3 for authentication
NEXT_PUBLIC_SSO_BASE_URL=http://localhost:3000/auth/sso

# Secrets
CRON_SECRET=<random-uuid>

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<key>
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<secret>

# Email (Resend)
RESEND_API_KEY=<resend-api-key>
```

### `apps/admin/.env.local`

```env
# Supabase — same project as connect3
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=<anon-key>
SUPABASE_SECRET_KEY=<service-role-key>

# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3002

# SSO — points to connect3 for authentication
NEXT_PUBLIC_SSO_BASE_URL=http://localhost:3000/auth/sso
```

---

## Development

### Run all apps simultaneously

```bash
pnpm dev
```

### Run a single app

```bash
pnpm dev:connect3   # http://localhost:3000
pnpm dev:ticketing  # http://localhost:3001
pnpm dev:admin      # http://localhost:3002
```

### Navigate to a specific app or package

```bash
cd apps/connect3
cd apps/ticketing
cd apps/admin
cd packages/ui
cd packages/supabase
# etc.
```

---

## Other Commands

```bash
pnpm build          # Build all apps and packages
pnpm lint           # Lint all apps and packages
pnpm type-check     # Type-check all apps and packages
pnpm clean          # Clean all build outputs
```

---

## Project Structure

```
c3-workspace/
├── apps/
│   ├── connect3/       # Main app (port 3000)
│   ├── ticketing/      # Ticketing app (port 3001)
│   ├── admin/          # Admin dashboard (port 3002)
│   └── c3-cli/         # CLI tooling
├── packages/
│   ├── auth/           # @c3/auth
│   ├── supabase/       # @c3/supabase
│   ├── types/          # @c3/types
│   ├── ui/             # @c3/ui
│   ├── utils/          # @c3/utils
│   └── tsconfig/       # @c3/tsconfig
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```
