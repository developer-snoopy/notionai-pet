import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Pet from "../components/Pet";
import SpeechBubble from "../components/SpeechBubble";
import { usePetStore } from "../stores/petStore";
import { startNotionWatcher, activityMessage } from "../lib/notionWatcher";

const GREETINGS = [
  "안녕하세요! 노션 펫이에요 🐾",
  "노션 AI 소식을 전해드릴게요!",
  "오늘도 좋은 하루 보내세요 ✨",
];

const CLICK_MESSAGES = [
  "부르셨나요? 👀",
  "노션 AI 활동을 지켜보고 있어요!",
  "간지러워요~ 😆",
  "새 소식이 생기면 바로 알려드릴게요!",
];

export default function PetWindow() {
  const say = usePetStore((s) => s.say);
  const wake = usePetStore((s) => s.wake);
  const setBusy = usePetStore((s) => s.setBusy);

  useEffect(() => {
    say(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

    // secure storage의 토큰으로 노션 활동 감지 시작
    let stopWatcher: (() => void) | undefined;
    invoke<string | null>("load_token")
      .then((token) => {
        if (!token) return;
        stopWatcher = startNotionWatcher(token, {
          onActivity: (activity) => {
            say(activityMessage(activity), 5000);
          },
          // 작성 중인 페이지의 새 내용을 실시간 미리보기로 표시
          onProgress: ({ title, snippet }) => {
            say(`✍️ "${title}"\n${snippet}`, 6000);
          },
          onWorking: setBusy,
        });
      })
      .catch(() => {});

    return () => {
      stopWatcher?.();
    };
  }, [say, setBusy]);

  const handleClick = () => {
    wake();
    say(CLICK_MESSAGES[Math.floor(Math.random() * CLICK_MESSAGES.length)]);
  };

  // ── 우클릭 컨텍스트 메뉴 ──
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const locked = usePetStore((s) => s.locked);
  const setLocked = usePetStore((s) => s.setLocked);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 메뉴가 창 밖으로 나가지 않도록 위치 보정
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 150);
    setMenuPos({ x: Math.max(0, x), y: Math.max(0, y) });
  };

  const toggleLock = () => {
    closeMenu();
    const next = !locked;
    setLocked(next);
    say(next ? "여기 딱 있을게요! 📌" : "이제 자유롭게 옮길 수 있어요! 🖱️");
  };

  // ── 드래그 이동 ──
  // data-tauri-drag-region 속성은 클릭된 요소 자신에만 적용되고, 필요한
  // start-dragging 권한도 core:default에 없어 동작하지 않는다. 대신 마우스가
  // 임계값 이상 움직였을 때만 명시적으로 startDragging()을 호출해,
  // 클릭(대화/깨우기)과 드래그(이동)를 모두 지원한다.
  const handleMouseDown = (e: React.MouseEvent) => {
    if (locked || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".context-menu")) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const THRESHOLD = 4;

    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", cleanup);
    };
    const onMove = (me: MouseEvent) => {
      if (
        Math.abs(me.clientX - startX) > THRESHOLD ||
        Math.abs(me.clientY - startY) > THRESHOLD
      ) {
        cleanup();
        getCurrentWindow().startDragging().catch(() => {});
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", cleanup);
  };

  const openMain = async () => {
    closeMenu();
    await invoke("show_main");
  };

  const quitApp = async () => {
    await invoke("quit_app");
  };

  return (
    <div
      className="pet-window"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onClick={closeMenu}
    >
      <SpeechBubble />
      <Pet onClick={handleClick} />
      {menuPos && (
        <div
          className="context-menu"
          style={{ left: menuPos.x, top: menuPos.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button className="menu-item" onClick={openMain}>
            ▶️ 실행 (메인 화면)
          </button>
          <div className="menu-divider" />
          <button className="menu-item" onClick={toggleLock}>
            {locked ? "✔ " : ""}📌 위치 고정
          </button>
          <div className="menu-divider" />
          <button className="menu-item menu-quit" onClick={quitApp}>
            ⏻ 종료
          </button>
        </div>
      )}
    </div>
  );
}
