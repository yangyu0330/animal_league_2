-- Apply after B-8.
-- Goal:
-- 1) Persist earned titles per user.
-- 2) Persist a selected representative title per user.

begin;

alter table public.app_user
  add column if not exists selected_title_key text null;

create table if not exists public.user_title_award (
  user_id uuid not null references public.app_user(id) on delete cascade,
  title_key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, title_key)
);

create index if not exists idx_user_title_award_user_id
  on public.user_title_award (user_id);

create index if not exists idx_user_title_award_earned_at_desc
  on public.user_title_award (earned_at desc);

-- Security: enable RLS and allow only authenticated access patterns used by the app.
alter table public.user_title_award enable row level security;

drop policy if exists user_title_award_select_authenticated on public.user_title_award;
create policy user_title_award_select_authenticated
  on public.user_title_award
  for select
  to authenticated
  using (true);

drop policy if exists user_title_award_insert_own on public.user_title_award;
create policy user_title_award_insert_own
  on public.user_title_award
  for insert
  to authenticated
  with check (user_id = auth.uid());

commit;
