# DB 스키마

## 목표
- 2주차에 Supabase 테이블을 바로 생성할 수 있도록 스키마를 확정한다.
- 랭킹/클릭/중복등록 정책을 DB 제약조건으로 강제한다.

## 입력 자료
- [01_scope.md](./01_scope.md)
- [04_api_spec.md](./04_api_spec.md)

## 엔티티 개요
- `school`: 학교 기준 마스터
- `app_user`: 서비스 사용자 프로필
- `department`: 학과 및 집계 수치
- `click_event`: 클릭 원본 로그
- `department_daily_stat`: 일별 집계 테이블

## SQL 초안 (Postgres / Supabase)
```sql
create extension if not exists pgcrypto;

create table school (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  is_seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create table app_user (
  id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'google',
  nickname text not null,
  selected_school_id uuid references school(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table department (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references school(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  category text not null,
  template_id text not null,
  total_clicks integer not null default 0 check (total_clicks >= 0),
  accepted_clicks integer not null default 0 check (accepted_clicks >= 0),
  pressure_level smallint not null default 0 check (pressure_level between 0 and 4),
  created_by uuid not null references app_user(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (school_id, normalized_name)
);

create table click_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  department_id uuid not null references department(id) on delete cascade,
  device_hash text not null,
  ip_hash text not null,
  accepted boolean not null,
  reason text not null,
  ref_source text not null default 'direct',
  created_at timestamptz not null default now()
);

create table department_daily_stat (
  date date not null,
  department_id uuid not null references department(id) on delete cascade,
  accepted_clicks integer not null default 0 check (accepted_clicks >= 0),
  primary key (date, department_id)
);

create index idx_department_school_clicks on department (school_id, total_clicks desc);
create index idx_click_event_department_time on click_event (department_id, created_at desc);
create index idx_click_event_user_time on click_event (user_id, created_at desc);
create index idx_click_event_detection on click_event (user_id, device_hash, ip_hash, created_at desc);
```

## 집계 계산 규칙
- `stack_count = floor(total_clicks / 1000)` (조회 시 계산)
- `pressure_level` 계산식
  - `0`: `< 1000`
  - `1`: `1000 <= total_clicks < 5000`
  - `2`: `5000 <= total_clicks < 10000`
  - `3`: `10000 <= total_clicks < 25000`
  - `4`: `>= 25000`

## 정책
- 학과 중복 등록 차단은 DB 유니크 제약으로 1차 방어
- 클릭은 모두 `click_event`에 저장하되 `accepted=false`는 랭킹 합산 제외
- 개인식별 원문 IP는 저장하지 않고 해시만 저장

## 작업 내용
- [x] 테이블 5종 스키마 확정
- [x] 유니크/체크/인덱스 확정
- [x] 집계 계산식 확정

## 산출물
- `Supabase 반영 가능한 SQL 초안`
- `집계 계산 규칙`

## 완료 기준
- [x] 백엔드 담당이 추가 질문 없이 테이블 생성 가능
- [x] 중복 등록/수치 음수/단계 범위 오류가 DB 레벨에서 차단됨
