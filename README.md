# NotionAI Pet 🐾

> 노션 AI 캐릭터가 바탕화면 위에 떠다니며, 노션 워크스페이스의 활동을 실시간 말풍선으로 알려주는 데스크톱 펫 앱 (Windows / macOS)

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20%7C%20macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 무엇을 하는 앱인가요?

**NotionAI Pet**은 항상 최상위(Always-on-Top)에 떠 있는 투명 창 위에 귀여운 고스트 캐릭터를 표시하고, 노션 워크스페이스에서 일어나는 활동(페이지 생성·편집 등)을 감지해 캐릭터의 말풍선과 애니메이션으로 실시간 알려줍니다.

- 💬 **실시간 말풍선** — 노션 페이지가 만들어지거나 편집되면 펫이 바로 알려줘요
- 🎭 **상태 애니메이션** — 대기 / 작업 중 / 말하기 / 잠자기 (90초 동안 아무 일 없으면 잠들어요)
- 🖱️ **인터랙션** — 드래그로 어디든 이동, 클릭하면 반응(자고 있으면 깨어나요)
- 🔔 **트레이 상주** — 창을 닫아도 시스템 트레이에서 계속 실행
- 🔐 **안전한 토큰 보관** — Notion 토큰은 OS 보안 저장소(Windows 자격 증명 관리자 / macOS 키체인)에 암호화 저장

---

## 📥 설치하기

> **요구 사항**
> - **Windows**: Windows 10/11 (x64) + WebView2 Runtime (Windows 11은 기본 내장, Windows 10은 설치 시 자동 안내)
> - **macOS**: macOS 11 (Big Sur) 이상 — Apple Silicon / Intel 모두 지원

### 방법 1 — 설치 파일 다운로드 (권장)

1. [**Releases**](https://github.com/developer-snoopy/notionai-pet/releases/latest) 페이지를 엽니다.
2. **Assets**에서 운영체제에 맞는 파일을 내려받아 실행합니다.

   | OS | 파일 | 비고 |
   |---|---|---|
   | Windows (x64) | `notionai-pet_0.3.0_x64-setup.exe` | NSIS 설치 파일 (권장) |
   | Windows (x64) | `notionai-pet_0.3.0_x64_en-US.msi` | MSI 설치 파일 |
   | macOS (Apple Silicon) | `notionai-pet_0.3.0_aarch64.dmg` | M1/M2/M3/M4 |
   | macOS (Intel) | `notionai-pet_0.3.0_x64.dmg` | Intel Mac |

3. 설치 안내에 따라 진행하면 앱이 설치됩니다. (Windows: 시작 메뉴 등록, macOS: Applications 폴더로 드래그)

> 💡 **Windows**: 서명되지 않은 앱이라 SmartScreen 경고가 뜰 수 있습니다. **추가 정보 → 실행**을 누르면 설치할 수 있습니다.
>
> 💡 **macOS**: 서명되지 않은 앱이라 처음 실행 시 차단될 수 있습니다. **Finder에서 앱을 우클릭 → 열기**를 선택하거나, 터미널에서 아래 명령으로 격리 속성을 제거하세요.
> ```bash
> xattr -dr com.apple.quarantine /Applications/notionai-pet.app
> ```

### 방법 2 — 명령줄(Command Line)로 설치

**Windows** — PowerShell을 열고 아래를 실행하세요.

**NSIS 설치 파일 (자동 설치)**

```powershell
# 다운로드
Invoke-WebRequest -Uri "https://github.com/developer-snoopy/notionai-pet/releases/download/v0.3.0/notionai-pet_0.3.0_x64-setup.exe" -OutFile "$env:TEMP\notionai-pet-setup.exe"

# 무인(silent) 설치
& "$env:TEMP\notionai-pet-setup.exe" /S
```

**MSI 설치 파일 (msiexec)**

```powershell
# 다운로드
Invoke-WebRequest -Uri "https://github.com/developer-snoopy/notionai-pet/releases/download/v0.3.0/notionai-pet_0.3.0_x64_en-US.msi" -OutFile "$env:TEMP\notionai-pet.msi"

# 무인(silent) 설치
msiexec /i "$env:TEMP\notionai-pet.msi" /qn
```

**GitHub CLI를 사용하는 경우**

```powershell
gh release download v0.3.0 --repo developer-snoopy/notionai-pet --pattern "*.msi" --dir "$env:TEMP"
msiexec /i "$env:TEMP\notionai-pet_0.3.0_x64_en-US.msi" /qn
```

제거는 **설정 → 앱 → notionai-pet → 제거** 또는 `msiexec /x "$env:TEMP\notionai-pet.msi" /qn` 으로 할 수 있습니다.

**macOS** — 터미널을 열고 아래를 실행하세요. (Apple Silicon은 `aarch64`, Intel은 `x64`)

```bash
# 다운로드 (Apple Silicon 기준)
curl -L -o /tmp/notionai-pet.dmg \
  "https://github.com/developer-snoopy/notionai-pet/releases/download/v0.3.0/notionai-pet_0.3.0_aarch64.dmg"

# 마운트 후 Applications로 복사
hdiutil attach /tmp/notionai-pet.dmg
cp -R "/Volumes/notionai-pet/notionai-pet.app" /Applications/
hdiutil detach "/Volumes/notionai-pet"

# Gatekeeper 격리 속성 제거 (서명되지 않은 앱)
xattr -dr com.apple.quarantine /Applications/notionai-pet.app
```

제거는 `/Applications/notionai-pet.app`을 휴지통으로 옮기면 됩니다.

### 방법 3 — 소스에서 직접 빌드

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

토큰은 이 기기의 OS 보안 저장소(Windows 자격 증명 관리자 / macOS 키체인)에만 저장되며 외부로 전송되지 않습니다.

### 3단계 — 펫 표시하기

홈 화면에서 **노션 펫 보이기** 토글을 켜면 바탕화면에 펫이 나타납니다! 🎉

---

## 🎮 사용법

| 하고 싶은 것 | 방법 |
|---|---|
| 펫 이동하기 | 펫을 드래그해서 원하는 위치로 이동 |
| 펫과 대화하기 | 펫을 클릭하면 랜덤 메시지로 반응 |
| 펫 우클릭 메뉴 | 펫을 우클릭하면 **실행(메인 화면) / 캐릭터 변경 / 종료** 메뉴 표시 |
| 캐릭터 바꾸기 | 펫 우클릭 → 캐릭터에서 📄 페이지 / 👻 고스트 / 🖼️ 내 이미지(PNG·JPG·GIF 등, 최대 4MB) 선택 |
| 잠든 펫 깨우기 | 펫을 클릭 |
| 펫 숨기기/보이기 | 홈 화면 토글 또는 트레이 아이콘 우클릭 → **펫 보이기/숨기기** |
| 메인 창 다시 열기 | 트레이 아이콘 우클릭 → **메인 화면 열기** |
| 부팅 시 자동 실행 | 홈 화면 → **시작 시 자동 실행** 토글 |
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
- 편집이 감지된 페이지는 **추적 모드**로 전환되어 8초 간격으로 본문을 비교(diff)하고, **새로 작성 중인 내용을 말풍선 미리보기**로 실시간 표시합니다. 추적 중에는 펫이 연필을 들고 작업 중 모션을 보여줍니다. ✍️
- 60초 동안 변화가 없으면 추적을 멈추고 평상시 감시로 돌아갑니다.
- 첫 실행 시에는 기준선만 수집하고, 이후 변경분부터 말풍선으로 알려줍니다.
- 감지 범위는 **통합이 연결된 페이지**로 한정됩니다 (1단계의 ⚠️ 참고).
- Notion 공개 API 특성상 편집 주체(AI/사람)는 구분되지 않으며, 연결된 페이지의 모든 변경이 표시됩니다.

## ❓ 자주 묻는 질문

**Q. "유효하지 않은 토큰" 오류가 나요.**
토큰 앞뒤 공백 없이 전체를 복사했는지, [my-integrations](https://www.notion.so/my-integrations)에서 토큰이 활성 상태인지 확인해주세요.

**Q. 펫이 아무 말도 하지 않아요.**
통합이 페이지에 연결되어 있는지 확인해주세요 (페이지 `···` → 연결 → 통합 추가). 연결된 페이지가 없으면 감지할 활동도 없습니다.

**Q. "Notion AI 권한을 확인할 수 없습니다"라고 떠요.**
Notion 공개 API에는 AI 기능 활성화 여부를 조회하는 엔드포인트가 없어 자동 확인이 불가합니다. 안내를 확인하고 **계속 진행하기**를 누르면 정상적으로 사용할 수 있습니다.

**Q. 토큰은 안전하게 보관되나요?**
네. 토큰은 OS 보안 저장소(Windows 자격 증명 관리자 / macOS 키체인)에 저장되며, 이 기기 밖으로 전송되지 않습니다. Notion API 호출에만 사용됩니다.

---

## 🛠 기술 스택

Tauri 2.x (Rust) · React 19 + TypeScript + Vite · Zustand · Notion API

프로젝트 구조와 아키텍처 상세는 [Intro.md](./Intro.md)를 참고하세요.
