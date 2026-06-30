# Life Glancer

A personal "life at a glance" dashboard — a JARVIS-style daily briefing on top of
four live widgets:

| Widget | Source | Endpoint |
|---|---|---|
| Inbox (Primary only) | Gmail API — Primary-tab unread | `/api/gmail` |
| Inbox digest | Claude — neutral digest of Primary unread | `/api/inbox-summary` |
| Drive activity | Google Drive API (recent files) | `/api/drive` |
| Tasks | Notion `Todo List` database | `/api/tasks` |
| KSDC complaints | Notion `Complaint Management` database | `/api/complaints` |
| Daily briefing | Claude (Opus 4.8) over all of the above | `/api/briefing` |

There are **two separate summaries**: the cross-cutting **daily briefing** (top banner)
and a **dedicated inbox digest** (inside the Inbox card) that looks only at the Primary tab.

### Clean up tabs (permanent delete)
The Inbox card has a **Clean up tabs** button that **permanently deletes** all mail in the
**Social, Promotions, Updates, and Forums** categories (`/api/inbox/cleanup`, POST). It is
irreversible and guarded three ways: a server-side allowlist that can never touch Primary, a
**type-`DELETE`** confirmation, and a **dry-run preview** that reports what *would* be deleted.
Counts per category come from `/api/inbox/categories`.

Built with Next.js (App Router) + TypeScript + Tailwind. All provider calls run
**server-side** in route handlers — credentials never reach the browser.

## Architecture

```
Browser widgets  ──fetch──▶  /api/* route handlers  ──▶  lib/{google,notion,claude}.ts  ──▶  provider APIs
```

- `lib/google.ts` — refreshes a Google access token from a stored refresh token, then calls the Gmail + Drive REST APIs.
- `lib/notion.ts` — queries the Notion databases via the stable `2022-06-28` REST API (no Notion Business/AI plan needed).
- `lib/claude.ts` — sends a compact snapshot of all the data to Claude and returns a short spoken-style briefing.
- Each route returns `{ ok: true, data }` or `{ ok: false, error, needsSetup }`, so an unconfigured provider shows a friendly "connect me" state instead of crashing the page.

## Setup

```bash
cp .env.local.example .env.local   # then fill in the values below
npm run dev                        # http://localhost:3000
```

This is a **single-user** app — you authorize once and store one set of tokens
in `.env.local`. No multi-user OAuth, no database.

### 1. Anthropic
Create a key at <https://console.anthropic.com/settings/keys> → `ANTHROPIC_API_KEY`.

### 2. Notion
1. Create an internal integration at <https://www.notion.so/my-integrations> → copy the token into `NOTION_TOKEN`.
2. Open the **Todo List** and **Complaint Management** databases in Notion, and via the `•••` menu → *Connections* → add your integration to **both**.
3. The database IDs are pre-filled for the KSDC workspace; override only if they move.

### 3. Google (Gmail + Drive)
1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Gmail API** and **Google Drive API**.
2. Create an **OAuth 2.0 Client ID** (type: *Web application*). Add `https://developers.google.com/oauthplayground` as an authorized redirect URI for the one-time token grab.
3. Put the client ID/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. Get a refresh token (easiest via the [OAuth Playground](https://developers.google.com/oauthplayground/)):
   - Gear icon → *Use your own OAuth credentials* → paste client ID/secret.
   - Authorize these scopes: `https://mail.google.com/` and `https://www.googleapis.com/auth/drive.metadata.readonly`.
   - Exchange the authorization code → copy the **refresh token** into `GOOGLE_REFRESH_TOKEN`.

> ⚠️ **Full Gmail scope is required** because the "Clean up tabs" feature permanently
> deletes mail (`messages.batchDelete`), which read-only/`gmail.modify` cannot do. The
> `https://mail.google.com/` scope grants full mailbox access — only grant it to your own app.
> If you previously authorized read-only, you must re-run this step to mint a new refresh token.

> Because this is a personal app you can keep the Google OAuth consent screen in **Testing**
> mode (add yourself as a test user). Note: in Testing mode Google expires the refresh token
> after ~7 days — click **Publish app** on the consent screen to make it permanent.

## Notes
- Widgets refresh every 5 minutes; the briefing every 30 minutes. Both have manual refresh buttons.
- The Notion MCP SQL tool requires a Business+AI plan, but this app uses the plain REST `databases/{id}/query` endpoint, which does not.
