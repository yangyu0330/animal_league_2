# B-2 화요일 실행 틀

## 1) 오늘 목표
- `POST /api/departments` 안정화
- 학과명 정규화 + 중복 처리(`DUPLICATE`) 검증
- 클릭/활동 API와 응답 계약 정합성 점검
- 수요일 작업(클릭 고도화)로 넘어가기 위한 기반 고정

## 2) 현재 상태 점검 (main 기준)
- 완료
- `POST /api/departments` 라우트 구현
- 정규화 기반 중복 등록 방지 구현
- `POST /api/departments/:id/click` 기본 처리 구현
- `GET /api/me/activity` 기본 조회 구현
- `GET /api/departments/search`, `GET /api/departments/:id` 구현

- 보완 필요
- 클릭 reason 코드가 문서의 전체 집합(`OK`, `WARN_BURST`, `BURST_OVER_60`, `REPEATED_PATTERN`, `CLUSTER_PATTERN`, `SAFE_FALLBACK`)과 아직 완전 일치하지 않음
- 안티어뷰징 Rule C/D(반복 패턴, 클러스터 패턴) 미구현
- 현재 저장소가 인메모리 상태(`store.ts`) 기반이며 DB 영속화 미적용
- 테스트 자동화(최소 API 단위 검증) 없음

## 3) 오늘 할 일 (우선순위)
1. API 계약 고정
- `docs/week1/04_api_spec.md`와 응답 필드/코드 1:1 맞추기
- reason 기본값 정책 확정 (`accepted=true`일 때 `OK` 포함 여부)

2. 입력/중복 검증 강화
- `POST /api/departments` 유효성 실패 케이스 명확화
- 중복 판단 키(`school_id + normalized_name`) 회귀 확인

3. 테스트/검증 최소 세트 만들기
- 성공 생성, 중복 생성, 클릭 성공, 클릭 제한, 없는 학과 클릭, 활동 조회
- 수동 검증용 curl(or REST client) 샘플 정리

4. 수요일 진입 준비
- 클릭 룰 엔진 확장 포인트 함수 분리(현재 로직 깨지지 않게)
- Rule C/D 구현용 TODO를 코드에 명시

## 4) 파일 단위 작업 틀
- `frontend/app/api/departments/route.ts`
- `frontend/app/api/departments/store.ts`
- `frontend/app/api/departments/[id]/click/route.ts`
- `frontend/app/api/me/activity/route.ts`
- `docs/week2/B-2_backend_writepath_plan.md` (체크리스트 반영)

## 5) 커밋 단위 틀
1. `chore(b2): align response contract and reason codes`
2. `test(b2): add manual/automated api verification cases`
3. `refactor(b2): extract click rule evaluator for rule c/d`

## 6) 완료 기준 (오늘)
- [ ] 생성 API가 정상/중복/검증실패를 일관된 JSON으로 반환
- [ ] 클릭 API가 최소 Rule A/B를 문서 코드와 맞게 반환
- [ ] 활동 API가 `todayCount` + 최신 항목 limit 반환
- [ ] API spec 대비 누락 필드/코드가 없음
- [ ] 내일 Rule C/D 구현 시작 가능한 구조로 분리 완료

## 7) 바로 실행 순서 (권장)
1. 브랜치 생성: `b2-tue-hardening`
2. 계약 정렬(응답 코드/필드) 수정
3. 수동 검증 6케이스 실행
4. 체크리스트 갱신 후 커밋
