do $$
begin
  if exists(
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'cars'
      and a.attname = 'customer_id'
      and a.attnotnull
  ) then
    execute 'alter table public.cars alter column customer_id drop not null';
  end if;
end $$;

do $$
begin
  if exists(
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'cars'
      and a.attname = 'year'
      and a.attnotnull
  ) then
    execute 'alter table public.cars alter column year drop not null';
  end if;
end $$;

do $$
begin
  if exists(
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'cars'
      and a.attname = 'color'
      and a.attnotnull
  ) then
    execute 'alter table public.cars alter column color drop not null';
  end if;
end $$;

do $$
begin
  if exists(
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'cars'
      and a.attname = 'license_plate'
      and a.attnotnull
  ) then
    execute 'alter table public.cars alter column license_plate drop not null';
  end if;
end $$;

do $$
begin
  if exists(
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'cars'
      and a.attname = 'category'
      and a.attnotnull
  ) then
    execute 'alter table public.cars alter column category drop not null';
  end if;
end $$;

alter table public.cars drop constraint if exists cars_customer_id_fkey;
alter table public.cars
  add constraint cars_customer_id_fkey
  foreign key (customer_id)
  references public.customers(id)
  on delete set null;
