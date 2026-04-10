# 2주차 백엔드 계획서 - B-2

## 0. 시작 전에 공부할 것
### 이 문서를 읽는 사람이 꼭 알아야 하는 개념
- `HTTP 요청/응답`
  - `POST` 요청이 무엇인지
  - 요청 body에 JSON을 넣는 방법
  - 응답으로 `created`, `accepted` 같은 상태값을 주는 이유
- `CRUD 기초`
  - Create: 학과 생성
  - Read: 내 활동 조회
  - Update: 클릭 수 증가
  - 실제 기능이 DB 작업과 어떻게 연결되는지
- `PostgreSQL 쓰기 쿼리 기초`
  - `insert`, `update`, `returning`
  - 조건부 조회로 중복 검사하는 방식
  - 여러 단계 처리를 안전하게 묶어야 하는 이유
- `중복 처리 개념`
  - 왜 `school_id + normalized_name`으로 중복을 막는지
  - 사용자 입력값을 바로 저장하면 왜 위험한지
- `오토클릭/이상행동 탐지 기초`
  - rate limit이 무엇인지
  - burst pattern이 무엇인지
  - 정상 클릭과 자동 클릭을 어떻게 구분하는지
- `로그 저장 개념`
  - 왜 제외된 클릭도 `click_event`에 남기는지
  - `accepted=false`여도 데이터를 버리지 않는 이유
- `디버깅 기초`
  - 같은 요청을 여러 번 보내며 결과 비교하는 방법
  - 실패한 요청 body/response를 확인하는 방법

### B-2가 먼저 공부해야 하는 이유
- B-2는 실제 데이터가 바뀌는 구간을 담당한다.
- 쓰기 API는 실수하면 중복 생성, 잘못된 클릭 수 증가, 잘못된 차단이 바로 발생한다.
- 따라서 `입력 검증`, `중복 검사`, `insert/update`, `로그 기록`을 먼저 이해해야 한다.

### 우선순위
1. HTTP POST와 JSON body
2. `insert`, `update`, `returning`
3. 중복 검사와 정규화
4. 오토클릭 판정 규칙
5. 디버깅과 로그 확인

### 공부 후 스스로 설명할 수 있어야 하는 질문
- 왜 학과명을 정규화한 뒤 중복 검사를 해야 하나?
- 왜 `accepted=false`인 클릭도 저장해야 하나?
- 클릭 수를 올린 뒤 왜 `pressure_level`을 다시 계산해야 하나?
- `DUPLICATE` 응답은 언제 반환해야 하나?

## 1. 이번 주 목표
- B-2는 2주차에 쓰기 경로를 완성한다.
- 학과 생성, 클릭 처리, 오토클릭 판정, 내 활동 API를 구현해 사용자 행동이 실제 데이터로 누적되게 만든다.
- 금요일 종료 시점 기준으로 중복 등록, 클릭 반영, 제외 클릭 기록, 내 활동 조회가 모두 동작해야 한다.

## 2. 먼저 읽어야 할 문서
- [학과 과제 압박 랭킹 서비스 MVP 계획서](../../학과%20과제%20압박%20랭킹%20서비스%20MVP%20계획서.md)
- [Week 1 실행 인덱스](../week1/README.md)
- [API 명세](../week1/04_api_spec.md)
- [오토클릭 정책](../week1/04_click_policy.md)
- [학과명 정규화](../week1/05_department_normalization.md)
- [DB 스키마](../week1/04_schema.md)
- [2주차 태스크 분배](../week1/07_week2_tasks.md)

## 3. 본인 책임 범위
### 포함 범위
- `POST /api/departments`
- `POST /api/departments/:id/click`
- `GET /api/me/activity`
- 학과명 정규화 적용
- 중복 등록 시 `DUPLICATE` 응답 처리
- `click_event.accepted` / `reason` 판정
- `department.total_clicks` 증가
- `pressure_level` 재계산

### 제외 범위
- Google OAuth 연동
- `app_user` 생성과 학교 선택 저장
- `GET /api/rankings`
- `GET /api/departments/search`
- `GET /api/departments/:id`
- 시드 데이터 CSV 작성

## 4. 다른 담당자와 맞춰야 할 계약 필드
- `POST /api/departments`
  - 요청: `schoolId`, `name`, `category`, `templateId`
  - 성공 응답: `departmentId`, `created`
  - 중복 응답: `created`, `reason`, `existingDepartmentId`
- `POST /api/departments/:id/click`
  - 요청: `deviceHash`, `refSource`
  - 응답: `accepted`, `newTotalClicks`, `stackCount`, `pressureLevel`
- `GET /api/me/activity`
  - 응답: `todayCount`, `items[]`
  - `items[]`: `departmentId`, `departmentName`, `schoolName`, `accepted`, `createdAt`
- `click_event.reason`
  - `OK`, `WARN_BURST`, `BURST_OVER_60`, `REPEATED_PATTERN`, `CLUSTER_PATTERN`, `SAFE_FALLBACK`

## 5. 일자별 작업 계획
### 월요일
- [API 명세](../week1/04_api_spec.md)와 [DB 스키마](../week1/04_schema.md) 기준으로 쓰기 API 계약 확인
- route skeleton 작성
- 정규화 함수 위치와 공용 유틸 구조 결정

### 화요일
- `POST /api/departments` 구현
- 입력 학과명 정규화
- `school_id + normalized_name` 중복 조회
- 중복 시 기존 `departmentId` 반환

### 수요일
- `POST /api/departments/:id/click` 기본 흐름 구현
- `click_event` 저장
- `accepted=true`일 때만 `department.total_clicks` 증가
- 증가 후 `pressure_level` 재계산

### 목요일
- [오토클릭 정책](../week1/04_click_policy.md)의 Rule A~D 적용
- `reason` 코드 저장
- `GET /api/me/activity` 구현
- 오늘 클릭 수 집계와 최근 클릭 20건 조회

### 금요일
- B-1 조회 API와 통합 확인
- 클릭 후 상세/랭킹 반영 동작 점검
- 오탐/중복 등록 예외 수정
- 응답 예시 JSON 정리

## 6. 의존성
- B-1의 스키마 반영이 선행되어야 한다
- B-1의 `app_user` 생성 흐름이 먼저 안정화되어야 클릭 저장이 가능하다
- 클릭 후 상세/랭킹 반영 확인은 B-1의 조회 API와 함께 검증해야 한다

## 7. 테스트 체크리스트
- [ ] `POST /api/departments`가 새 학과를 생성한다
- [ ] 중복 학과 등록 시 `created=false`, `reason=DUPLICATE`, `existingDepartmentId`를 반환한다
- [ ] `POST /api/departments/:id/click`가 정상 클릭 시 `accepted=true`를 반환한다
- [ ] 제외 클릭도 `click_event`에 저장된다
- [ ] `accepted=false` 클릭은 랭킹 합산에서 빠진다
- [ ] 클릭 후 `pressureLevel`이 구간 규칙대로 계산된다
- [ ] `GET /api/me/activity`가 최근 클릭 20건과 `todayCount`를 반환한다
- [ ] 존재하지 않는 학과에 클릭 요청 시 `NOT_FOUND`를 반환한다

## 8. 완료 기준
- 중복 학과 등록 처리와 정규화 로직이 동작한다
- 클릭 API가 [API 명세](../week1/04_api_spec.md)의 필드명 그대로 응답한다
- 오토클릭 제외 규칙이 최소 Rule A~D까지 반영된다
- 내 활동 API가 최근 클릭과 오늘 클릭 수를 정상 반환한다

## 9. 산출물
- 학과 생성 API 완료
- 클릭 API 완료
- 오토클릭 판정 로직 완료
- 내 활동 API 완료
- B-1/프론트 연동용 응답 예시 JSON 정리

## 10. 공부 체크리스트
- [ ] POST 요청 body를 읽고 검증하는 흐름을 이해한다
- [ ] `insert` 후 생성된 ID를 반환하는 이유를 설명할 수 있다
- [ ] 정규화와 중복 검사의 차이를 설명할 수 있다
- [ ] `accepted=true`와 `accepted=false`가 랭킹에 어떤 차이를 만드는지 설명할 수 있다
- [ ] 오토클릭 Rule A~D의 차이를 문서 없이 설명할 수 있다
