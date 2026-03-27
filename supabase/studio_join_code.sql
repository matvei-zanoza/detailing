create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.studio_join_codes (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  join_code text,
  join_code_hash text not null,
  rotated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.studio_join_codes
  add column if not exists join_code text;

do $$ begin
  alter table public.studio_join_codes
    add constraint studio_join_codes_join_code_format
    check (join_code is null or join_code ~ '^[0-9]{6}$');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create unique index studio_join_codes_join_code_key on public.studio_join_codes (join_code);
exception
  when duplicate_object then null;
end $$;

alter table public.studio_join_codes enable row level security;

create or replace function public.check_studio_join_code(p_studio_id uuid, p_code text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists(
    select 1
    from public.studio_join_codes jc
    where jc.studio_id = p_studio_id
      and jc.join_code = p_code
  );
$$;

grant execute on function public.check_studio_join_code(uuid, text) to authenticated;

create or replace function public.resolve_studio_by_join_code(p_code text)
returns uuid
language sql
security definer
set search_path = public, extensions
as $$
  select jc.studio_id
  from public.studio_join_codes jc
  left join public.studio_directory sd
    on sd.studio_id = jc.studio_id
  where jc.join_code = p_code
    and (sd.studio_id is null or sd.is_active = true)
  limit 1;
$$;

grant execute on function public.resolve_studio_by_join_code(text) to authenticated;

create or replace function public.set_studio_join_code(p_studio_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  raise exception 'join code is immutable';

end;
$$;

grant execute on function public.set_studio_join_code(uuid, text) to authenticated;

revoke execute on function public.set_studio_join_code(uuid, text) from authenticated;

create or replace function public.generate_unique_studio_join_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists(
      select 1 from public.studio_join_codes jc where jc.join_code = v_code
    );
  end loop;
  return v_code;
end;
$$;

grant execute on function public.generate_unique_studio_join_code() to authenticated;

create or replace function public.rotate_studio_join_code(p_studio_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  raise exception 'join code is immutable';
  return null;
end;
$$;

grant execute on function public.rotate_studio_join_code(uuid) to authenticated;

revoke execute on function public.rotate_studio_join_code(uuid) from authenticated;

create or replace function public.prevent_studio_join_code_update()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if old.join_code is null then
    -- allow setting the code once (migration/backfill)
    if new.join_code is null then
      raise exception 'join code is immutable';
    end if;
    return new;
  end if;

  if (new.join_code is distinct from old.join_code)
    or (new.join_code_hash is distinct from old.join_code_hash) then
    raise exception 'join code is immutable';
  end if;
  return new;
end;
$$;

do $$ begin
  create trigger studio_join_codes_prevent_update
  before update on public.studio_join_codes
  for each row
  execute function public.prevent_studio_join_code_update();
exception
  when duplicate_object then null;
end $$;

create or replace function public.get_studio_join_code(p_studio_id uuid)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select jc.join_code
  from public.studio_join_codes jc
  where jc.studio_id = p_studio_id
    and public.is_studio_admin_strict(p_studio_id)
  limit 1;
$$;

grant execute on function public.get_studio_join_code(uuid) to authenticated;

do $$
declare
  r record;
  v_code text;
begin
  for r in (
    select s.id as studio_id
    from public.studios s
    left join public.studio_join_codes jc on jc.studio_id = s.id
    where jc.studio_id is null
  ) loop
    v_code := public.generate_unique_studio_join_code();
    insert into public.studio_join_codes (studio_id, join_code, join_code_hash, rotated_at)
    values (r.studio_id, v_code, crypt(v_code, gen_salt('bf')), now())
    on conflict (studio_id) do nothing;
  end loop;
end;
$$;

create or replace function public.ensure_studio_join_code_on_studio_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if exists(select 1 from public.studio_join_codes jc where jc.studio_id = new.id) then
    return new;
  end if;

  v_code := public.generate_unique_studio_join_code();
  insert into public.studio_join_codes (studio_id, join_code, join_code_hash, rotated_at)
  values (new.id, v_code, crypt(v_code, gen_salt('bf')), now())
  on conflict (studio_id) do nothing;

  return new;
end;
$$;

do $$ begin
  create trigger studios_ensure_join_code
  after insert on public.studios
  for each row
  execute function public.ensure_studio_join_code_on_studio_insert();
exception
  when duplicate_object then null;
end $$;
