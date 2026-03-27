create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.studio_join_codes (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  join_code_hash text not null,
  rotated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

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
      and jc.join_code_hash = crypt(p_code, jc.join_code_hash)
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
  join public.studio_directory sd
    on sd.studio_id = jc.studio_id
   and sd.is_active = true
  where jc.join_code_hash = crypt(p_code, jc.join_code_hash)
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
  if not public.is_studio_admin_strict(p_studio_id) then
    raise exception 'not allowed';
  end if;

  insert into public.studio_join_codes (studio_id, join_code_hash, rotated_at)
  values (p_studio_id, crypt(p_code, gen_salt('bf')), now())
  on conflict (studio_id) do update
    set join_code_hash = excluded.join_code_hash,
        rotated_at = excluded.rotated_at;
end;
$$;

grant execute on function public.set_studio_join_code(uuid, text) to authenticated;
