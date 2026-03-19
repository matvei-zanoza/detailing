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

 do $$ begin
   create type public.membership_status as enum (
     'pending_studio',
     'pending_approval',
     'active',
     'rejected'
   );
 exception
   when duplicate_object then null;
 end $$;

 do $$ begin
   create type public.studio_join_request_status as enum (
     'pending',
     'approved',
     'rejected',
     'cancelled'
   );
 exception
   when duplicate_object then null;
 end $$;

do $$ begin
  create type public.booking_request_status as enum (
    'new',
    'acknowledged',
    'cancelled'
  );
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
  studio_id uuid null references public.studios(id) on delete cascade,
  role public.app_role not null default 'staff',
  display_name text not null,
  membership_status public.membership_status not null default 'pending_studio',
  requested_studio_id uuid null references public.studios(id) on delete set null,
  requested_at timestamptz null,
  approved_at timestamptz null,
  approved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_directory (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  public_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_join_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  status public.studio_join_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz null,
  decided_by uuid null references auth.users(id) on delete set null,
  unique (studio_id, user_id)
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins
add column if not exists is_super_admin boolean not null default false;

alter table public.user_profiles
  add column if not exists membership_status public.membership_status;

alter table public.user_profiles
  alter column membership_status set default 'pending_studio';

update public.user_profiles
set membership_status = 'active'
where membership_status is null;

alter table public.user_profiles
  alter column membership_status set not null;

alter table public.user_profiles
  add column if not exists requested_studio_id uuid null references public.studios(id) on delete set null,
  add column if not exists requested_at timestamptz null,
  add column if not exists approved_at timestamptz null,
  add column if not exists approved_by uuid null references auth.users(id) on delete set null;

alter table public.user_profiles
  add column if not exists avatar_url text null;

alter table public.user_profiles
  alter column studio_id drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, studio_id, role, display_name, membership_status)
  values (
    new.id,
    null,
    'staff',
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), 'User'),
    'pending_studio'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
exception
  when duplicate_object then null;
end $$;

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
  car_arrived_at timestamptz null,
  car_ready_at timestamptz null,
  car_picked_up_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_has_service_or_package check (
    (service_id is not null and package_id is null) or
    (service_id is null and package_id is not null)
  )
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status public.booking_request_status not null default 'new',
  customer_name text not null,
  customer_phone text not null,
  customer_email text null,
  car_brand text null,
  car_model text null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  item_type text not null,
  service_id uuid null references public.services(id) on delete set null,
  package_id uuid null references public.packages(id) on delete set null,
  notes text null,
  acknowledged_at timestamptz null,
  acknowledged_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint booking_request_has_service_or_package check (
    (service_id is not null and package_id is null) or
    (service_id is null and package_id is not null)
  )
);

create index if not exists booking_requests_studio_status_idx on public.booking_requests (studio_id, status);
create index if not exists booking_requests_studio_created_idx on public.booking_requests (studio_id, created_at);

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
alter table public.booking_requests enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.studio_directory enable row level security;
alter table public.studio_join_requests enable row level security;
alter table public.app_admins enable row level security;

 create or replace function public.is_studio_member(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select
     exists(
       select 1
       from public.app_admins a
       where a.user_id = auth.uid()
     )
     or exists(
       select 1
       from public.user_profiles up
       where up.id = auth.uid() and up.studio_id = target_studio_id and up.membership_status = 'active'
     );
 $$;

 create or replace function public.is_studio_member_strict(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.user_profiles up
     where up.id = auth.uid() and up.studio_id = target_studio_id and up.membership_status = 'active'
   );
 $$;

 create or replace function public.is_studio_admin(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select
     exists(
       select 1
       from public.app_admins a
       where a.user_id = auth.uid()
     )
     or exists(
       select 1
       from public.user_profiles up
       where up.id = auth.uid()
         and up.studio_id = target_studio_id
         and up.membership_status = 'active'
         and up.role in ('owner', 'manager')
     );
 $$;

 create or replace function public.is_studio_admin_strict(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.user_profiles up
     where up.id = auth.uid()
       and up.studio_id = target_studio_id
       and up.membership_status = 'active'
       and up.role in ('owner', 'manager')
   );
 $$;

 create or replace function public.is_app_admin()
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.app_admins a
     where a.user_id = auth.uid()
   );
 $$;

 create or replace function public.is_super_admin()
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.app_admins a
     where a.user_id = auth.uid() and a.is_super_admin = true
   );
 $$;

create or replace function public.prevent_user_profiles_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if auth.uid() = old.id and not public.is_super_admin() then
    if new.id <> old.id
      or new.studio_id is distinct from old.studio_id
      or new.role is distinct from old.role
      or new.membership_status is distinct from old.membership_status
      or new.requested_studio_id is distinct from old.requested_studio_id
      or new.requested_at is distinct from old.requested_at
      or new.approved_at is distinct from old.approved_at
      or new.approved_by is distinct from old.approved_by
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Not allowed to modify restricted profile fields';
    end if;
  end if;

  return new;
end;
$$;

do $$ begin
  create trigger user_profiles_prevent_self_escalation
  before update on public.user_profiles
  for each row
  execute function public.prevent_user_profiles_self_escalation();
exception
  when duplicate_object then null;
end $$;

create or replace function public.prevent_super_admin_mutation()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    if old.is_super_admin = true then
      raise exception 'Cannot delete super admin';
    end if;
    return old;
  end if;

  if (tg_op = 'UPDATE') then
    if old.is_super_admin = true then
      raise exception 'Cannot modify super admin';
    end if;
    if new.is_super_admin = true then
      if exists(select 1 from public.app_admins a where a.is_super_admin = true) then
        raise exception 'Cannot promote to super admin via direct update';
      end if;

      if (select count(*) from public.app_admins) <> 1 then
        raise exception 'Cannot bootstrap super admin when multiple admins exist';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger app_admins_prevent_super_admin_mutation
  before update or delete on public.app_admins
  for each row
  execute function public.prevent_super_admin_mutation();
exception
  when duplicate_object then null;
end $$;

 create or replace function public.is_listed_studio(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.studio_directory sd
     where sd.studio_id = target_studio_id and sd.is_active = true
   );
 $$;

create or replace function public.current_user_studio_id()
returns uuid
stable
language sql
as $$
  select studio_id
  from public.user_profiles
  where id = auth.uid() and membership_status = 'active';
$$;

-- Studios: read only for members
drop policy if exists "studios_select" on public.studios;
create policy "studios_select"
on public.studios
for select
to authenticated
using (id = public.current_user_studio_id());

 drop policy if exists "studios_app_admin" on public.studios;
 create policy "studios_app_admin"
 on public.studios
 for all
 to authenticated
 using (public.is_super_admin())
 with check (public.is_super_admin());

-- user_profiles: user can read own profile
drop policy if exists "user_profiles_self" on public.user_profiles;
create policy "user_profiles_self"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

 drop policy if exists "user_profiles_insert_self" on public.user_profiles;
 create policy "user_profiles_insert_self"
 on public.user_profiles
 for insert
 to authenticated
 with check (
   id = auth.uid()
   and studio_id is null
   and role = 'staff'
   and membership_status = 'pending_studio'
   and requested_studio_id is null
   and requested_at is null
   and approved_at is null
   and approved_by is null
 );

 drop policy if exists "user_profiles_update_self" on public.user_profiles;
 create policy "user_profiles_update_self"
 on public.user_profiles
 for update
 to authenticated
 using (id = auth.uid())
 with check (
   id = auth.uid()
   and studio_id is null
   and role = 'staff'
   and membership_status in ('pending_studio', 'pending_approval', 'rejected')
   and (requested_studio_id is null or public.is_listed_studio(requested_studio_id))
   and approved_at is null
   and approved_by is null
 );

 drop policy if exists "user_profiles_approve_by_studio_admin" on public.user_profiles;
 create policy "user_profiles_approve_by_studio_admin"
 on public.user_profiles
 for update
 to authenticated
 using (public.is_studio_admin_strict(requested_studio_id))
 with check (
   studio_id = requested_studio_id
   and membership_status = 'active'
 );

 drop policy if exists "user_profiles_reject_by_studio_admin" on public.user_profiles;
 create policy "user_profiles_reject_by_studio_admin"
 on public.user_profiles
 for update
 to authenticated
 using (public.is_studio_admin_strict(requested_studio_id))
 with check (
   studio_id is null
   and membership_status = 'rejected'
 );

 drop policy if exists "user_profiles_manage_role_by_studio_admin" on public.user_profiles;
 create policy "user_profiles_manage_role_by_studio_admin"
 on public.user_profiles
 for update
 to authenticated
 using (public.is_studio_admin_strict(studio_id))
 with check (public.is_studio_admin_strict(studio_id));

 drop policy if exists "user_profiles_update_profile_self" on public.user_profiles;
 create policy "user_profiles_update_profile_self"
 on public.user_profiles
 for update
 to authenticated
 using (id = auth.uid())
 with check (id = auth.uid());

 drop policy if exists "studio_directory_manage" on public.studio_directory;
 create policy "studio_directory_manage"
 on public.studio_directory
 for all
 to authenticated
 using (public.is_super_admin())
 with check (public.is_super_admin());

 drop policy if exists "studio_directory_select" on public.studio_directory;
 create policy "studio_directory_select"
 on public.studio_directory
 for select
 to authenticated
 using (is_active = true);

 drop policy if exists "studio_join_requests_select" on public.studio_join_requests;
 create policy "studio_join_requests_select"
 on public.studio_join_requests
 for select
 to authenticated
 using (user_id = auth.uid() or public.is_studio_admin(studio_id));

 drop policy if exists "studio_join_requests_insert" on public.studio_join_requests;
 create policy "studio_join_requests_insert"
 on public.studio_join_requests
 for insert
 to authenticated
 with check (user_id = auth.uid() and status = 'pending' and public.is_listed_studio(studio_id));

 drop policy if exists "studio_join_requests_update" on public.studio_join_requests;
 create policy "studio_join_requests_update"
 on public.studio_join_requests
 for update
 to authenticated
 using (user_id = auth.uid() or public.is_studio_admin_strict(studio_id))
 with check (user_id = auth.uid() or public.is_studio_admin_strict(studio_id));

 drop policy if exists "app_admins_select" on public.app_admins;
 create policy "app_admins_select"
 on public.app_admins
 for select
 to authenticated
 using (user_id = auth.uid() or public.is_app_admin());

 drop policy if exists "app_admins_manage" on public.app_admins;
 drop policy if exists "app_admins_insert" on public.app_admins;
 drop policy if exists "app_admins_update" on public.app_admins;
 drop policy if exists "app_admins_delete" on public.app_admins;

 create policy "app_admins_insert"
 on public.app_admins
 for insert
 to authenticated
 with check (public.is_super_admin() and is_super_admin = false);

 create policy "app_admins_update"
 on public.app_admins
 for update
 to authenticated
 using (public.is_super_admin() and is_super_admin = false)
 with check (public.is_super_admin() and is_super_admin = false);

 create policy "app_admins_delete"
 on public.app_admins
 for delete
 to authenticated
 using (public.is_super_admin() and is_super_admin = false);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_select_own" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (name like (auth.uid()::text || '/%'))
);

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (name like (auth.uid()::text || '/%'))
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

-- Shared studio-scoped tables
create or replace function public.is_studio_member(target_studio_id uuid)
returns boolean
stable
language sql
as $$
  select
    exists(
      select 1
      from public.app_admins a
      where a.user_id = auth.uid()
    )
    or exists(
      select 1
      from public.user_profiles up
      where up.id = auth.uid() and up.studio_id = target_studio_id and up.membership_status = 'active'
    );
$$;

create or replace function public.is_studio_member_strict(target_studio_id uuid)
returns boolean
stable
language sql
as $$
  select exists(
    select 1
    from public.user_profiles up
    where up.id = auth.uid() and up.studio_id = target_studio_id and up.membership_status = 'active'
  );
$$;

 create or replace function public.is_studio_admin(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select
     exists(
       select 1
       from public.app_admins a
       where a.user_id = auth.uid()
     )
     or exists(
       select 1
       from public.user_profiles up
       where up.id = auth.uid()
         and up.studio_id = target_studio_id
         and up.membership_status = 'active'
         and up.role in ('owner', 'manager')
     );
 $$;

 create or replace function public.is_studio_admin_strict(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.user_profiles up
     where up.id = auth.uid()
       and up.studio_id = target_studio_id
       and up.membership_status = 'active'
       and up.role in ('owner', 'manager')
   );
 $$;

 create or replace function public.is_app_admin()
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.app_admins a
     where a.user_id = auth.uid()
   );
 $$;

 create or replace function public.is_listed_studio(target_studio_id uuid)
 returns boolean
 stable
 language sql
 as $$
   select exists(
     select 1
     from public.studio_directory sd
     where sd.studio_id = target_studio_id and sd.is_active = true
   );
 $$;

drop policy if exists "staff_profiles_scoped" on public.staff_profiles;
drop policy if exists "staff_profiles_select" on public.staff_profiles;
drop policy if exists "staff_profiles_insert" on public.staff_profiles;
drop policy if exists "staff_profiles_update" on public.staff_profiles;
drop policy if exists "staff_profiles_delete" on public.staff_profiles;
create policy "staff_profiles_select"
on public.staff_profiles
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "staff_profiles_insert"
on public.staff_profiles
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "staff_profiles_update"
on public.staff_profiles
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "staff_profiles_delete"
on public.staff_profiles
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "customers_scoped" on public.customers;
drop policy if exists "customers_select" on public.customers;
drop policy if exists "customers_insert" on public.customers;
drop policy if exists "customers_update" on public.customers;
drop policy if exists "customers_delete" on public.customers;
create policy "customers_select"
on public.customers
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "customers_insert"
on public.customers
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "customers_update"
on public.customers
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "customers_delete"
on public.customers
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "customer_tags_scoped" on public.customer_tags;
drop policy if exists "customer_tags_select" on public.customer_tags;
drop policy if exists "customer_tags_insert" on public.customer_tags;
drop policy if exists "customer_tags_update" on public.customer_tags;
drop policy if exists "customer_tags_delete" on public.customer_tags;
create policy "customer_tags_select"
on public.customer_tags
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "customer_tags_insert"
on public.customer_tags
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "customer_tags_update"
on public.customer_tags
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "customer_tags_delete"
on public.customer_tags
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "customer_tag_assignments_scoped" on public.customer_tag_assignments;
drop policy if exists "customer_tag_assignments_select" on public.customer_tag_assignments;
drop policy if exists "customer_tag_assignments_insert" on public.customer_tag_assignments;
drop policy if exists "customer_tag_assignments_update" on public.customer_tag_assignments;
drop policy if exists "customer_tag_assignments_delete" on public.customer_tag_assignments;
create policy "customer_tag_assignments_select"
on public.customer_tag_assignments
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "customer_tag_assignments_insert"
on public.customer_tag_assignments
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "customer_tag_assignments_update"
on public.customer_tag_assignments
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "customer_tag_assignments_delete"
on public.customer_tag_assignments
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "cars_scoped" on public.cars;
drop policy if exists "cars_select" on public.cars;
drop policy if exists "cars_insert" on public.cars;
drop policy if exists "cars_update" on public.cars;
drop policy if exists "cars_delete" on public.cars;
create policy "cars_select"
on public.cars
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "cars_insert"
on public.cars
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "cars_update"
on public.cars
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "cars_delete"
on public.cars
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "services_scoped" on public.services;
drop policy if exists "services_select" on public.services;
drop policy if exists "services_insert" on public.services;
drop policy if exists "services_update" on public.services;
drop policy if exists "services_delete" on public.services;
create policy "services_select"
on public.services
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "services_insert"
on public.services
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "services_update"
on public.services
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "services_delete"
on public.services
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "packages_scoped" on public.packages;
drop policy if exists "packages_select" on public.packages;
drop policy if exists "packages_insert" on public.packages;
drop policy if exists "packages_update" on public.packages;
drop policy if exists "packages_delete" on public.packages;
create policy "packages_select"
on public.packages
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "packages_insert"
on public.packages
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "packages_update"
on public.packages
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "packages_delete"
on public.packages
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "package_items_scoped" on public.package_items;
drop policy if exists "package_items_select" on public.package_items;
drop policy if exists "package_items_insert" on public.package_items;
drop policy if exists "package_items_update" on public.package_items;
drop policy if exists "package_items_delete" on public.package_items;
create policy "package_items_select"
on public.package_items
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "package_items_insert"
on public.package_items
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "package_items_update"
on public.package_items
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "package_items_delete"
on public.package_items
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "bookings_scoped" on public.bookings;
drop policy if exists "bookings_select" on public.bookings;
drop policy if exists "bookings_insert" on public.bookings;
drop policy if exists "bookings_update" on public.bookings;
drop policy if exists "bookings_delete" on public.bookings;
create policy "bookings_select"
on public.bookings
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "bookings_insert"
on public.bookings
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "bookings_update"
on public.bookings
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "bookings_delete"
on public.bookings
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "booking_requests_scoped" on public.booking_requests;
drop policy if exists "booking_requests_select" on public.booking_requests;
drop policy if exists "booking_requests_insert" on public.booking_requests;
drop policy if exists "booking_requests_update" on public.booking_requests;
drop policy if exists "booking_requests_delete" on public.booking_requests;
create policy "booking_requests_select"
on public.booking_requests
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "booking_requests_insert"
on public.booking_requests
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "booking_requests_update"
on public.booking_requests
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "booking_requests_delete"
on public.booking_requests
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "booking_status_history_scoped" on public.booking_status_history;
drop policy if exists "booking_status_history_select" on public.booking_status_history;
drop policy if exists "booking_status_history_insert" on public.booking_status_history;
drop policy if exists "booking_status_history_update" on public.booking_status_history;
drop policy if exists "booking_status_history_delete" on public.booking_status_history;
create policy "booking_status_history_select"
on public.booking_status_history
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "booking_status_history_insert"
on public.booking_status_history
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "booking_status_history_update"
on public.booking_status_history
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "booking_status_history_delete"
on public.booking_status_history
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

drop policy if exists "payments_scoped" on public.payments;
drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_insert" on public.payments;
drop policy if exists "payments_update" on public.payments;
drop policy if exists "payments_delete" on public.payments;
create policy "payments_select"
on public.payments
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "payments_insert"
on public.payments
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "payments_update"
on public.payments
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "payments_delete"
on public.payments
for delete
to authenticated
using (public.is_studio_member_strict(studio_id));

commit;
