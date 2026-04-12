-- B-4: Seed baseline department data in Supabase.
-- Prerequisite: at least one app_user row must exist.

begin;

do $$
declare
  seed_owner uuid;
begin
  select id
    into seed_owner
  from app_user
  order by created_at asc
  limit 1;

  if seed_owner is null then
    raise exception 'No rows found in app_user. Sign in once before running this seed.';
  end if;
end $$;

with
seed_owner as (
  select id
  from app_user
  order by created_at asc
  limit 1
),
seed_departments (
  school_id,
  department_name,
  category,
  template_id,
  total_clicks,
  today_clicks
) as (
  values
    ('0eaad6a1-72a5-44b8-8b7d-0ce9493a7e42'::uuid, 'Computer Science', 'engineering', 'eng_default_01', 12340, 901),
    ('0eaad6a1-72a5-44b8-8b7d-0ce9493a7e42'::uuid, 'Electrical Engineering', 'engineering', 'eng_default_01', 9880, 702),
    ('0eaad6a1-72a5-44b8-8b7d-0ce9493a7e42'::uuid, 'Mechanical Engineering', 'engineering', 'eng_default_01', 6420, 496),
    ('a936f670-2fb7-4482-ac19-45810ffdbf77'::uuid, 'Business Administration', 'engineering', 'eng_default_01', 11902, 844),
    ('a936f670-2fb7-4482-ac19-45810ffdbf77'::uuid, 'Industrial Engineering', 'engineering', 'eng_default_01', 3890, 267),
    ('a936f670-2fb7-4482-ac19-45810ffdbf77'::uuid, 'International Studies', 'engineering', 'eng_default_01', 3420, 229),
    ('e5d232ed-6335-4c3b-aa73-e1c3a36c3e5b'::uuid, 'Nursing', 'engineering', 'eng_default_01', 2890, 201),
    ('e5d232ed-6335-4c3b-aa73-e1c3a36c3e5b'::uuid, 'Visual Design', 'engineering', 'eng_default_01', 2455, 176),
    ('e5d232ed-6335-4c3b-aa73-e1c3a36c3e5b'::uuid, 'Korean Language and Literature', 'engineering', 'eng_default_01', 1880, 138),
    ('bde6bfb9-e055-423f-989f-f576f803dbd6'::uuid, 'Semiconductor Systems', 'engineering', 'eng_default_01', 4310, 305),
    ('bde6bfb9-e055-423f-989f-f576f803dbd6'::uuid, 'Psychology', 'engineering', 'eng_default_01', 4980, 384),
    ('bde6bfb9-e055-423f-989f-f576f803dbd6'::uuid, 'Aerospace Engineering', 'engineering', 'eng_default_01', 1670, 121)
),
normalized as (
  select
    d.school_id,
    d.department_name as name,
    regexp_replace(lower(d.department_name), E'[\\s\\-_.()/]', '', 'g') as normalized_name,
    d.category,
    d.template_id,
    d.total_clicks,
    d.today_clicks
  from seed_departments d
  join school s
    on s.id = d.school_id
),
upserted_departments as (
  insert into department (
    school_id,
    name,
    normalized_name,
    category,
    template_id,
    total_clicks,
    accepted_clicks,
    pressure_level,
    created_by
  )
  select
    n.school_id,
    n.name,
    n.normalized_name,
    n.category,
    n.template_id,
    n.total_clicks,
    n.total_clicks,
    case
      when n.total_clicks < 1000 then 0
      when n.total_clicks < 5000 then 1
      when n.total_clicks < 10000 then 2
      when n.total_clicks < 25000 then 3
      else 4
    end as pressure_level,
    o.id
  from normalized n
  cross join seed_owner o
  on conflict (school_id, normalized_name) do update
  set
    name = excluded.name,
    category = excluded.category,
    template_id = excluded.template_id,
    total_clicks = excluded.total_clicks,
    accepted_clicks = excluded.accepted_clicks,
    pressure_level = excluded.pressure_level
  returning id, school_id, name
)
insert into department_daily_stat (date, department_id, accepted_clicks)
select
  current_date,
  d.id,
  n.today_clicks
from upserted_departments d
join normalized n
  on n.school_id = d.school_id
 and n.name = d.name
on conflict (date, department_id) do update
set accepted_clicks = excluded.accepted_clicks;

commit;
