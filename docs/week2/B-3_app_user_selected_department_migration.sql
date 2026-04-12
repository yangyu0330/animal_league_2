-- Apply before deploying profile persistence changes.
-- Adds selected department linkage for auth profile completion.

alter table app_user
  add column if not exists selected_department_id uuid references department(id);

create index if not exists idx_app_user_selected_department
  on app_user (selected_department_id);
