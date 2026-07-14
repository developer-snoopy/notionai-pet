import { create } from "zustand";

export type PetState = "idle" | "working" | "talking" | "sleeping";

interface PetStore {
  state: PetState;
  message: string | null;
  say: (message: string, durationMs?: number) => void;
  setState: (state: PetState) => void;
  wake: () => void;
}

const SLEEP_AFTER_MS = 90_000; // 무활동 90초 후 잠들기

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
      set({ message: null, state: "idle" });
      scheduleSleep();
      return;
    }
    set({ message: next.message, state: "talking" });
    bubbleTimer = window.setTimeout(showNext, next.durationMs);
  };

  scheduleSleep();

  return {
    state: "idle",
    message: null,
    setState: (state) => {
      set({ state });
      if (state === "idle") scheduleSleep();
      else if (sleepTimer) window.clearTimeout(sleepTimer);
    },
    wake: () => {
      if (get().state === "sleeping") set({ state: "idle" });
      scheduleSleep();
    },
    say: (message, durationMs = 4000) => {
      // 말하는 중이면 큐에 쌓아 순서대로 표시
      if (get().message) {
        messageQueue.push({ message, durationMs });
        return;
      }
      if (sleepTimer) window.clearTimeout(sleepTimer);
      if (bubbleTimer) window.clearTimeout(bubbleTimer);
      set({ message, state: "talking" });
      bubbleTimer = window.setTimeout(showNext, durationMs);
    },
  };
});
