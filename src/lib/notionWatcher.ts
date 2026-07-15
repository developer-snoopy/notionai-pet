import { fetch } from "@tauri-apps/plugin-http";

const NOTION_VERSION = "2022-06-28";
const DEFAULT_INTERVAL_MS = 30_000; // Notion rate limit(초당 3회)을 고려한 폴링 주기

export interface NotionActivity {
  kind: "created" | "edited";
  objectType: "page" | "database";
  title: string;
  time: string;
}

/** Notion API 응답 오류 (HTTP 상태 코드 포함) */
export class NotionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
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
  if (!res.ok)
    throw new NotionApiError(
      `Notion search failed (HTTP ${res.status})`,
      res.status,
    );
  const data = await res.json();
  return (data.results ?? []) as SearchItem[];
}

/** 페이지 본문 블록들의 텍스트를 이어붙여 반환한다 (진행 내용 추적용). */
async function fetchPageText(token: string, pageId: string): Promise<string> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
      },
    },
  );
  if (!res.ok)
    throw new NotionApiError(
      `Notion blocks failed (HTTP ${res.status})`,
      res.status,
    );
  const data = await res.json();
  const parts: string[] = [];
  for (const block of data.results ?? []) {
    const content = block[block.type];
    const richText = content?.rich_text as
      | Array<{ plain_text?: string }>
      | undefined;
    if (richText?.length) {
      parts.push(richText.map((t) => t.plain_text ?? "").join(""));
    }
  }
  return parts.join("\n");
}

/** 이전/현재 본문을 비교해 새로 추가·변경된 텍스트 꼬리 부분을 반환한다. */
function diffAppended(prev: string, next: string): string {
  if (next === prev) return "";
  let i = 0;
  const max = Math.min(prev.length, next.length);
  while (i < max && prev[i] === next[i]) i++;
  return next.slice(i).replace(/\s+/g, " ").trim();
}

export interface PageProgress {
  title: string;
  snippet: string;
}

export type WatcherError = "auth" | "network";

export interface WatcherCallbacks {
  /** 페이지/DB 생성·편집 감지 */
  onActivity: (activity: NotionActivity) => void;
  /** 추적 중인 페이지에 새로 작성된 내용 미리보기 */
  onProgress?: (progress: PageProgress) => void;
  /** 작업 진행 중 여부 (펫 working 상태 연동) */
  onWorking?: (working: boolean) => void;
  /** 통합에 연결된 페이지가 하나도 없을 때 1회 알림 */
  onEmpty?: () => void;
  /** 토큰 권한 오류(auth) 또는 연속 네트워크 오류(network) 알림 */
  onError?: (kind: WatcherError) => void;
}

const TRACK_INTERVAL_MS = 8_000; // 추적 모드 폴링 주기
const TRACK_IDLE_STOP_MS = 60_000; // 이 시간 동안 변화 없으면 추적 종료
const SNIPPET_MAX = 60;
const ERROR_NOTIFY_AFTER = 3; // 연속 실패 횟수가 이 값에 도달하면 onError 알림
const CREATED_WINDOW_MS = 90_000; // 생성/편집 구분: 생성 후 이 시간 안의 편집은 "생성"으로 간주

/**
 * 노션 워크스페이스의 페이지 생성/편집 활동을 주기적으로 감지한다.
 * 첫 폴링은 기준선(baseline)만 수집하고, 이후 변경분을 활동 이벤트로 전달한다.
 * 편집이 감지된 페이지는 추적 모드로 전환되어 짧은 주기(8초)로 본문을 diff,
 * 새로 작성 중인 내용을 onProgress로 전달한다 (Notion AI 작성 내용 실시간 미리보기).
 * 반환된 함수를 호출하면 폴링이 중단된다.
 */
export function startNotionWatcher(
  token: string,
  callbacks: WatcherCallbacks,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): () => void {
  const { onActivity, onProgress, onWorking, onEmpty, onError } = callbacks;
  const known = new Map<string, string>(); // page id → last_edited_time
  let baselineReady = false;
  let stopped = false;
  let emptyNotified = false;
  let consecutiveErrors = 0;
  let errorNotified = false;

  // ── 추적 모드 상태 ──
  let trackedPageId: string | null = null;
  let trackedTitle = "";
  let trackedText = "";
  let trackedLastChange = 0;
  let trackTimer: number | undefined;

  const stopTracking = () => {
    if (trackTimer) window.clearInterval(trackTimer);
    trackTimer = undefined;
    trackedPageId = null;
    onWorking?.(false);
  };

  const trackPoll = async () => {
    if (!trackedPageId || stopped) return;
    try {
      const text = await fetchPageText(token, trackedPageId);
      if (stopped || !trackedPageId) return;
      const appended = diffAppended(trackedText, text);
      if (appended) {
        trackedText = text;
        trackedLastChange = Date.now();
        const snippet =
          appended.length > SNIPPET_MAX
            ? `…${appended.slice(-SNIPPET_MAX)}`
            : appended;
        onProgress?.({ title: trackedTitle, snippet });
      } else if (Date.now() - trackedLastChange > TRACK_IDLE_STOP_MS) {
        stopTracking();
      }
    } catch {
      stopTracking(); // 접근 불가 페이지 등은 추적 중단
    }
  };

  const startTracking = async (pageId: string, title: string) => {
    const isNewTarget = trackedPageId !== pageId;
    trackedPageId = pageId;
    trackedTitle = title;
    trackedLastChange = Date.now();
    onWorking?.(true);
    if (isNewTarget) {
      // 현재 본문을 기준선으로 잡고 이후 추가분만 보여준다
      try {
        trackedText = await fetchPageText(token, pageId);
      } catch {
        stopTracking();
        return;
      }
    }
    if (!trackTimer) {
      trackTimer = window.setInterval(trackPoll, TRACK_INTERVAL_MS);
    }
  };

  const poll = async () => {
    try {
      const items = await searchRecent(token);
      if (stopped) return;
      consecutiveErrors = 0;
      errorNotified = false;

      // 통합에 연결된 페이지가 하나도 없으면 감지할 대상이 없다 — 사용자에게 안내
      if (!baselineReady && items.length === 0 && !emptyNotified) {
        emptyNotified = true;
        onEmpty?.();
      }

      const activities: Array<NotionActivity & { id: string }> = [];
      for (const item of items) {
        const prev = known.get(item.id);
        if (prev === item.last_edited_time) continue;
        known.set(item.id, item.last_edited_time);
        if (!baselineReady) continue;
        // 처음 보는 항목이라도 생성된 지 오래됐다면 "편집"으로 판별
        // (기준선 밖에 있던 기존 페이지가 편집되어 검색 상위로 올라온 경우)
        const recentlyCreated =
          new Date(item.last_edited_time).getTime() -
            new Date(item.created_time).getTime() <
          CREATED_WINDOW_MS;
        activities.push({
          id: item.id,
          kind: prev === undefined && recentlyCreated ? "created" : "edited",
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

      // 가장 최근에 편집된 페이지를 추적 모드로 전환
      const target = activities.find((a) => a.objectType === "page");
      if (target) void startTracking(target.id, target.title);
    } catch (e) {
      // 네트워크 오류/rate limit 시 다음 주기에 재시도하되, 반복되면 사용자에게 알림
      if (stopped) return;
      if (e instanceof NotionApiError && (e.status === 401 || e.status === 403)) {
        if (!errorNotified) {
          errorNotified = true;
          onError?.("auth");
        }
        return;
      }
      consecutiveErrors++;
      if (consecutiveErrors >= ERROR_NOTIFY_AFTER && !errorNotified) {
        errorNotified = true;
        onError?.("network");
      }
    }
  };

  void poll();
  const timer = window.setInterval(poll, intervalMs);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    stopTracking();
  };
}

/** 활동 이벤트를 말풍선 문구로 변환한다. */
export function activityMessage(activity: NotionActivity): string {
  const label = activity.objectType === "database" ? "데이터베이스" : "페이지";
  return activity.kind === "created"
    ? `"${activity.title}" ${label}가 새로 만들어졌어요! ✨`
    : `"${activity.title}" ${label}가 편집되고 있어요 ✍️`;
}
