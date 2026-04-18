-- Apply after B-7.
-- Goal: realign stored department.pressure_level values with total_clicks-based level thresholds (0..6).

begin;

-- Pre-check: rows currently out of sync.
select count(*) as mismatched_before
from public.department
where pressure_level is distinct from (
  case
    when total_clicks < 500 then 0
    when total_clicks < 1000 then 1
    when total_clicks < 1500 then 2
    when total_clicks < 2000 then 3
    when total_clicks < 2500 then 4
    when total_clicks < 3000 then 5
    else 6
  end
);

update public.department
set pressure_level = case
  when total_clicks < 500 then 0
  when total_clicks < 1000 then 1
  when total_clicks < 1500 then 2
  when total_clicks < 2000 then 3
  when total_clicks < 2500 then 4
  when total_clicks < 3000 then 5
  else 6
end
where pressure_level is distinct from (
  case
    when total_clicks < 500 then 0
    when total_clicks < 1000 then 1
    when total_clicks < 1500 then 2
    when total_clicks < 2000 then 3
    when total_clicks < 2500 then 4
    when total_clicks < 3000 then 5
    else 6
  end
);

-- Post-check: should become zero.
select count(*) as mismatched_after
from public.department
where pressure_level is distinct from (
  case
    when total_clicks < 500 then 0
    when total_clicks < 1000 then 1
    when total_clicks < 1500 then 2
    when total_clicks < 2000 then 3
    when total_clicks < 2500 then 4
    when total_clicks < 3000 then 5
    else 6
  end
);

commit;
