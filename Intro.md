# NotionAI Pet 🐾

> 노션 AI 캐릭터를 바탕화면에 상주시키고, 노션 워크스페이스의 활동을 실시간 말풍선으로 보여주는 데스크톱 펫 앱 (Windows / macOS)

---

## 1. 프로젝트 개요

**NotionAI Pet**은 데스크톱(Windows/macOS)에서 항상 최상위(Always-on-Top)로 떠 있는 투명 창 위에 노션 AI 캐릭터를 렌더링하고, 노션 워크스페이스에서 일어나는 AI 활동(페이지 생성, 요약, 답변 작성 등)을 감지하여 캐릭터의 말풍선과 애니메이션으로 실시간 표현하는 앱입니다.

### 사용자 플로우
1. **로그인** — 앱 실행 시 로그인 화면에서 노션 계정(Integration Token)을 입력하여 로그인
2. **AI 권한 확인** — 시스템이 Notion AI API 사용 가능 여부를 확인하고, 확인 불가 시 안내 문구 또는 권한 획득 방법을 선택지로 제시
3. **메인 화면** — 로그인 완료 후 토글 스위치로 노션 펫 표시 여부를 선택

### 핵심 기능
- 🔐 **노션 계정 로그인**: Integration Token 검증 (Notion API `/v1/users/me`)
- ✅ **AI 권한 확인 단계**: API 접근성 검사 + 확인 불가 시 안내/권한 획득 가이드 제시
- 🖥️ **데스크톱 오버레이 펫**: 투명 배경 + 프레임리스 창으로 캐릭터만 바탕화면 위에 표시
- 💬 **실시간 말풍선**: 노션 AI의 행동 메시지를 말풍선 UI로 출력
- 🎭 **상태 기반 애니메이션**: 대기(idle) / 작업 중(working) / 말하기(talking) / 잠자기(sleeping)
- 🖱️ **인터랙션**: 드래그로 위치 이동, 클릭 시 반응, 우클릭 컨텍스트 메뉴(메인 화면 열기/위치 고정/종료)
- 📌 **위치 고정**: 우클릭 메뉴 토글로 드래그 이동 잠금 (localStorage에 영속화)
- 🔔 **트레이 상주**: 메인 창을 닫아도 트레이에서 백그라운드 실행, 펫 토글/종료 제어

---

## 2. 기술 스택

| 영역 | 기술 | 선정 이유 |
|---|---|---|
| **앱 프레임워크** | **Tauri 2.x** (Rust) | 상주형 앱에 필수적인 저메모리(~30MB), 투명/프레임리스/Always-on-Top 창 네이티브 지원, 작은 배포 용량(~10MB) |
| **프론트엔드** | **React 19 + TypeScript + Vite** | 로그인/설정 UI와 말풍선을 컴포넌트로 빠르게 개발 |
| **애니메이션** | **CSS Animation + PNG/SVG** | 노션 AI 캐릭터 이미지 + SVG 상태 소품(스파클/zzz/연필) 오버레이, 말풍선 pop-in 모션 |
| **상태 관리** | **Zustand** | 인증 플로우(login→ai-check→home) 및 펫 상태 머신 관리 |
| **네이티브 로직** | **Rust (Tauri Core)** | 시스템 트레이, 펫 창 표시/숨김 제어, 창 이벤트 처리 |
| **노션 연동** | **Notion API** + `tauri-plugin-http` | CORS 제약 없이 WebView에서 Notion REST API 호출 |
| **로컬 저장소** | **OS 자격 증명 저장소** (keyring — Windows Credential Manager / macOS Keychain) | 토큰 안전 보관, 사용자 정보·설정은 localStorage |
| **이벤트 통신** | **Tauri Event System (IPC)** | Rust ↔ 창 간 펫 표시 상태 동기화, 추후 AI 활동 push |
| **패키징** | **Tauri Bundler + GitHub Actions** | Windows(MSI/NSIS)·macOS(DMG) 설치 파일 생성, 태그 푸시 시 CI 자동 릴리스 |

### 대안 비교
| 프레임워크 | 메모리 | 배포 크기 | 판단 |
|---|---|---|---|
| **Tauri** ✅ | ~30MB | ~10MB | 상주 앱에 최적 |
| Electron | ~200MB+ | ~150MB | 개발은 쉬우나 상주 앱으로는 무거움 |
| WPF/.NET | ~50MB | ~50MB | 네이티브지만 웹 UI 생태계 활용 불가 |

---

## 3. 아키텍처 (2-윈도우 구조)

```
┌──────────────────────────────────────────────────────┐
│                   Tauri App (Rust Core)               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ 시스템 트레이  │  │ 창 제어 커맨드  │  │ Notion 폴러  │  │
│  │ (상주/토글/종료)│  │ set_pet_visible│ │ (Phase 3)   │  │
│  └─────────────┘  └──────┬───────┘  └──────┬──────┘  │
│                          │    Tauri IPC     │         │
│         ┌────────────────┴──────────┬──────┘         │
│         ▼                           ▼                 │
│  ┌──────────────────┐    ┌─────────────────────┐     │
│  │  main 창 (일반)    │    │  pet 창 (투명 오버레이) │     │
│  │  로그인 → AI 확인  │    │  캐릭터 + 말풍선       │     │
│  │  → 홈(펫 토글)     │    │  Always-on-Top       │     │
│  └──────────────────┘    └─────────────────────┘     │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     Notion API       │
              │ users/me, search 등  │
              └─────────────────────┘
```

### 동작 흐름
1. 앱 실행 → **main 창**에 로그인 화면 표시
2. 토큰 입력 → `verifyToken()`이 Notion API로 검증 → 사용자/워크스페이스 정보 획득
3. **AI 권한 확인 단계** — API 접근성 검사. Notion 공개 API에 AI 여부 조회 엔드포인트가 없어 확인 불가 시 안내 문구 + "권한 받는 방법 안내 / 계속 진행" 선택지 제시
4. **홈 화면** — 토글로 pet 창 표시/숨김 (`set_pet_visible` Rust 커맨드)
5. **pet 창** — 캐릭터 애니메이션 + 말풍선. 트레이 메뉴와 상태 동기화 (`pet-visibility-changed` 이벤트)
6. (Phase 3) Rust 폴링 워커가 노션 활동 감지 → 말풍선으로 push

---

## 4. 프로젝트 구조

```
notionai-pet/
├── src/                        # React 프론트엔드
│   ├── App.tsx                 # 창 label 기반 라우팅 (main/pet)
│   ├── assets/
│   │   └── notionai_character.png # 캐릭터 원본 이미지 (펫/로고/파비콘 공용)
│   ├── windows/
│   │   ├── MainWindow.tsx      # 로그인 → AI 확인 → 홈(펫 토글)
│   │   └── PetWindow.tsx       # 펫 오버레이 창 (우클릭 메뉴: 실행/위치 고정/종료)
│   ├── components/
│   │   ├── Pet.tsx             # 캐릭터 렌더러 (노션 AI 이미지 + 상태 소품 오버레이)
│   │   └── SpeechBubble.tsx    # 말풍선 컴포넌트
│   ├── stores/
│   │   ├── authStore.ts        # 인증 플로우 상태 (Zustand)
│   │   └── petStore.ts         # 펫 상태 머신 + 위치 고정 설정 (Zustand)
│   └── lib/
│       ├── notion.ts           # Notion API (verifyToken, checkAiAccess)
│       └── notionWatcher.ts    # 노션 활동 폴링 워처 (30초 주기)
├── src-tauri/                  # Rust 백엔드
│   ├── src/lib.rs              # 트레이, 창 제어 커맨드, 토큰 secure storage
│   ├── icons/                  # 앱/설치 파일 아이콘 (tauri icon으로 캐릭터 이미지에서 생성)
│   ├── capabilities/default.json # 권한 (Notion API 도메인 등)
│   └── tauri.conf.json         # 2-윈도우 설정 (main + pet 투명 오버레이), productName "NotionAI Pet"
├── .github/workflows/release.yml # 태그(v*) 푸시 시 Windows/macOS 릴리스 자동 빌드
├── README.md                   # 사용자 가이드 (설치/시작하기/FAQ)
└── Intro.md                    # 프로젝트/아키텍처 문서 (이 문서)
```

---

## 5. 핵심 기술 포인트

### 투명 오버레이 창 설정 (`tauri.conf.json`)
```json
{
  "label": "pet",
  "transparent": true,
  "decorations": false,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "resizable": false,
  "shadow": false,
  "visible": false
}
```

### 노션 AI 활동 감지 전략 (Phase 3)
| 방식 | 설명 | 비고 |
|---|---|---|
| **폴링 (1차 구현)** | `search` / `last_edited_time` 기준 변경 감지 (30초~1분 주기) | Notion API rate limit(초당 3회) 고려 |
| Webhook (확장) | Notion Webhook → 로컬 릴레이 서버 or 클라우드 함수 경유 | 실시간성 향상 |

### AI 권한 확인의 한계
Notion 공개 API에는 워크스페이스의 AI 기능 활성화 여부를 조회하는 엔드포인트가 없다. 따라서:
- API 접근 실패 → "unavailable" (권한 안내 제시)
- API 접근 성공 → "unknown" (확인 불가 안내 + 안내 보기/계속 진행 선택지)

---

## 6. 개발 로드맵

- [x] **Phase 1 — 기본기**: 2-윈도우 구조, 투명 오버레이 + 캐릭터 애니메이션 + 드래그 + 트레이
- [x] **Phase 2 — 인증/온보딩**: 로그인 화면, AI 권한 확인 단계, 홈 화면 펫 토글
- [x] **Phase 3 — 노션 연동**: 폴링 워커(`notionWatcher.ts`, 30초 주기) + 편집 페이지 추적 모드(8초 diff)로 작성 중인 내용 실시간 말풍선 미리보기
- [x] **Phase 4 — 폴리싱**: 상태별 애니메이션(잠자기/작업 중), 자동 시작(tauri-plugin-autostart), secure storage(Windows Credential Manager / macOS Keychain), MSI/NSIS 패키징
- [x] **Phase 5 — 배포/브랜딩**: macOS 지원 + GitHub Actions 릴리스 자동화, 노션 AI 캐릭터 이미지 적용(펫/앱 아이콘/트레이/파비콘/로고), 위치 고정 토글, 설치 앱 이름 "NotionAI Pet" (v0.4.0)

---

## 7. 요구 사항 & 실행

- Windows 10/11 (WebView2 Runtime — Win11 기본 내장) 또는 macOS 11+
- Rust toolchain + Node.js 18+ (개발 시)
- Notion Integration Token ([notion.so/my-integrations](https://www.notion.so/my-integrations))

```bash
npm install
npm run tauri dev    # 개발 실행
npm run tauri build  # MSI/NSIS(Windows)·DMG(macOS) 패키징
```

배포는 `v*` 태그를 푸시하면 GitHub Actions(release.yml)가 Windows/macOS 설치 파일을 빌드해 릴리스에 자동 업로드합니다.
