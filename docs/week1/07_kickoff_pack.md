# 킥오프 패키지

## 목표
- 2주차 첫 회의에서 즉시 개발에 착수할 수 있도록 필수 자료를 묶는다.
- 읽기 순서와 회의 안건을 고정해 커뮤니케이션 비용을 줄인다.

## 입력 자료
- [README.md](./README.md)
- [06_consistency_check.md](./06_consistency_check.md)
- [06_risks.md](./06_risks.md)
- [07_week2_tasks.md](./07_week2_tasks.md)

## 팀원 배포 패키지
1. `01_scope.md` - MVP 범위/제외 항목
2. `02_user_flow.md` - 핵심 사용자 여정
3. `02_screen_map.md` - 라우트/화면 매핑
4. `03_wireframes.md` - 화면 구현 기준
5. `03_design_tokens.md` - UI 토큰
6. `04_schema.md` - DB 스키마
7. `04_api_spec.md` - API 계약
8. `04_click_policy.md` - 오토클릭 정책
9. `05_seed_data_plan.md` - 시드 데이터 가이드
10. `07_week2_tasks.md` - 개인별 착수 태스크

## 2주차 킥오프 회의안 (60분)
- 0~10분: MVP 범위 재확인
- 10~25분: 화면/플로우 설명
- 25~40분: DB/API 확정안 검토
- 40~50분: 리스크와 우선순위 확인
- 50~60분: 개인별 첫 태스크 확정

## 용어 사전
- `accepted click`: 랭킹 합산 대상 클릭
- `stack count`: `floor(total_clicks / 1000)` 결과값
- `pressure level`: 총 클릭 수 기반 0~4 단계
- `seed data`: 초기 탑재 학교/학과 데이터

## 환경 준비 체크리스트
- [x] Supabase 프로젝트 생성
- [x] Vercel 프로젝트 생성
- [x] 공용 환경변수 목록 문서화
- [x] Google OAuth Redirect URI 목록 공유
- [x] 에러 모니터링(Sentry) 프로젝트 준비

## 작업 내용
- [x] 공유 문서 패키징
- [x] 회의 진행안 작성
- [x] 용어 사전 작성

## 산출물
- `Week2 킥오프 패키지`
- `회의 진행안 60분 버전`

## 완료 기준
- [x] 팀원이 30분 내 읽고 첫 구현 태스크를 시작할 수 있음
- [x] 킥오프 회의에서 추가 범위 논쟁이 발생하지 않음
