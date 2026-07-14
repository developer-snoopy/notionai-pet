import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useAuthStore } from "../stores/authStore";
import { verifyToken, checkAiAccess, AiAccess } from "../lib/notion";

export default function MainWindow() {
  const step = useAuthStore((s) => s.step);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="main-window">
      <div className="logo">🐾</div>
      <h1>NotionAI Pet</h1>
      <p className="subtitle">
        노션 AI의 활동을 바탕화면 위 펫의 말풍선으로 만나보세요
      </p>
      {step === "loading" && (
        <div className="card" style={{ textAlign: "center" }}>
          <span
            className="spinner"
            style={{ borderTopColor: "#2383e2", borderColor: "#d3e5f5" }}
          />
        </div>
      )}
      {step === "login" && <LoginScreen />}
      {step === "ai-check" && <AiCheckScreen />}
      {step === "home" && <HomeScreen />}
    </div>
  );
}

/* 1단계: 노션 계정(Integration Token) 로그인 */
function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = await verifyToken(token.trim());
      await login(token.trim(), user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <label className="field-label">Notion Integration Token</label>
        <input
          className="text-input"
          type="password"
          placeholder="ntn_ 또는 secret_ 으로 시작하는 토큰"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading || !token.trim()}
        >
          {loading && <span className="spinner" />}
          {loading ? "확인 중..." : "로그인"}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>
      <p className="hint">
        토큰은{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            openUrl("https://www.notion.so/my-integrations");
          }}
        >
          notion.so/my-integrations
        </a>
        에서 발급할 수 있습니다.
        <br />
        토큰은 이 기기에만 저장되며 외부로 전송되지 않습니다.
      </p>
    </>
  );
}

/* 2단계: Notion AI API 사용 가능 여부 확인 */
function AiCheckScreen() {
  const token = useAuthStore((s) => s.token);
  const proceedToHome = useAuthStore((s) => s.proceedToHome);
  const logout = useAuthStore((s) => s.logout);
  const [access, setAccess] = useState<AiAccess | "checking">("checking");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!token) return;
    checkAiAccess(token).then(setAccess);
  }, [token]);

  if (access === "checking") {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <span className="spinner" style={{ borderTopColor: "#2383e2", borderColor: "#d3e5f5" }} />
        <p style={{ fontSize: 14, marginTop: 10 }}>
          Notion AI API 사용 가능 여부를 확인하고 있습니다...
        </p>
      </div>
    );
  }

  if (access === "available") {
    proceedToHome();
    return null;
  }

  return (
    <>
      <div className="notice-box">
        <strong>
          {access === "unavailable"
            ? "⚠️ Notion API에 접근할 수 없습니다"
            : "ℹ️ Notion AI 권한을 확인할 수 없습니다"}
        </strong>
        {access === "unavailable"
          ? "통합(Integration)에 콘텐츠 접근 권한이 없거나 네트워크에 문제가 있습니다."
          : "현재 Notion 공개 API로는 워크스페이스의 AI 기능 활성화 여부를 자동으로 확인할 수 없습니다. 아래 선택지 중 하나를 선택해주세요."}
        {showGuide && (
          <ol className="guide-steps">
            <li>Notion 워크스페이스 → 설정 → 요금제에서 Notion AI 사용 여부를 확인합니다.</li>
            <li>
              notion.so/my-integrations에서 통합에 &quot;콘텐츠 읽기&quot; 권한이
              부여되어 있는지 확인합니다.
            </li>
            <li>연동할 페이지에서 ··· → 연결 → 통합을 추가해 접근 권한을 부여합니다.</li>
          </ol>
        )}
      </div>
      <button className="btn btn-secondary" onClick={() => setShowGuide(!showGuide)}>
        {showGuide ? "안내 접기" : "권한을 받는 방법 안내 보기"}
      </button>
      <button className="btn btn-primary" onClick={proceedToHome}>
        확인했습니다. 계속 진행하기
      </button>
      <button className="logout-link" onClick={logout} style={{ marginTop: 16 }}>
        다른 계정으로 로그인
      </button>
    </>
  );
}

/* 3단계: 메인 화면 — 펫 표시 토글 */
function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [petVisible, setPetVisible] = useState(false);
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    invoke<boolean>("is_pet_visible").then(setPetVisible);
    isEnabled().then(setAutostart).catch(() => {});
    // 트레이 메뉴 등 다른 경로로 바뀐 표시 상태 동기화
    const unlisten = listen<boolean>("pet-visibility-changed", (e) =>
      setPetVisible(e.payload),
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const toggle = async () => {
    const next = !petVisible;
    setPetVisible(next);
    await invoke("set_pet_visible", { visible: next });
  };

  const toggleAutostart = async () => {
    const next = !autostart;
    setAutostart(next);
    try {
      if (next) await enable();
      else await disable();
    } catch {
      setAutostart(!next);
    }
  };

  const handleLogout = async () => {
    await invoke("set_pet_visible", { visible: false });
    logout();
  };

  return (
    <>
      <div className="card">
        <div className="profile">
          <div className="avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : "🤖"}
          </div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-workspace">
              {user?.workspaceName ?? "Notion 워크스페이스"}
            </div>
          </div>
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">노션 펫 보이기</div>
            <div className="toggle-desc">
              바탕화면 위에 펫을 표시합니다
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={petVisible} onChange={toggle} />
            <span className="slider" />
          </label>
        </div>
        <div className="toggle-row" style={{ marginTop: 16 }}>
          <div>
            <div className="toggle-label">윈도우 시작 시 자동 실행</div>
            <div className="toggle-desc">
              로그인하면 앱이 트레이에서 자동으로 시작됩니다
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={autostart}
              onChange={toggleAutostart}
            />
            <span className="slider" />
          </label>
        </div>
      </div>
      <p className="hint">
        이 창을 닫아도 앱은 트레이에서 계속 실행됩니다.
        <br />
        트레이 아이콘에서 펫 표시/종료를 제어할 수 있습니다.
      </p>
      <button className="logout-link" onClick={handleLogout}>
        로그아웃
      </button>
    </>
  );
}
