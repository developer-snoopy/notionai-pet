import { create } from "zustand";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

export type CharacterKind = "page" | "ghost" | "custom";

interface CharacterStore {
  kind: CharacterKind;
  /** 사용자 지정 이미지 (data URL) */
  customImage: string | null;
  setKind: (kind: CharacterKind) => void;
  /** 파일 선택 대화상자로 사용자 이미지를 불러온다. 성공 시 true. */
  pickCustomImage: () => Promise<boolean>;
}

const KIND_KEY = "pet-character-kind";
const IMAGE_KEY = "pet-character-image";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function toDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function loadSaved(): { kind: CharacterKind; customImage: string | null } {
  try {
    const kind = (localStorage.getItem(KIND_KEY) as CharacterKind) ?? "page";
    const customImage = localStorage.getItem(IMAGE_KEY);
    if (kind === "custom" && !customImage) return { kind: "page", customImage: null };
    return { kind, customImage };
  } catch {
    return { kind: "page", customImage: null };
  }
}

const saved = loadSaved();

export const useCharacterStore = create<CharacterStore>((set) => ({
  kind: saved.kind,
  customImage: saved.customImage,
  setKind: (kind) => {
    localStorage.setItem(KIND_KEY, kind);
    set({ kind });
  },
  pickCustomImage: async () => {
    const path = await open({
      title: "펫 캐릭터 이미지 선택",
      multiple: false,
      directory: false,
      filters: [
        { name: "이미지", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
      ],
    });
    if (typeof path !== "string") return false;

    const bytes = await readFile(path);
    if (bytes.length > 4 * 1024 * 1024) {
      throw new Error("이미지가 너무 큽니다 (최대 4MB).");
    }
    const ext = path.split(".").pop()?.toLowerCase() ?? "png";
    const dataUrl = toDataUrl(bytes, MIME_BY_EXT[ext] ?? "image/png");

    localStorage.setItem(IMAGE_KEY, dataUrl);
    localStorage.setItem(KIND_KEY, "custom");
    set({ customImage: dataUrl, kind: "custom" });
    return true;
  },
}));
