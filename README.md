# 🃏 누구카두 (NuguCard) ☕
# 🔗 [nugucard.site](https://nugucard.site) 👈 클릭
> **"오늘 커피는 누구카두로 결제할까? 더 이상 알바생에게 카드 뽑기를 부탁하지 마세요!"**
> 다같이 마실 메뉴를 고른 뒤 게임으로  박진감 넘치게 결제자를 정하는 어플리케이션입니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 통합 메뉴판 및 주문 시스템
- **다양한 카페 메뉴 통합**: 여러 카페의 메뉴를 '누구카두' 한 곳에서 간편하게 모아보고 장바구니에 담을 수 있습니다.
- **실시간 데이터 동기화**: Firebase를 통해 여러 명이 동시에 접속해도 각자의 주문 현황과 카트가 실시간으로 동기화됩니다.

### 2. 긴장감 넘치는 결제자 내기
- **핀볼 룰렛 게임**: 단순한 제비뽑기가 아닌, 핀볼 기반의 시각적인 룰렛 게임을 통해 결제자를 정합니다.
- **확률 조절 시스템**: "어제 내가 샀는데 오늘 또 걸리면 억울하니까!" 이전 게임에서 걸렸던 사람의 당첨 확률(공 개수)을 유동적으로 조절해 드립니다! 물론 수동으로 조절할 수도 있습니다.

### 3. 히스토리 및 상세 통계
- **누가 얼마나 냈어?**: 지난 모든 결제 및 주문 내역을 상세한 히스토리로 기록합니다.
- **개인별 통계 제공**: 유저별로 쓴 금액, 얻어먹은 금액(순이익), 당첨 횟수 등을 한눈에 파악할 수 있는 강력한 통계 대시보드를 제공합니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: `React 19`
- **Build Tool**: `Vite 7`
- **Language**: `TypeScript`
- **State Management**: `Zustand`
- **Styling**: `Tailwind CSS`

### Backend & Infrastructure
- **BaaS**: `Firebase` (Firestore, Hosting)

### Utilities
- **Icons**: `Lucide-React`
- **Physics**: `box2d-wasm` (룰렛 게임 엔진)

---

## 📁 폴더 구조 (Project Structure)

```text
src/
├── assets/             # 이미지 및 SVG 리소스
├── features/           # 도메인별 핵심 기능 로직 및 UI
│   ├── admin/          # 관리자 대시보드, 통계, 유저 승인 로직
│   ├── menu/           # 메뉴 데이터 관리 및 조회 기능
│   ├── order/          # 카트 관리, 주문 로직 및 관련 UI 컴포넌트
│   ├── roulette/       # 결제자 선정 핀볼/룰렛 게임 로직 및 UI
│   └── system/         # 전역 시스템 알림 및 공통 로직
├── pages/              # 서비스 주요 라우트 페이지 (Landing, Order, Admin)
├── shared/             # 공용 유틸리티, 타입 정의(Types), 범용 UI 컴포넌트
├── App.tsx             # 전역 라우팅 및 레이아웃 설정
└── main.tsx            # 애플리케이션 엔트리 포인트
```
---
## 📦 설치 및 실행 방법 (Getting Started)
### 1. 레포지토리 클론
```Bash
git clone [https://github.com/TJ-media/ssafy-coffee.git](https://github.com/TJ-media/ssafy-coffee.git)
cd ssafy-coffee
```
### 2. 의존성 설치
```Bash
npm install
```
### 3. 로컬 개발 서버 실행
```Bash
npm run dev
```
### 4. 빌드 및 배포
```Bash
# 빌드
npm run build

# 프리뷰
npm run preview
```
---
## 📄 라이선스 (License)
본 프로젝트의 소스코드 및 디자인에 대한 모든 권리는 제작자에게 있습니다.
해당 프로젝트의 코드를 참고하거나 사용하고 싶으신 경우, 아래의 연락처로 사전 문의 부탁드립니다.
📧 Contact: oganesson12@naver.com