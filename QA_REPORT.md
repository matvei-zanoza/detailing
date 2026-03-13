# DetailingOS CRM — QA Report

## Manual verification checklist

### Auth
- [ ] Visit `/login` loads
- [ ] Demo login button signs in
- [ ] Authenticated user is redirected away from `/login`
- [ ] Unauthenticated user is redirected to `/login` from protected routes

### Dashboard
- [ ] `/dashboard` loads without errors
- [ ] Cards show non-empty metrics when seeded
- [ ] Next bookings table renders
- [ ] Recent customers + job updates render

### Bookings
- [ ] `/bookings` list loads
- [ ] Date filter works
- [ ] Status filter works
- [ ] Staff filter works
- [ ] Create booking dialog can create a booking
- [ ] After create, redirected to `/bookings/[id]`
- [ ] Edit booking saves
- [ ] Changing status adds to status history

### Workflow
- [ ] `/workflow` loads
- [ ] Jobs appear in correct columns
- [ ] Changing status moves job to new column

### Customers
- [ ] `/customers` list loads
- [ ] Search works
- [ ] `/customers/[id]` loads
- [ ] Cars owned list links to `/cars/[id]`
- [ ] Booking history links to `/bookings/[id]`

### Cars
- [ ] `/cars` list loads
- [ ] Search works
- [ ] `/cars/[id]` loads
- [ ] Service history renders

### Services / Packages
- [ ] `/services` loads
- [ ] Create service works
- [ ] Edit service works
- [ ] `/packages` loads
- [ ] Create package works
- [ ] Edit package works

### Staff
- [ ] `/staff` loads
- [ ] Today’s jobs table renders

### Analytics
- [ ] `/analytics` loads
- [ ] Revenue cards display
- [ ] Chart renders (client component)
- [ ] Popular services list renders

### Settings
- [ ] `/settings` loads
- [ ] Save settings updates studio

## What was tested during implementation
- TypeScript compilation (`npm run typecheck`) after each major module
- Server/client boundaries for charts (Recharts moved to client component)
- Supabase embedded relation normalization for safe rendering

## Critical flows tested
- Create booking → open booking detail → update status → observe history
- Workflow board status change updates dashboard/widgets via revalidate

## Known issues
- Payments are only created by seed script; moving a booking to `paid` does not auto-create a payment row (MVP limitation).

## Fixes made during self-review
- Fixed RHF/Zod resolver type mismatch causing TS errors
- Normalized Supabase embedded relation typing for stable rendering
- Moved Recharts usage into a client component to prevent server import issues
- Replaced bookings filters with a true GET form so filters work reliably
