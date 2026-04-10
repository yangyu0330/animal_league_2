# 디자인 토큰

## 목표
- MVP UI 구현 속도를 위해 토큰 값을 고정하고 임의 스타일 결정을 막는다.
- 압박 단계 시각 변화가 일관되게 반영되도록 단계별 색상 체계를 정의한다.

## 입력 자료
- [03_wireframes.md](./03_wireframes.md)

## 스타일 방향
- 콘셉트: `캠퍼스 아케이드 계기판`
- 키워드: 강한 대비, 단순한 도형, 빠른 피드백
- 접근성: 본문 대비비 4.5:1 이상 유지

## 색상 토큰
```css
:root {
  --bg-main: #f7f4ed;
  --bg-card: #fffaf0;
  --bg-accent: #ffe5b4;
  --text-main: #1d1a17;
  --text-sub: #6b635a;
  --line: #d8cdbf;
  --brand: #c45012;
  --brand-strong: #8f3306;
  --ok: #1e8f4d;
  --warn: #e2a400;
  --danger: #b42318;
}
```

## 압박 단계 색상
- `level0`: `#d8f3dc`
- `level1`: `#ffe8a3`
- `level2`: `#ffc078`
- `level3`: `#ff922b`
- `level4`: `#e03131`

## 타이포 토큰
- 제목: `Space Grotesk`, 700, 22px, line-height 1.2
- 본문: `Pretendard`, 500, 15px, line-height 1.5
- 수치 강조: `Space Grotesk`, 700, 28px
- 캡션: `Pretendard`, 500, 12px

## 간격/라운드 토큰
- `space-1: 4px`
- `space-2: 8px`
- `space-3: 12px`
- `space-4: 16px`
- `space-5: 20px`
- `radius-card: 16px`
- `radius-button: 14px`

## 버튼 토큰
- Primary 버튼
  - 배경 `--brand`, 글자 `#ffffff`, 높이 `56px`
- Secondary 버튼
  - 배경 `transparent`, 테두리 `--line`
- Disabled 버튼
  - 배경 `#e7e0d7`, 글자 `#9a9187`

## 카드 토큰
- 랭킹 카드 높이 72px
- 마스코트 카드 최소 높이 220px
- 카드 그림자 `0 6px 14px rgba(29, 26, 23, 0.08)`

## 모션 토큰
- 클릭 증가 카운트업: 300ms ease-out
- 카드 등장: 180ms fade + 12px translateY
- 탭 전환: 140ms

## 작업 내용
- [x] 색상/타이포/간격 토큰 확정
- [x] 압박 단계별 시각 규칙 확정
- [x] 컴포넌트 공통 토큰 확정

## 산출물
- `디자인 토큰 v1`
- `압박 단계 시각 가이드`

## 완료 기준
- [x] 프론트 구현 시 임의 색상/폰트 선택이 발생하지 않음
- [x] 단계별 시각 변화가 토큰으로 직접 매핑됨
