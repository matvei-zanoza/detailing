begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.booking_status as enum (
    'booked',
    'arrived',
    'in_progress',
    'quality_check',
    'finished',
    'paid',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.car_category as enum (
    'sedan',
    'suv',
    'coupe',
    'pickup',
    'van',
    'supercar'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_role as enum ('owner', 'manager', 'staff');
exception
  when duplicate_object then null;
end $$;

-- Core tables
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  branding_color text not null default 'zinc',
  business_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete cascade,
  role public.app_role not null default 'staff',
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  display_name text not null,
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  color text not null default 'zinc',
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  display_name text not null,
  email text null,
  phone text null,
  notes text null,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (studio_id, name)
);

create table if not exists public.customer_tag_assignments (
  studio_id uuid not null references public.studios(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  tag_id uuid not null references public.customer_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, tag_id)
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text not null,
  model text not null,
  year int not null,
  color text not null,
  license_plate text not null,
  category public.car_category not null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  description text not null,
  duration_minutes int not null,
  base_price_cents int not null,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (studio_id, name)
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  description text not null,
  base_price_cents int not null,
  target_profile text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (studio_id, name)
);

create table if not exists public.package_items (
  studio_id uuid not null references public.studios(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  primary key (package_id, service_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  car_id uuid not null references public.cars(id) on delete restrict,
  service_id uuid null references public.services(id) on delete set null,
  package_id uuid null references public.packages(id) on delete set null,
  staff_id uuid null references public.staff_profiles(id) on delete set null,
  booking_date date not null,
  start_time time not null,
  end_time time null,
  status public.booking_status not null default 'booked',
  price_cents int not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_has_service_or_package check (
    (service_id is not null and package_id is null) or
    (service_id is null and package_id is not null)
  )
);

create index if not exists bookings_studio_date_idx on public.bookings (studio_id, booking_date);
create index if not exists bookings_studio_status_idx on public.bookings (studio_id, status);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.booking_status not null,
  changed_by uuid null references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount_cents int not null,
  method text not null default 'card',
  paid_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

-- RLS
alter table public.studios enable row level security;
alter table public.user_profiles enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_tag_assignments enable row level security;
alter table public.cars enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.payments enable row level security;

create or replace function public.current_user_studio_id()
returns uuid
stable
language sql
as $$
  select studio_id from public.user_profiles where id = auth.uid();
$$;

-- Studios: read only for members
drop policy if exists "studios_select" on public.studios;
create policy "studios_select"
on public.studios
for select
to authenticated
using (id = public.current_user_studio_id());

-- user_profiles: user can read own profile
drop policy if exists "user_profiles_self" on public.user_profiles;
create policy "user_profiles_self"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

-- Shared studio-scoped tables
create or replace function public.is_studio_member(target_studio_id uuid)
returns boolean
stable
language sql
as $$
  select exists(
    select 1
    from public.user_profiles up
    where up.id = auth.uid() and up.studio_id = target_studio_id
  );
$$;

drop policy if exists "staff_profiles_scoped" on public.staff_profiles;
create policy "staff_profiles_scoped"
on public.staff_profiles
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "customers_scoped" on public.customers;
create policy "customers_scoped"
on public.customers
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "customer_tags_scoped" on public.customer_tags;
create policy "customer_tags_scoped"
on public.customer_tags
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "customer_tag_assignments_scoped" on public.customer_tag_assignments;
create policy "customer_tag_assignments_scoped"
on public.customer_tag_assignments
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "cars_scoped" on public.cars;
create policy "cars_scoped"
on public.cars
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "services_scoped" on public.services;
create policy "services_scoped"
on public.services
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "packages_scoped" on public.packages;
create policy "packages_scoped"
on public.packages
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "package_items_scoped" on public.package_items;
create policy "package_items_scoped"
on public.package_items
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "bookings_scoped" on public.bookings;
create policy "bookings_scoped"
on public.bookings
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "booking_status_history_scoped" on public.booking_status_history;
create policy "booking_status_history_scoped"
on public.booking_status_history
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

drop policy if exists "payments_scoped" on public.payments;
create policy "payments_scoped"
on public.payments
for all
to authenticated
using (public.is_studio_member(studio_id))
with check (public.is_studio_member(studio_id));

commit;
