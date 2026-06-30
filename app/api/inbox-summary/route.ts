import { getUnreadInbox } from "@/lib/google";
import { summarizeInbox } from "@/lib/claude";
import { handle } from "@/lib/route-helpers";
import type { InboxSummaryData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Separate from the daily briefing: a neutral digest of unread Primary mail only.
export function GET() {
  return handle<InboxSummaryData>(async () => {
    const inbox = await getUnreadInbox(15);
    const summary = await summarizeInbox(inbox.messages);
    return { summary, generatedAt: new Date().toISOString() };
  });
}
