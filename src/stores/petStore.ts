import { create } from "zustand";

export type PetState = "idle" | "working" | "talking" | "sleeping";

interface PetStore {
  state: PetState;
  message: string | null;
  busy: boolean;
  say: (message: string, durationMs?: number) => void;
  setState: (state: PetState) => void;
  setBusy: (busy: boolean) => void;
  wake: () => void;
}

const SLEEP_AFTER_MS = 90_000; // 무활동 90초 후 잠들기
const MAX_QUEUE = 3; // 말풍선 대기열 상한 (오래된 것부터 버림)

let bubbleTimer: number | undefined;
let sleepTimer: number | undefined;
const messageQueue: Array<{ message: string; durationMs: number }> = [];

export const usePetStore = create<PetStore>((set, get) => {
  const scheduleSleep = () => {
    if (sleepTimer) window.clearTimeout(sleepTimer);
    sleepTimer = window.setTimeout(() => {
      if (get().state === "idle") set({ state: "sleeping" });
    }, SLEEP_AFTER_MS);
  };

  const showNext = () => {
    const next = messageQueue.shift();
    if (!next) {
      // 작업 추적 중이면 말풍선이 사라져도 working 상태 유지
      if (get().busy) {
        set({ message: null, state: "working" });
      } else {
        set({ message: null, state: "idle" });
        scheduleSleep();
      }
      return;
    }
    set({ message: next.message, state: "talking" });
    bubbleTimer = window.setTimeout(showNext, next.durationMs);
  };

  scheduleSleep();

  return {
    state: "idle",
    message: null,
    busy: false,
    setState: (state) => {
      set({ state });
      if (state === "idle") scheduleSleep();
      else if (sleepTimer) window.clearTimeout(sleepTimer);
    },
    setBusy: (busy) => {
      set({ busy });
      const { message, state } = get();
      if (busy) {
        if (sleepTimer) window.clearTimeout(sleepTimer);
        if (!message) set({ state: "working" });
      } else if (!message && state === "working") {
        set({ state: "idle" });
        scheduleSleep();
      }
    },
    wake: () => {
      if (get().state === "sleeping") set({ state: "idle" });
      scheduleSleep();
    },
    say: (message, durationMs = 4000) => {
      // 말하는 중이면 큐에 쌓아 순서대로 표시 (상한 초과 시 오래된 메시지 폐기)
      if (get().message) {
        messageQueue.push({ message, durationMs });
        while (messageQueue.length > MAX_QUEUE) messageQueue.shift();
        return;
      }
      if (sleepTimer) window.clearTimeout(sleepTimer);
      if (bubbleTimer) window.clearTimeout(bubbleTimer);
      set({ message, state: "talking" });
      bubbleTimer = window.setTimeout(showNext, durationMs);
    },
  };
});
