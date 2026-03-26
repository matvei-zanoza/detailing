begin;

do $$ begin
  create type public.payment_status as enum (
    'unpaid',
    'partial',
    'paid',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.follow_up_task_type as enum (
    'review_request',
    'rebook_reminder',
    'inactive_customer'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.follow_up_task_status as enum (
    'pending',
    'sent',
    'skipped'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.customers
  add column if not exists whatsapp text null,
  add column if not exists line text null;

alter table public.cars
  add column if not exists notes text null,
  add column if not exists last_visit_at timestamptz null,
  add column if not exists total_spent_cents int not null default 0;

alter table public.booking_status_history
  add column if not exists from_status public.booking_status null,
  add column if not exists to_status public.booking_status null;

alter table public.payments
  add column if not exists status public.payment_status not null default 'paid',
  add column if not exists discount_cents int not null default 0,
  add column if not exists created_at timestamptz not null default now();

alter table public.payments
  alter column paid_at drop not null;

create table if not exists public.car_service_history (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  services_summary text not null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists car_service_history_studio_car_created_idx
on public.car_service_history (studio_id, car_id, created_at desc);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  type public.follow_up_task_type not null,
  language text not null default 'en',
  body text not null,
  created_at timestamptz not null default now(),
  unique (studio_id, type, language)
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  car_id uuid null references public.cars(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  type public.follow_up_task_type not null,
  status public.follow_up_task_status not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists follow_up_tasks_studio_status_scheduled_idx
on public.follow_up_tasks (studio_id, status, scheduled_for asc);

alter table public.car_service_history enable row level security;
alter table public.message_templates enable row level security;
alter table public.follow_up_tasks enable row level security;

drop policy if exists "car_service_history_select" on public.car_service_history;
drop policy if exists "car_service_history_insert" on public.car_service_history;
drop policy if exists "car_service_history_update" on public.car_service_history;
drop policy if exists "car_service_history_delete" on public.car_service_history;
create policy "car_service_history_select"
on public.car_service_history
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "car_service_history_insert"
on public.car_service_history
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "car_service_history_update"
on public.car_service_history
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "car_service_history_delete"
on public.car_service_history
for delete
to authenticated
using (public.is_studio_admin_strict(studio_id));

drop policy if exists "message_templates_select" on public.message_templates;
drop policy if exists "message_templates_insert" on public.message_templates;
drop policy if exists "message_templates_update" on public.message_templates;
drop policy if exists "message_templates_delete" on public.message_templates;
create policy "message_templates_select"
on public.message_templates
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "message_templates_insert"
on public.message_templates
for insert
to authenticated
with check (public.is_studio_admin_strict(studio_id));
create policy "message_templates_update"
on public.message_templates
for update
to authenticated
using (public.is_studio_admin_strict(studio_id))
with check (public.is_studio_admin_strict(studio_id));
create policy "message_templates_delete"
on public.message_templates
for delete
to authenticated
using (public.is_studio_admin_strict(studio_id));

drop policy if exists "follow_up_tasks_select" on public.follow_up_tasks;
drop policy if exists "follow_up_tasks_insert" on public.follow_up_tasks;
drop policy if exists "follow_up_tasks_update" on public.follow_up_tasks;
drop policy if exists "follow_up_tasks_delete" on public.follow_up_tasks;
create policy "follow_up_tasks_select"
on public.follow_up_tasks
for select
to authenticated
using (public.is_studio_member(studio_id));
create policy "follow_up_tasks_insert"
on public.follow_up_tasks
for insert
to authenticated
with check (public.is_studio_member_strict(studio_id));
create policy "follow_up_tasks_update"
on public.follow_up_tasks
for update
to authenticated
using (public.is_studio_member_strict(studio_id))
with check (public.is_studio_member_strict(studio_id));
create policy "follow_up_tasks_delete"
on public.follow_up_tasks
for delete
to authenticated
using (public.is_studio_admin_strict(studio_id));

commit;
