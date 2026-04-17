-- Apply before deploying max-combo APIs/UI.
-- 1) Adds combo tracking columns to app_user.
-- 2) Wraps record_department_click RPC so combo stats are updated on every click_event write
--    (accepted=true/false regardless), while preserving existing click logic.

alter table app_user
  add column if not exists max_combo integer not null default 0,
  add column if not exists current_combo integer not null default 0,
  add column if not exists combo_last_clicked_at timestamptz null;

create index if not exists idx_app_user_max_combo_desc
  on app_user (max_combo desc, id asc);

-- Rename current implementation once so we can keep the original click policy logic.
do $$
declare
  has_original boolean;
  has_base boolean;
begin
  select exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_department_click'
      and pg_get_function_identity_arguments(p.oid) =
        'p_user_id uuid, p_department_id uuid, p_device_hash text, p_ip_hash text, p_ref_source text'
  ) into has_original;

  select exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_department_click_base'
      and pg_get_function_identity_arguments(p.oid) =
        'p_user_id uuid, p_department_id uuid, p_device_hash text, p_ip_hash text, p_ref_source text'
  ) into has_base;

  if has_original and not has_base then
    execute 'alter function public.record_department_click(uuid, uuid, text, text, text) rename to record_department_click_base';
  end if;
end
$$;

create or replace function public.record_department_click(
  p_user_id uuid,
  p_department_id uuid,
  p_device_hash text,
  p_ip_hash text,
  p_ref_source text
)
returns table(
  accepted boolean,
  new_total_clicks integer,
  stack_count integer,
  pressure_level integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  base_result record;
  now_ts timestamptz := now();
  next_combo integer;
begin
  -- Preserve existing click acceptance/anti-abuse policy from the original function.
  select *
  into base_result
  from public.record_department_click_base(
    p_user_id,
    p_department_id,
    p_device_hash,
    p_ip_hash,
    p_ref_source
  );

  if not found then
    raise exception 'record_department_click_base returned no row';
  end if;

  -- Combo updates run for every click_event write, accepted/denied regardless.
  update app_user
  set
    current_combo = case
      when combo_last_clicked_at is not null
        and now_ts - combo_last_clicked_at <= interval '2 seconds'
      then current_combo + 1
      else 1
    end,
    combo_last_clicked_at = now_ts
  where id = p_user_id
  returning current_combo into next_combo;

  if next_combo is not null then
    update app_user
    set max_combo = greatest(max_combo, next_combo)
    where id = p_user_id;
  end if;

  return query
  select
    base_result.accepted::boolean,
    base_result.new_total_clicks::integer,
    base_result.stack_count::integer,
    base_result.pressure_level::integer;
end;
$$;
