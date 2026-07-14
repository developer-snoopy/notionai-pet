import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import Pet from "../components/Pet";
import SpeechBubble from "../components/SpeechBubble";
import { usePetStore } from "../stores/petStore";
import { useCharacterStore, CharacterKind } from "../stores/characterStore";
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
  const kind = useCharacterStore((s) => s.kind);
  const setKind = useCharacterStore((s) => s.setKind);
  const pickCustomImage = useCharacterStore((s) => s.pickCustomImage);

  const closeMenu = useCallback(() => setMenuPos(null), []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 메뉴가 창 밖으로 나가지 않도록 위치 보정
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 190);
    setMenuPos({ x: Math.max(0, x), y: Math.max(0, y) });
  };

  const selectCharacter = async (next: CharacterKind) => {
    closeMenu();
    if (next === "custom") {
      try {
        const ok = await pickCustomImage();
        if (ok) say("새 모습 어때요? ✨");
      } catch (err) {
        say(err instanceof Error ? err.message : "이미지를 불러오지 못했어요 😢");
      }
      return;
    }
    setKind(next);
    say("새 모습 어때요? ✨");
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
      data-tauri-drag-region
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
          <div className="menu-label">캐릭터</div>
          <button className="menu-item" onClick={() => selectCharacter("page")}>
            {kind === "page" ? "✔ " : ""}📄 페이지
          </button>
          <button className="menu-item" onClick={() => selectCharacter("ghost")}>
            {kind === "ghost" ? "✔ " : ""}👻 고스트
          </button>
          <button className="menu-item" onClick={() => selectCharacter("custom")}>
            {kind === "custom" ? "✔ " : ""}🖼️ 내 이미지 선택…
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
