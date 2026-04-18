-- Apply after B-6.
-- Goal:
-- 1) Count every valid click request as accepted=true.
-- 2) Update department totals atomically in DB to avoid lost updates under rapid clicks.
-- 3) Keep combo tracking behavior for max-combo rankings.

alter table public.app_user
  add column if not exists max_combo integer not null default 0,
  add column if not exists current_combo integer not null default 0,
  add column if not exists combo_last_clicked_at timestamptz null;

create index if not exists idx_app_user_max_combo_desc
  on public.app_user (max_combo desc, id asc);

do $$
declare
  constraint_row record;
begin
  -- Align DB pressure level range with current app levels (0..6).
  for constraint_row in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'department'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%pressure_level%'
  loop
    execute format('alter table public.department drop constraint %I', constraint_row.conname);
  end loop;
end
$$;

alter table public.department
  add constraint department_pressure_level_check
  check (pressure_level between 0 and 6);

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
  now_ts timestamptz := now();
  next_combo integer;
  next_total_clicks integer;
  next_pressure_level integer;
begin
  -- Atomic increment + pressure sync in one update.
  update public.department as d
  set
    total_clicks = d.total_clicks + 1,
    pressure_level = case
      when d.total_clicks + 1 < 500 then 0
      when d.total_clicks + 1 < 1000 then 1
      when d.total_clicks + 1 < 1500 then 2
      when d.total_clicks + 1 < 2000 then 3
      when d.total_clicks + 1 < 2500 then 4
      when d.total_clicks + 1 < 3000 then 5
      else 6
    end
  where d.id = p_department_id
  returning d.total_clicks, d.pressure_level
  into next_total_clicks, next_pressure_level;

  if next_total_clicks is null then
    raise exception 'DEPARTMENT_NOT_FOUND';
  end if;

  insert into public.click_event (
    user_id,
    department_id,
    device_hash,
    ip_hash,
    accepted,
    reason,
    ref_source
  )
  values (
    p_user_id,
    p_department_id,
    p_device_hash,
    p_ip_hash,
    true,
    'OK',
    p_ref_source
  );

  insert into public.department_daily_stat (
    date,
    department_id,
    accepted_clicks
  )
  values (
    now_ts::date,
    p_department_id,
    1
  )
  on conflict (date, department_id)
  do update set
    accepted_clicks = public.department_daily_stat.accepted_clicks + 1;

  -- Keep combo tracking for rankings.
  update public.app_user
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
    update public.app_user
    set max_combo = greatest(max_combo, next_combo)
    where id = p_user_id;
  end if;

  return query
  select
    true::boolean,
    next_total_clicks::integer,
    floor(greatest(next_total_clicks, 0)::numeric / 1000)::integer,
    next_pressure_level::integer;
end;
$$;
