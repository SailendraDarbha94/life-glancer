import { requireEnv } from "./env";
import type {
  EmailItem,
  InboxData,
  DriveData,
  DriveItem,
  CategoryCount,
  CategoryCounts,
  CleanupCategory,
  CleanupResult,
} from "./types";

// Single-user OAuth: we hold a long-lived refresh token in the environment and
// exchange it for short-lived access tokens on demand. Tokens are cached in
// module memory until shortly before they expire.

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    // Refresh 60s early to avoid using a token that expires mid-request.
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

async function googleFetch(url: string): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API error (${res.status}): ${body}`);
  }
  return res;
}

async function googlePost(url: string, body: unknown): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error (${res.status}): ${text}`);
  }
  return res;
}

const DELETE_SCOPE = "https://mail.google.com/";

// Permanent delete needs the full Gmail scope. Read-only / gmail.modify tokens
// can list and trash but not batchDelete, so verify up front and fail with a
// clear, actionable message instead of a raw 403 deep in the delete loop.
async function assertDeleteScope(): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
  );
  const scopes =
    res.ok &&
    ((await res.json()) as { scope?: string }).scope?.split(" ");
  if (!scopes || !scopes.includes(DELETE_SCOPE)) {
    throw new Error(
      `Gmail delete permission is missing. Re-authorize Google with the "${DELETE_SCOPE}" scope and update GOOGLE_REFRESH_TOKEN (then restart the server).`,
    );
  }
}

// Gmail's resultSizeEstimate is unreliable (it can return the same number for
// every query), so we count real message IDs, paging up to `cap`. Returns the
// exact count, or `cap` with capped=true when there are more than that.
async function countMessages(
  query: string,
  cap = 1000,
): Promise<CategoryCount> {
  let count = 0;
  let pageToken: string | undefined;
  do {
    const pageSize = Math.min(500, cap - count);
    const res = await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages` +
        `?q=${encodeURIComponent(query)}&maxResults=${pageSize}` +
        (pageToken ? `&pageToken=${pageToken}` : ""),
    );
    const json = (await res.json()) as {
      messages?: { id: string }[];
      nextPageToken?: string;
    };
    count += (json.messages ?? []).length;
    pageToken = json.nextPageToken;
    if (count >= cap) return { count, capped: Boolean(pageToken) };
  } while (pageToken);
  return { count, capped: false };
}

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// Strip the angle-bracket address so "Jane Doe <jane@x.com>" reads as "Jane Doe".
function cleanFrom(raw: string): string {
  const match = raw.match(/^(.*?)\s*<.*>$/);
  return (match ? match[1] : raw).replace(/^"|"$/g, "").trim() || raw;
}

export async function getUnreadInbox(limit = 8): Promise<InboxData> {
  // Primary-tab unread only. Social / Promotions / Updates / Forums are excluded
  // by design — the user never reads those tabs.
  const listRes = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
      "is:unread category:primary",
    )}&maxResults=${limit}`,
  );
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);
  const { count: unreadCount, capped: unreadCountCapped } = await countMessages(
    "is:unread category:primary",
  );

  const messages: EmailItem[] = await Promise.all(
    ids.map(async (id) => {
      const res = await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}` +
          "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date",
      );
      const msg = (await res.json()) as {
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = msg.payload?.headers ?? [];
      return {
        id,
        from: cleanFrom(header(headers, "From")),
        subject: header(headers, "Subject") || "(no subject)",
        snippet: msg.snippet ?? "",
        date: header(headers, "Date") || null,
      };
    }),
  );

  return { unreadCount, unreadCountCapped, messages };
}

export async function getRecentDriveFiles(limit = 8): Promise<DriveData> {
  const fields =
    "files(id,name,mimeType,modifiedTime,webViewLink,lastModifyingUser/displayName)";
  const url =
    "https://www.googleapis.com/drive/v3/files" +
    `?orderBy=modifiedTime desc&pageSize=${limit}` +
    `&q=${encodeURIComponent("trashed = false")}` +
    `&fields=${encodeURIComponent(fields)}`;

  const res = await googleFetch(url);
  const json = (await res.json()) as {
    files?: {
      id: string;
      name: string;
      mimeType: string;
      modifiedTime?: string;
      webViewLink?: string;
      lastModifyingUser?: { displayName?: string };
    }[];
  };

  const files: DriveItem[] = (json.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime ?? null,
    modifiedBy: f.lastModifyingUser?.displayName ?? null,
    webViewLink: f.webViewLink ?? null,
  }));

  return { files };
}

// --- inbox cleanup (Social / Promotions / Updates / Forums) ---------------

// The only categories the cleanup feature may ever touch. "primary" is absent
// on purpose: it must never be deletable.
const CLEANUP_CATEGORIES: CleanupCategory[] = [
  "social",
  "promotions",
  "updates",
  "forums",
];

export async function getCategoryCounts(): Promise<CategoryCounts> {
  // Cheap, bounded preview: count up to 500 per tab (shows "500+" beyond that).
  // The dry-run cleanup gives the exact deletable total.
  const entries = await Promise.all(
    CLEANUP_CATEGORIES.map(
      async (cat) => [cat, await countMessages(`category:${cat}`, 500)] as const,
    ),
  );

  const perCategory = Object.fromEntries(entries) as Record<
    CleanupCategory,
    CategoryCount
  >;
  const total = entries.reduce((sum, [, v]) => sum + v.count, 0);
  const totalCapped = entries.some(([, v]) => v.capped);
  return { perCategory, total, totalCapped };
}

async function collectMessageIds(query: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const res = await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages` +
        `?q=${encodeURIComponent(query)}&maxResults=500` +
        (pageToken ? `&pageToken=${pageToken}` : ""),
    );
    const json = (await res.json()) as {
      messages?: { id: string }[];
      nextPageToken?: string;
    };
    for (const m of json.messages ?? []) ids.push(m.id);
    pageToken = json.nextPageToken;
  } while (pageToken);
  return ids;
}

// Permanently delete every message in the given categories. Irreversible —
// guarded by the allowlist here and by the type-to-confirm UI + route check.
export async function purgeCategories(
  categories: CleanupCategory[],
  opts: { dryRun?: boolean } = {},
): Promise<CleanupResult> {
  const dryRun = Boolean(opts.dryRun);
  const targets = categories.filter((c) => CLEANUP_CATEGORIES.includes(c));
  if (targets.length === 0) return { deleted: 0, dryRun };

  // Fail fast on a wrong-scope token before doing any work (dry-run stays
  // read-only, so it does not need the delete scope).
  if (!dryRun) await assertDeleteScope();

  const query = targets.map((c) => `category:${c}`).join(" OR ");
  const ids = await collectMessageIds(query);

  if (dryRun) return { deleted: ids.length, dryRun: true };

  // batchDelete permanently removes up to 1000 ids per call (no Trash).
  for (let i = 0; i < ids.length; i += 1000) {
    await googlePost(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/batchDelete",
      { ids: ids.slice(i, i + 1000) },
    );
  }
  return { deleted: ids.length, dryRun: false };
}
