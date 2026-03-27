alter table public.cars alter column customer_id drop not null;
alter table public.cars alter column year drop not null;
alter table public.cars alter column color drop not null;
alter table public.cars alter column license_plate drop not null;
alter table public.cars alter column category drop not null;

alter table public.cars drop constraint if exists cars_customer_id_fkey;
alter table public.cars
  add constraint cars_customer_id_fkey
  foreign key (customer_id)
  references public.customers(id)
  on delete set null;
