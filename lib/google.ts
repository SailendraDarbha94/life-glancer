import { requireEnv } from "./env";
import type { EmailItem, InboxData, DriveData, DriveItem } from "./types";

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

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// Strip the angle-bracket address so "Jane Doe <jane@x.com>" reads as "Jane Doe".
function cleanFrom(raw: string): string {
  const match = raw.match(/^(.*?)\s*<.*>$/);
  return (match ? match[1] : raw).replace(/^"|"$/g, "").trim() || raw;
}

export async function getUnreadInbox(limit = 8): Promise<InboxData> {
  // Total unread count from the UNREAD label (exact), then a page of recent ones.
  const labelRes = await googleFetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD",
  );
  const label = (await labelRes.json()) as { messagesUnread?: number };
  const unreadCount = label.messagesUnread ?? 0;

  const listRes = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
      "is:unread in:inbox",
    )}&maxResults=${limit}`,
  );
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);

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

  return { unreadCount, messages };
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
