# 2주차 백엔드 계획서 - B-1

## 0. 시작 전에 공부할 것
### 이 문서를 읽는 사람이 꼭 알아야 하는 개념
- `HTTP 요청/응답`
  - `GET` 요청이 무엇인지
  - 상태 코드 `200`, `401`, `404`, `500`의 의미
  - JSON 응답 구조를 읽는 법
- `REST API 기초`
  - `GET /api/rankings`처럼 URL과 메서드로 기능을 구분하는 방식
  - 쿼리스트링 `?scope=national&schoolId=...` 읽는 법
- `Supabase 기초`
  - 프로젝트 생성
  - SQL Editor 사용법
  - Table Editor에서 데이터 확인하는 법
  - Auth와 Database가 어떻게 연결되는지
- `PostgreSQL 기초`
  - 테이블, 컬럼, primary key, foreign key, unique, index 의미
  - `select`, `where`, `order by`, `limit` 기본 문법
- `OAuth / Google 로그인 개념`
  - 사용자가 Google로 로그인하면 왜 `auth.users`에 기록되는지
  - 로그인된 사용자를 앱의 `app_user`와 왜 다시 연결해야 하는지
- `Next.js 백엔드 기초`
  - Route Handler 또는 서버 함수가 무엇인지
  - API 파일 하나가 엔드포인트 하나와 연결된다는 개념
- `디버깅 기초`
  - 요청이 실패했을 때 로그를 어디서 보고 무엇을 확인해야 하는지
  - 브라우저 Network 탭에서 응답 JSON 확인하는 법

### B-1이 먼저 공부해야 하는 이유
- B-1은 다른 사람이 쓸 기반을 먼저 만든다.
- 인증 흐름과 조회 API가 흔들리면 B-2와 프론트가 동시에 막힌다.
- 따라서 `로그인`, `DB 연결`, `조회 쿼리`, `응답 JSON`을 우선 이해해야 한다.

### 우선순위
1. HTTP 요청/응답과 JSON
2. Supabase Auth + Database 기본 구조
3. PostgreSQL `select` 쿼리
4. OAuth 로그인 흐름
5. Next.js API 처리 방식

### 공부 후 스스로 설명할 수 있어야 하는 질문
- 로그인한 사용자를 왜 `app_user`에 한 번 더 저장해야 하나?
- `school_id`는 왜 foreign key인가?
- `GET /api/rankings`는 어떤 값을 반환해야 하나?
- `UNAUTHORIZED`와 `SCHOOL_NOT_SELECTED`는 언제 다른가?

## 1. 이번 주 목표
- B-1은 2주차에 백엔드의 기반을 고정한다.
- Supabase 스키마, Google OAuth, 사용자 프로필 저장, 조회 API 3종을 완료해 B-2와 프론트가 바로 붙을 수 있게 한다.
- 금요일 종료 시점 기준으로 B-2가 추가 스키마 질문 없이 쓰기 API를 구현할 수 있어야 한다.

## 2. 먼저 읽어야 할 문서
- [학과 과제 압박 랭킹 서비스 MVP 계획서](../../학과%20과제%20압박%20랭킹%20서비스%20MVP%20계획서.md)
- [Week 1 실행 인덱스](../week1/README.md)
- [DB 스키마](../week1/04_schema.md)
- [API 명세](../week1/04_api_spec.md)
- [사용자 흐름](../week1/02_user_flow.md)
- [화면 구조도](../week1/02_screen_map.md)
- [2주차 태스크 분배](../week1/07_week2_tasks.md)

## 3. 본인 책임 범위
### 포함 범위
- Supabase 프로젝트 연결과 DB 스키마 반영
- `school`, `app_user`, `department`, `click_event`, `department_daily_stat` 테이블 생성
- Google OAuth 로그인 연동
- 로그인 후 `app_user` upsert
- 학교 선택값 `selected_school_id` 저장
- `GET /api/rankings`
- `GET /api/departments/search`
- `GET /api/departments/:id`
- 공통 조회 타입과 쿼리 헬퍼 정의

### 제외 범위
- `POST /api/departments`
- `POST /api/departments/:id/click`
- `GET /api/me/activity`
- 오토클릭 판정 규칙 구현
- 학과명 정규화 로직 구현

## 4. 다른 담당자와 맞춰야 할 계약 필드
- `GET /api/rankings`
  - `rank`, `departmentId`, `departmentName`, `schoolName`, `totalClicks`, `stackCount`, `pressureLevel`
- `GET /api/departments/search`
  - `departmentId`, `name`, `schoolName`, `category`, `totalClicks`
- `GET /api/departments/:id`
  - `departmentId`, `departmentName`, `schoolName`, `category`, `templateId`, `totalClicks`, `stackCount`, `pressureLevel`, `todayClicks`
- 인증 상태
  - 미인증 요청은 `UNAUTHORIZED`
  - 학교 미선택 상태에서 보호 라우트 접근 시 `SCHOOL_NOT_SELECTED`

## 5. 일자별 작업 계획
### 월요일
- Supabase 프로젝트 연결
- [DB 스키마](../week1/04_schema.md) 기준으로 5개 테이블 생성
- 인덱스, 유니크 제약, 체크 제약 반영
- 샘플 학교 데이터 3건으로 조회 테스트

### 화요일
- Google OAuth 연결
- 로그인 시 `auth.users`와 `app_user` 연결
- `app_user` upsert 처리
- 학교 선택 저장 로직 작성
- 로그인 후 학교 선택 유지 여부 확인

### 수요일
- `GET /api/rankings` 구현
- `scope=national|school` 분기 처리
- `stackCount = floor(totalClicks / 1000)` 계산 반영
- `pressureLevel` 계산 반영

### 목요일
- `GET /api/departments/search` 구현
- `schoolId`, `q`, `limit=20` 조건 반영
- `GET /api/departments/:id` 구현
- 상세 응답에 `todayClicks` 포함

### 금요일
- 프론트와 연결해 응답 필드명 확인
- B-2와 스키마/응답 계약 교차 점검
- 에러 코드와 null 처리 방식 정리
- 남은 불일치 수정

## 6. 의존성
- B-2는 B-1의 스키마 반영 완료 후 쓰기 API를 안정적으로 구현할 수 있다.
- 프론트 상세 화면은 `GET /api/departments/:id` 완료 후 붙일 수 있다.
- 홈 화면 랭킹 카드는 `GET /api/rankings` 완료가 선행되어야 한다.

## 7. 테스트 체크리스트
- [ ] Google 로그인 후 `app_user` 레코드가 생성된다
- [ ] 재로그인 시 학교 선택값이 유지된다
- [ ] `GET /api/rankings?scope=national`이 정렬된 결과를 반환한다
- [ ] `GET /api/rankings?scope=school&schoolId=`가 학교별 결과만 반환한다
- [ ] `GET /api/departments/search`가 `schoolId`와 `limit=20`을 지킨다
- [ ] `GET /api/departments/:id`가 `todayClicks`, `stackCount`, `pressureLevel`을 정확히 반환한다
- [ ] 잘못된 학과 ID에 `NOT_FOUND`를 반환한다
- [ ] 미인증 요청에 `UNAUTHORIZED`를 반환한다

## 8. 완료 기준
- Supabase 스키마가 운영 가능한 상태로 반영된다
- 로그인 후 학교 선택 저장 흐름이 동작한다
- 조회 API 3종이 [API 명세](../week1/04_api_spec.md)의 필드명과 동일하게 응답한다
- B-2가 쓰기 경로 구현 시 스키마/응답 관련 추가 질문이 없다

## 9. 산출물
- 스키마 반영 완료
- 인증 흐름 완료
- 조회 API 3종 완료
- 프론트/B-2 연동용 응답 예시 JSON 정리

## 10. 공부 체크리스트
- [ ] Postman 또는 브라우저에서 GET 요청 결과 JSON을 읽을 수 있다
- [ ] Supabase SQL Editor에서 `select * from school limit 5;`를 실행할 수 있다
- [ ] `primary key`, `foreign key`, `unique index` 차이를 설명할 수 있다
- [ ] Google 로그인 후 사용자 정보가 어디에 저장되는지 설명할 수 있다
- [ ] 랭킹 API 응답 필드를 문서 없이 말할 수 있다
