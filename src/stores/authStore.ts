import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { NotionUser, verifyToken } from "../lib/notion";

export type Step = "loading" | "login" | "ai-check" | "home";

interface AuthStore {
  token: string | null;
  user: NotionUser | null;
  step: Step;
  init: () => Promise<void>;
  login: (token: string, user: NotionUser) => Promise<void>;
  proceedToHome: () => void;
  logout: () => Promise<void>;
}

const LEGACY_TOKEN_KEY = "notion-token";
const USER_KEY = "notion-user";

function loadSavedUser(): NotionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  step: "loading",
  /** 앱 시작 시 secure storage에서 토큰을 복원한다. 구버전 localStorage 토큰은 이관 후 제거. */
  init: async () => {
    try {
      let token = await invoke<string | null>("load_token");

      // 구버전(localStorage) 토큰 마이그레이션
      const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (!token && legacy) {
        await invoke("save_token", { token: legacy });
        token = legacy;
      }
      if (legacy) localStorage.removeItem(LEGACY_TOKEN_KEY);

      if (!token) {
        set({ step: "login" });
        return;
      }

      let user = loadSavedUser();
      if (!user) {
        user = await verifyToken(token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      set({ token, user, step: "home" });
    } catch {
      set({ step: "login" });
    }
  },
  login: async (token, user) => {
    await invoke("save_token", { token });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, step: "ai-check" });
  },
  proceedToHome: () => set({ step: "home" }),
  logout: async () => {
    await invoke("delete_token").catch(() => {});
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, step: "login" });
  },
}));
