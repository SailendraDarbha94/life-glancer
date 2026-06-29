import Anthropic from "@anthropic-ai/sdk";
import { optionalEnv, requireEnv } from "./env";
import type { InboxData, DriveData, TasksData, ComplaintsData } from "./types";

// The "JARVIS voice" layer: turn the raw widget data into a short, spoken-style
// morning briefing. Model defaults to Opus 4.8; override with CLAUDE_MODEL.

export interface BriefingInput {
  inbox?: InboxData;
  drive?: DriveData;
  tasks?: TasksData;
  complaints?: ComplaintsData;
}

const SYSTEM_PROMPT = `You are a personal assistant in the style of JARVIS — calm, concise, and a touch witty.
You are given a JSON snapshot of the user's unread email, recent Google Drive activity, Notion tasks, and KSDC complaint-management data.
Write a single spoken-style briefing of 3 to 5 short sentences that orients the user for the day.
Lead with what is most time-sensitive (upcoming inquiry hearings, overdue or due-today tasks, a notable spike in unread mail).
Refer to specific numbers and names from the data; do not invent anything not present.
Address the user directly. Do not use markdown, bullet points, or headings — just plain prose.`;

export async function generateBriefing(input: BriefingInput): Promise<string> {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model = optionalEnv("CLAUDE_MODEL", "claude-opus-4-8");
  const client = new Anthropic({ apiKey });

  const snapshot = JSON.stringify(buildSnapshot(input), null, 2);

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    // Simple, latency-sensitive summarization — low effort keeps the briefing snappy.
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is today's snapshot:\n\n${snapshot}\n\nGive me my briefing.`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return text || "Nothing notable to report right now.";
}

// Compact the data to just what the model needs, so the prompt stays small.
function buildSnapshot(input: BriefingInput) {
  return {
    unreadEmail: input.inbox && {
      count: input.inbox.unreadCount,
      recent: input.inbox.messages.slice(0, 5).map((m) => ({
        from: m.from,
        subject: m.subject,
      })),
    },
    driveActivity: input.drive && {
      recentFiles: input.drive.files.slice(0, 5).map((f) => ({
        name: f.name,
        modifiedBy: f.modifiedBy,
        modifiedTime: f.modifiedTime,
      })),
    },
    tasks: input.tasks && {
      openCount: input.tasks.open.length,
      doneCount: input.tasks.doneCount,
      open: input.tasks.open.slice(0, 8).map((t) => ({
        name: t.name,
        status: t.status,
        due: t.due,
      })),
    },
    ksdcComplaints: input.complaints && {
      total: input.complaints.total,
      byBucket: input.complaints.byBucket,
      byStatus: input.complaints.byStatus,
      upcomingInquiries: input.complaints.upcomingInquiries.map((c) => ({
        complaintId: c.complaintId,
        doctor: c.doctor,
        inquiryDate: c.inquiryDate,
      })),
    },
  };
}
