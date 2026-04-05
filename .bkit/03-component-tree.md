# Component Architecture Tree

문서의 구조적 흐름과 렌더링될 Section들을 상단부터 하향식으로 정의합니다.

### 1. `.floating-nav` (Global Header)
- **로고**: 좌측 하현주 이름 명시
- **메뉴**: 데스크탑에서는 텍스트 링크, 모바일에서는 햄버거 토글(.nav-mobile-toggle) 사용
- **상태 관리**: 스크롤 다운 시 `.scrolled` 클래스 부여로 글래스모피즘 활성화

### 2. `#hero` (Hero Section)
- **배경**: `hero-bg.jpg` (국회의사당). `.hero-overlay`를 통해 투명도 85%의 민주블루 필터 코팅.
- **슬로건 텍스트**: 좌상단 독립 배치 (`.hero-quote`)
- **인물 영역**: 하단 중앙에 `.hero-portrait` 배치, 내부 사진은 `candidate.png` (퍼포먼스가 높은 누끼 사진) 사용
- **캐치프레이즈 배지**: 인물 옆/아래 블루 톤 배지로 "남동의 새로운변화 하현주" 명시

### 3. `.slogan-banner` (Marquee Banner)
- 모바일에서 동적인 느낌을 강조하기 위해 텍스트가 좌측으로 슬라이드 재생되는 띠 배너.

### 4. `#philosophy` (핵심가치)
- 4-Philosophy Grid: "소통정치, 공감정치, 실천정치, 책임정치"를 2x2(모바일 1x4) 형태의 카드로 나열.
- 각 카드는 숫자(`.phil-num`), 설명(`.phil-desc`), 타이틀(`.phil-title`)을 포함.

### 5. `#career` (이력 Section)
- 전직과 현직을 두 컬럼으로 분리하여 구조적 안정성과 권위 제공.

### 6. 그 외 향후 확장 컴포넌트
- 공약(Pledges), 갤러리(활동 내역), Contact(연락처 및 후원 폼).
- 모든 `.section`은 컴포넌트 간 일관된 여백 구조(Padding 48px~56px)를 지님.
