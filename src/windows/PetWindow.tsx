import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  useEffect(() => {
    say(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

    // secure storage의 토큰으로 노션 활동 감지 시작
    let stopWatcher: (() => void) | undefined;
    invoke<string | null>("load_token")
      .then((token) => {
        if (!token) return;
        stopWatcher = startNotionWatcher(token, (activity) => {
          say(activityMessage(activity), 5000);
        });
      })
      .catch(() => {});

    return () => {
      stopWatcher?.();
    };
  }, [say]);

  const handleClick = () => {
    wake();
    say(CLICK_MESSAGES[Math.floor(Math.random() * CLICK_MESSAGES.length)]);
  };

  return (
    <div className="pet-window" data-tauri-drag-region>
      <SpeechBubble />
      <Pet onClick={handleClick} />
    </div>
  );
}
