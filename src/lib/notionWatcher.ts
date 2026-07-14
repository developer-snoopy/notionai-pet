import { fetch } from "@tauri-apps/plugin-http";

const NOTION_VERSION = "2022-06-28";
const DEFAULT_INTERVAL_MS = 30_000; // Notion rate limit(초당 3회)을 고려한 폴링 주기

export interface NotionActivity {
  kind: "created" | "edited";
  objectType: "page" | "database";
  title: string;
  time: string;
}

interface SearchItem {
  id: string;
  object: "page" | "database";
  created_time: string;
  last_edited_time: string;
  title?: Array<{ plain_text?: string }>;
  properties?: Record<
    string,
    { type?: string; title?: Array<{ plain_text?: string }> }
  >;
}

function joinRichText(parts?: Array<{ plain_text?: string }>): string {
  const text = (parts ?? [])
    .map((p) => p.plain_text ?? "")
    .join("")
    .trim();
  return text || "제목 없음";
}

function extractTitle(item: SearchItem): string {
  if (item.object === "database") return joinRichText(item.title);
  for (const prop of Object.values(item.properties ?? {})) {
    if (prop?.type === "title") return joinRichText(prop.title);
  }
  return "제목 없음";
}

async function searchRecent(token: string): Promise<SearchItem[]> {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 20,
      sort: { direction: "descending", timestamp: "last_edited_time" },
    }),
  });
  if (!res.ok) throw new Error(`Notion search failed (HTTP ${res.status})`);
  const data = await res.json();
  return (data.results ?? []) as SearchItem[];
}

/**
 * 노션 워크스페이스의 페이지 생성/편집 활동을 주기적으로 감지한다.
 * 첫 폴링은 기준선(baseline)만 수집하고, 이후 변경분을 활동 이벤트로 전달한다.
 * 반환된 함수를 호출하면 폴링이 중단된다.
 */
export function startNotionWatcher(
  token: string,
  onActivity: (activity: NotionActivity) => void,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): () => void {
  const known = new Map<string, string>(); // page id → last_edited_time
  let baselineReady = false;
  let stopped = false;

  const poll = async () => {
    try {
      const items = await searchRecent(token);
      if (stopped) return;

      const activities: NotionActivity[] = [];
      for (const item of items) {
        const prev = known.get(item.id);
        if (prev === item.last_edited_time) continue;
        known.set(item.id, item.last_edited_time);
        if (!baselineReady) continue;
        activities.push({
          kind: prev === undefined ? "created" : "edited",
          objectType: item.object,
          title: extractTitle(item),
          time: item.last_edited_time,
        });
      }
      baselineReady = true;

      // 한 번에 너무 많은 말풍선이 뜨지 않도록 최근 3건만 전달
      for (const activity of activities.slice(0, 3)) {
        onActivity(activity);
      }
    } catch {
      // 네트워크 오류/rate limit 시 다음 주기에 재시도
    }
  };

  void poll();
  const timer = window.setInterval(poll, intervalMs);

  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}

/** 활동 이벤트를 말풍선 문구로 변환한다. */
export function activityMessage(activity: NotionActivity): string {
  const label = activity.objectType === "database" ? "데이터베이스" : "페이지";
  return activity.kind === "created"
    ? `"${activity.title}" ${label}가 새로 만들어졌어요! ✨`
    : `"${activity.title}" ${label}가 편집되고 있어요 ✍️`;
}
