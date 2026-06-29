import { optionalEnv, requireEnv } from "./env";
import type {
  TasksData,
  TaskItem,
  ComplaintsData,
  ComplaintItem,
} from "./types";

// Default database IDs discovered from the KSDC workspace. Override via env if
// the databases ever move. We use the stable 2022-06-28 REST API, which queries
// a database id directly (no Notion AI / Business plan required).
const TASKS_DB = optionalEnv("NOTION_TASKS_DB_ID", "34a97174a04b80d1a2c0f138dbe80fa5");
const COMPLAINTS_DB = optionalEnv(
  "NOTION_COMPLAINTS_DB_ID",
  "34b97174a04b802d8398db17a9648ffa",
);

const NOTION_VERSION = "2022-06-28";

// KSDC complaint statuses, grouped the same way the Notion "Status" property is.
const COMPLAINT_BUCKETS: Record<"todo" | "inProgress" | "done", string[]> = {
  todo: ["Received", "Details Requested"],
  inProgress: [
    "Inquiry Scheduled",
    "Awaiting Doctor Response",
    "Response Received",
    "Inquiry Underway",
  ],
  done: ["Inquiry Completed", "Closed", "Absence"],
};

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, NotionProperty>;
}

interface NotionProperty {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  status?: { name: string } | null;
  select?: { name: string } | null;
  multi_select?: { name: string }[];
  date?: { start: string | null } | null;
}

async function queryDatabase(
  databaseId: string,
  body: Record<string, unknown> = {},
): Promise<NotionPage[]> {
  const token = requireEnv("NOTION_TOKEN");
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100, start_cursor: cursor, ...body }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion API error (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      results: NotionPage[];
      next_cursor: string | null;
      has_more: boolean;
    };
    pages.push(...json.results);
    cursor = json.has_more ? json.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}

// --- property readers ----------------------------------------------------

function readTitle(p?: NotionProperty): string {
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}
function readText(p?: NotionProperty): string {
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}
function readStatus(p?: NotionProperty): string {
  return p?.status?.name ?? p?.select?.name ?? "";
}
function readMultiSelect(p?: NotionProperty): string[] {
  return p?.multi_select?.map((o) => o.name) ?? [];
}
function readDate(p?: NotionProperty): string | null {
  return p?.date?.start ?? null;
}

function bucketOf(status: string): "todo" | "inProgress" | "done" | null {
  for (const [bucket, names] of Object.entries(COMPLAINT_BUCKETS)) {
    if (names.includes(status)) return bucket as "todo" | "inProgress" | "done";
  }
  return null;
}

// --- public API -----------------------------------------------------------

export async function getTasks(): Promise<TasksData> {
  const pages = await queryDatabase(TASKS_DB);

  const all: TaskItem[] = pages.map((page) => ({
    id: page.id,
    name: readTitle(page.properties["Task name"]) || "(untitled)",
    status: readStatus(page.properties["Status"]) || "Not started",
    due: readDate(page.properties["Due date"]),
    url: page.url,
  }));

  const open = all
    .filter((t) => t.status !== "Done")
    .sort((a, b) => {
      // Due-soonest first; undated tasks last.
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });

  const doneCount = all.filter((t) => t.status === "Done").length;
  return { open, doneCount };
}

export async function getComplaints(): Promise<ComplaintsData> {
  const pages = await queryDatabase(COMPLAINTS_DB);

  const items: ComplaintItem[] = pages.map((page) => ({
    id: page.id,
    complaintId: readTitle(page.properties["Complaint ID"]) || "(no id)",
    complainant: readText(page.properties["Complainant Name"]),
    doctor: readText(page.properties["Doctor Name"]),
    status: readStatus(page.properties["Status"]) || "Received",
    categories: readMultiSelect(page.properties["Complaint Category"]),
    receivedDate: readDate(page.properties["Date Received"]),
    inquiryDate: readDate(page.properties["Inquiry Meeting Date"]),
    url: page.url,
  }));

  const byStatus: Record<string, number> = {};
  const byBucket = { todo: 0, inProgress: 0, done: 0 };
  for (const c of items) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    const bucket = bucketOf(c.status);
    if (bucket) byBucket[bucket] += 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingInquiries = items
    .filter((c) => c.inquiryDate && c.inquiryDate >= today)
    .sort((a, b) => (a.inquiryDate ?? "").localeCompare(b.inquiryDate ?? ""))
    .slice(0, 5);

  const recent = [...items]
    .sort((a, b) => (b.receivedDate ?? "").localeCompare(a.receivedDate ?? ""))
    .slice(0, 5);

  return { total: items.length, byStatus, byBucket, upcomingInquiries, recent };
}
