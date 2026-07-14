# NotionAI Pet 🐾

> 노션 AI 캐릭터가 바탕화면 위에 떠다니며, 노션 워크스페이스의 활동을 실시간 말풍선으로 알려주는 Windows 데스크톱 펫 앱

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 무엇을 하는 앱인가요?

**NotionAI Pet**은 항상 최상위(Always-on-Top)에 떠 있는 투명 창 위에 귀여운 고스트 캐릭터를 표시하고, 노션 워크스페이스에서 일어나는 활동(페이지 생성·편집 등)을 감지해 캐릭터의 말풍선과 애니메이션으로 실시간 알려줍니다.

- 💬 **실시간 말풍선** — 노션 페이지가 만들어지거나 편집되면 펫이 바로 알려줘요
- 🎭 **상태 애니메이션** — 대기 / 작업 중 / 말하기 / 잠자기 (90초 동안 아무 일 없으면 잠들어요)
- 🖱️ **인터랙션** — 드래그로 어디든 이동, 클릭하면 반응(자고 있으면 깨어나요)
- 🔔 **트레이 상주** — 창을 닫아도 시스템 트레이에서 계속 실행
- 🔐 **안전한 토큰 보관** — Notion 토큰은 Windows 자격 증명 관리자에 암호화 저장

---

## 📥 설치하기

### 방법 1 — 설치 파일 사용 (권장)

1. [Releases](https://github.com/developer-snoopy/notionai-pet/releases) 페이지에서 최신 설치 파일을 내려받습니다.
   - `notionai-pet_x.x.x_x64-setup.exe` (NSIS) 또는
   - `notionai-pet_x.x.x_x64_en-US.msi` (MSI)
2. 설치 파일을 실행하고 안내에 따라 설치합니다.

> **요구 사항**: Windows 10/11 + WebView2 Runtime (Windows 11은 기본 내장, Windows 10은 설치 시 자동 안내)

### 방법 2 — 소스에서 직접 빌드

<details>
<summary>펼쳐서 보기</summary>

**사전 준비물**: [Node.js 18+](https://nodejs.org), [Rust toolchain](https://rustup.rs)

```bash
git clone https://github.com/developer-snoopy/notionai-pet.git
cd notionai-pet
npm install
npm run tauri dev     # 개발 모드 실행
npm run tauri build   # 설치 파일 생성 (src-tauri/target/release/bundle/)
```

</details>

---

## 🚀 시작하기 (3단계)

### 1단계 — Notion Integration Token 발급

앱이 노션 워크스페이스를 읽으려면 **Integration Token**이 필요합니다.

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. **+ New integration** 클릭 → 이름 입력(예: `NotionAI Pet`) → 워크스페이스 선택
3. **Capabilities**에서 **Read content** 권한 활성화
4. 발급된 토큰(`ntn_...` 또는 `secret_...`)을 복사

> ⚠️ **중요**: 통합을 만든 뒤, 감지하고 싶은 노션 페이지에서 `···` 메뉴 → **연결(Connections)** → 방금 만든 통합을 추가해야 해당 페이지의 활동이 감지됩니다. 최상위 페이지에 연결하면 하위 페이지도 함께 접근됩니다.

### 2단계 — 로그인

1. 앱을 실행하면 로그인 화면이 나타납니다.
2. 복사한 토큰을 입력하고 **로그인**을 누릅니다.
3. AI 권한 확인 단계에서 안내를 확인한 뒤 **계속 진행하기**를 누릅니다.

토큰은 이 기기의 Windows 자격 증명 관리자에만 저장되며 외부로 전송되지 않습니다.

### 3단계 — 펫 표시하기

홈 화면에서 **노션 펫 보이기** 토글을 켜면 바탕화면에 펫이 나타납니다! 🎉

---

## 🎮 사용법

| 하고 싶은 것 | 방법 |
|---|---|
| 펫 이동하기 | 펫을 드래그해서 원하는 위치로 이동 |
| 펫과 대화하기 | 펫을 클릭하면 랜덤 메시지로 반응 |
| 잠든 펫 깨우기 | 펫을 클릭 |
| 펫 숨기기/보이기 | 홈 화면 토글 또는 트레이 아이콘 우클릭 → **펫 보이기/숨기기** |
| 메인 창 다시 열기 | 트레이 아이콘 우클릭 → **메인 화면 열기** |
| 부팅 시 자동 실행 | 홈 화면 → **윈도우 시작 시 자동 실행** 토글 |
| 로그아웃 | 홈 화면 하단 **로그아웃** (저장된 토큰도 삭제됩니다) |
| 앱 완전히 종료 | 트레이 아이콘 우클릭 → **종료** |

> 💡 메인 창의 ✕ 버튼을 눌러도 앱은 종료되지 않고 트레이에 계속 상주합니다.

### 펫의 상태

| 상태 | 모습 | 언제? |
|---|---|---|
| 대기 (idle) | 둥실둥실 떠다님 | 평상시 |
| 말하기 (talking) | 말풍선 + 몸 흔들기 | 노션 활동 감지, 클릭 반응 |
| 작업 중 (working) | 연필 들고 열심히 ✍️ | 작업 감지 중 |
| 잠자기 (sleeping) | 눈 감고 zzz 💤 | 90초 동안 활동이 없을 때 |

---

## 🔍 노션 활동 감지 방식

- 30초마다 Notion API(`/v1/search`)를 폴링하여 페이지·데이터베이스의 생성/편집을 감지합니다.
- 첫 실행 시에는 기준선만 수집하고, 이후 변경분부터 말풍선으로 알려줍니다.
- 감지 범위는 **통합이 연결된 페이지**로 한정됩니다 (1단계의 ⚠️ 참고).

## ❓ 자주 묻는 질문

**Q. "유효하지 않은 토큰" 오류가 나요.**
토큰 앞뒤 공백 없이 전체를 복사했는지, [my-integrations](https://www.notion.so/my-integrations)에서 토큰이 활성 상태인지 확인해주세요.

**Q. 펫이 아무 말도 하지 않아요.**
통합이 페이지에 연결되어 있는지 확인해주세요 (페이지 `···` → 연결 → 통합 추가). 연결된 페이지가 없으면 감지할 활동도 없습니다.

**Q. "Notion AI 권한을 확인할 수 없습니다"라고 떠요.**
Notion 공개 API에는 AI 기능 활성화 여부를 조회하는 엔드포인트가 없어 자동 확인이 불가합니다. 안내를 확인하고 **계속 진행하기**를 누르면 정상적으로 사용할 수 있습니다.

**Q. 토큰은 안전하게 보관되나요?**
네. 토큰은 Windows 자격 증명 관리자(Credential Manager)에 저장되며, 이 기기 밖으로 전송되지 않습니다. Notion API 호출에만 사용됩니다.

---

## 🛠 기술 스택

Tauri 2.x (Rust) · React 19 + TypeScript + Vite · Zustand · Notion API

프로젝트 구조와 아키텍처 상세는 [Intro.md](./Intro.md)를 참고하세요.
