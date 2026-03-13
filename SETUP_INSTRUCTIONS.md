# DetailingOS CRM — Setup Instructions

## What you’re setting up
DetailingOS CRM is a Next.js App Router MVP using Supabase for auth + database.

All included demo data is **fictional, sanitized, and non-PII**.

## Prerequisites
- Node.js 20+
- A Supabase project (hosted or local)

## 1) Create Supabase project + set env
1. Create a new Supabase project.
2. In the Supabase dashboard:
   - **Project Settings → API**
     - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Demo login password used by the browser demo buttons
NEXT_PUBLIC_DEMO_DEFAULT_PASSWORD=DemoPass123!

# Seed script password used when creating demo users
DEMO_DEFAULT_PASSWORD=DemoPass123!
```

Notes:
- `NEXT_PUBLIC_DEMO_DEFAULT_PASSWORD` is **not a real secret** (demo only).
- Never commit `.env.local`.

## 2) Apply database schema
Open Supabase **SQL Editor** and run:
- `supabase/schema.sql`

This creates:
- `studios`, `user_profiles`, `staff_profiles`, `customers`, `cars`, `services`, `packages`, `package_items`, `bookings`, `booking_status_history`, `payments`, tags
- RLS policies for studio-scoped access

## 3) Seed demo data
Run:

```bash
npm run seed
```

This will:
- Create **3 studios** (BlackMirror Detailing, UrbanGloss Studio, Apex Ceramic Lab)
- Create demo auth users (owner/manager/staff per studio)
- Insert staff, customers, cars, services, packages, bookings, and payments

## 4) Run the app

```bash
npm run dev
```

Open:
- http://localhost:3000

## Demo login credentials
All demo accounts use the same password (default):
- `DemoPass123!`

Emails (safe `example.com`):
- BlackMirror owner: `owner.blackmirror@example.com`
- UrbanGloss manager: `manager.urbangloss@example.com`
- Apex Ceramic staff: `staff.apex-ceramic@example.com`

## Build command

```bash
npm run build
npm start
```

## Where to edit seed data
- `scripts/seed.ts`

## Data sanitization note
- All customer emails use `example.com`
- Phone numbers use a non-reachable `+1 555` convention
- License plates use `DEMO-...` formats
- No real business addresses, real people, or real contact info are included
