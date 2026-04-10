# API 명세

## 목표
- 2주차에 바로 구현 가능한 MVP API 계약을 확정한다.
- 프론트와 백엔드 간 필드명 충돌을 Week 1에서 제거한다.

## 입력 자료
- [04_schema.md](./04_schema.md)
- [02_screen_map.md](./02_screen_map.md)

## 공통 규칙
- Base URL: `/api`
- 인증: Supabase JWT (로그인 사용자만 접근 가능, 단 랜딩 샘플 랭킹은 공개 가능)
- 응답 시간 기준: 조회 API p95 400ms, 클릭 API p95 700ms
- 모든 응답은 `application/json`

## 1) 랭킹 조회
- `GET /api/rankings?scope=national|school&schoolId=<uuid>`
- 목적: 홈 랭킹/학교별 랭킹 표시
- 응답 예시
```json
{
  "scope": "national",
  "items": [
    {
      "rank": 1,
      "departmentId": "dep_123",
      "departmentName": "컴퓨터공학과",
      "schoolName": "OO대학교",
      "totalClicks": 12340,
      "stackCount": 12,
      "pressureLevel": 3
    }
  ],
  "generatedAt": "2026-04-11T10:30:00Z"
}
```

## 2) 학과 검색
- `GET /api/departments/search?q=<keyword>&schoolId=<uuid>&limit=20`
- 목적: 학과 검색/중복 등록 방지
- 응답 예시
```json
{
  "items": [
    {
      "departmentId": "dep_123",
      "name": "컴퓨터공학과",
      "schoolName": "OO대학교",
      "category": "공학",
      "totalClicks": 12340
    }
  ]
}
```

## 3) 학과 생성
- `POST /api/departments`
- 요청 본문
```json
{
  "schoolId": "school_uuid",
  "name": "컴퓨터공학과",
  "category": "공학",
  "templateId": "eng_default_01"
}
```
- 성공 응답
```json
{
  "departmentId": "dep_123",
  "created": true
}
```
- 중복 응답
```json
{
  "created": false,
  "reason": "DUPLICATE",
  "existingDepartmentId": "dep_100"
}
```

## 4) 학과 상세 조회
- `GET /api/departments/:id`
- 응답 예시
```json
{
  "departmentId": "dep_123",
  "departmentName": "컴퓨터공학과",
  "schoolName": "OO대학교",
  "category": "공학",
  "templateId": "eng_default_01",
  "totalClicks": 12340,
  "stackCount": 12,
  "pressureLevel": 3,
  "todayClicks": 901
}
```

## 5) 클릭
- `POST /api/departments/:id/click`
- 요청 본문
```json
{
  "deviceHash": "sha256_xxx",
  "refSource": "direct"
}
```
- 응답 예시
```json
{
  "accepted": true,
  "newTotalClicks": 12341,
  "stackCount": 12,
  "pressureLevel": 3
}
```

## 6) 내 활동
- `GET /api/me/activity?limit=20`
- 응답 예시
```json
{
  "todayCount": 27,
  "items": [
    {
      "departmentId": "dep_123",
      "departmentName": "컴퓨터공학과",
      "schoolName": "OO대학교",
      "accepted": true,
      "createdAt": "2026-04-11T09:20:00Z"
    }
  ]
}
```

## 오류 코드
- `UNAUTHORIZED`: 인증 없음
- `SCHOOL_NOT_SELECTED`: 학교 미선택
- `NOT_FOUND`: 학과 없음
- `DUPLICATE`: 중복 학과
- `RATE_LIMITED`: 오토클릭 의심으로 제외
- `VALIDATION_ERROR`: 입력 형식 오류
- `INTERNAL_ERROR`: 서버 내부 오류

## 작업 내용
- [x] 엔드포인트 6종 확정
- [x] 요청/응답 스키마 확정
- [x] 에러 코드 체계 확정

## 산출물
- `MVP API 계약 v1`
- `응답 필드 표준화 목록`

## 완료 기준
- [x] 프론트/백엔드가 동일 필드명으로 바로 개발 가능
- [x] 클릭/중복/인증 실패 상황의 응답 계약이 정의됨
