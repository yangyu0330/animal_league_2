# 문서 정합성 점검

## 목표
- Day1~Day5 산출물 간 충돌을 제거한다.
- 2주차 착수 전 문서 기준선을 확정한다.

## 입력 자료
- [01_scope.md](./01_scope.md)
- [02_user_flow.md](./02_user_flow.md)
- [02_screen_map.md](./02_screen_map.md)
- [03_wireframes.md](./03_wireframes.md)
- [04_schema.md](./04_schema.md)
- [04_api_spec.md](./04_api_spec.md)
- [04_click_policy.md](./04_click_policy.md)
- [05_seed_data_plan.md](./05_seed_data_plan.md)
- [05_department_normalization.md](./05_department_normalization.md)

## 점검 매트릭스
| 점검 항목 | 기준 문서 | 결과 | 조치 |
|---|---|---|---|
| 공개 단위(학교+학과) | 01_scope | PASS | 유지 |
| 핵심 플로우(검색->상세->클릭) | 02_user_flow | PASS | 유지 |
| 화면 라우트와 API 매칭 | 02_screen_map, 04_api_spec | PASS | 유지 |
| `stack_count` 계산식 | 04_schema, 04_api_spec | PASS | 유지 |
| 압박 단계 구간 | 03_design_tokens, 04_schema | PASS | 단계값 고정 |
| 중복 등록 정책 | 05_department_normalization, 04_api_spec | PASS | 유지 |
| 오토클릭 제외 정책 | 04_click_policy, 04_schema | PASS | reason 코드 통일 |
| 시드 카테고리와 템플릿 ID | 05_seed_data_plan, 03_design_tokens | PASS | 템플릿 명명 규칙 유지 |

## 발견 이슈와 수정 내역
- `click_event.reason` 값이 문서마다 달랐던 문제를 Day 6에서 통일
  - 통일값: `OK`, `WARN_BURST`, `BURST_OVER_60`, `REPEATED_PATTERN`, `CLUSTER_PATTERN`, `SAFE_FALLBACK`
- 검색 화면 CTA 명칭 불일치 정리
  - 통일명: `새 학과 등록`

## 미해결 항목
- 없음

## 작업 내용
- [x] 문서 9종 교차 점검
- [x] 불일치 2건 수정
- [x] 미해결 항목 0건 확인

## 산출물
- `정합성 점검표`
- `불일치 수정 로그`

## 완료 기준
- [x] 핵심 정책/필드/용어 충돌 0건
- [x] 2주차 착수 시 질의 필요 항목 0건
