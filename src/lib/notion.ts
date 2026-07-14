import { fetch } from "@tauri-apps/plugin-http";

const NOTION_VERSION = "2022-06-28";

export interface NotionUser {
  name: string;
  workspaceName?: string;
  avatarUrl?: string;
}

/** Notion Integration Token을 검증하고 사용자/워크스페이스 정보를 반환한다. */
export async function verifyToken(token: string): Promise<NotionUser> {
  const res = await fetch("https://api.notion.com/v1/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("유효하지 않은 토큰입니다. 토큰을 다시 확인해주세요.");
    }
    throw new Error(`Notion API 오류가 발생했습니다. (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    name: data.name ?? "Notion 사용자",
    workspaceName: data.bot?.owner?.workspace_name ?? data.bot?.workspace_name,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

export type AiAccess = "available" | "unknown" | "unavailable";

/**
 * Notion AI API 사용 가능 여부를 확인한다.
 * 현재 Notion 공개 API에는 AI 기능 여부를 조회하는 엔드포인트가 없으므로,
 * API 접근 자체가 가능하면 "unknown"(확인 불가)을 반환하고
 * 프론트엔드에서 안내 문구/권한 획득 방법을 선택지로 제시한다.
 */
export async function checkAiAccess(token: string): Promise<AiAccess> {
  try {
    const res = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 1 }),
    });
    if (!res.ok) return "unavailable";
    return "unknown";
  } catch {
    return "unavailable";
  }
}
