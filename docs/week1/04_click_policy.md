# 오토클릭 정책

## 목표
- 자유 클릭 경험은 유지하면서 자동화 클릭만 랭킹 합산에서 제외한다.
- 오탐이 나도 데이터 손실이 없도록 원본 이벤트는 모두 저장한다.

## 입력 자료
- [04_schema.md](./04_schema.md)
- [04_api_spec.md](./04_api_spec.md)

## 정책 원칙
- 클릭 차단이 아니라 `랭킹 합산 제외`가 기본 원칙
- 단일 신호로 판단하지 않고 계정/디바이스/IP 조합으로 판단
- 정상 사용자의 빠른 연타는 가능한 한 허용

## v1 감지 규칙
- Rule A (`WARN`)
  - 같은 `user_id + department_id`에서 10초 내 25회 초과
  - 처리: `accepted=true`, `reason=WARN_BURST`
- Rule B (`SUSPICIOUS`)
  - 같은 `user_id + department_id`에서 10초 내 60회 초과
  - 처리: 초과분부터 `accepted=false`, `reason=BURST_OVER_60`
- Rule C (`BOT_LIKE`)
  - 3분 연속으로 10초 윈도우마다 50회 이상 반복
  - 처리: 해당 구간 전체 `accepted=false`, `reason=REPEATED_PATTERN`
- Rule D (`NETWORK_CLUSTER`)
  - 같은 `ip_hash + device_hash` 조합으로 다계정 동시 burst 탐지
  - 처리: `accepted=false`, `reason=CLUSTER_PATTERN`

## 클릭 처리 순서
1. 요청 수신 후 `click_event` 임시 레코드 생성 준비
2. 최근 이벤트 조회로 규칙 평가
3. `accepted` 판정
4. 이벤트 저장
5. `accepted=true`일 때만 `department.total_clicks` 증가
6. 증가 후 `pressure_level` 재계산

## 운영 지표
- `accepted ratio` (수락률)
- `rate_limited count` (제외된 클릭 수)
- `top suspicious departments`
- `top suspicious users`

## 예외 처리
- 탐지 로직 오류 시 안전 모드로 `accepted=true` 처리 후 `reason=SAFE_FALLBACK`
- 특정 시간대 오탐 급증 시 임계값 일시 상향 가능

## 작업 내용
- [x] 탐지 규칙 4종 확정
- [x] 처리 순서 확정
- [x] 운영 모니터링 지표 확정

## 산출물
- `오토클릭 탐지 규칙 v1`
- `클릭 판정 플로우`

## 완료 기준
- [x] 자유 클릭 UX와 조작 방어가 동시에 성립
- [x] 제외 클릭도 사후 분석 가능하게 저장됨
