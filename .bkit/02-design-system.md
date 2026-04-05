# Design System

이 문서는 모든 섹션에 공통으로 적용될 디자인 및 렌더링 룰을 정의합니다.

## 1. Color Palette (CSS Variables)
더불어민주당의 신뢰성을 보여주는 일관된 컬러 팔레트를 강제로 사용합니다.
- `--blue-900: #001D3D` (헤더/오버레이 다크 틴트)
- `--blue-800: #002B5C`
- `--blue-700: #003D82`
- `--blue-600: #004EA2` (✨ **당 상징 메인 컬러: 민주블루**)
- `--blue-500: #0066CC`
- `--blue-400: #2196F3` (포인트 액센트 라이트블루)
- `--blue-50:  #F0F7FF` (가장 연한 활성 배경색)
- **무채색 계열**: `--gray-50`부터 `--gray-900`까지 배경색/텍스트 색상 단계별 정의.

## 2. Typography
- **글꼴**: Noto Sans KR, -apple-system 기반
- **가중치**:
  - `wght 300~400`: 본문 텍스트 
  - `wght 700~800`: 카드 제목 및 서브 헤더
  - `wght 900`: 히어로 섹션 후보자 이름표, 핵심 슬로건

## 3. Responsive Breakpoints
- **Mobile First**: 기본적으로 0~599px 환경에서 화면을 디자인 (`min-width` 기반 작성).
- **Tablet (`@media(min-width:600px)`)**: 그리드 요소들을 `2 columns` 뷰로 전환.
- **Desktop (`@media(min-width:960px)`)**: 메인 컨테이너 패딩 확장, `4 columns` 뷰 지원, 플로팅 토글 메뉴 대신 인라인 Nav 텍스트 디스플레이.

## 4. UI Patterns & Interactions
- 모든 인터랙티브 카드 (핵심 가치, 공약, 이력)는 hover시 `border-color: var(--blue-400)`를 가지며, 2~3px 위로 떠오르는 `transform: translateY` 트랜지션을 가져야 함.
- 버튼 요소에는 `border-radius: var(--radius-full)` (100px) 알약형 규격을 적용.
