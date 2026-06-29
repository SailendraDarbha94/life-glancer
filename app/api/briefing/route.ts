import { getUnreadInbox, getRecentDriveFiles } from "@/lib/google";
import { getTasks, getComplaints } from "@/lib/notion";
import { generateBriefing, type BriefingInput } from "@/lib/claude";
import { handle } from "@/lib/route-helpers";
import type { BriefingData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Try a source but don't let one missing/failing provider sink the briefing —
// the model simply summarizes whatever data it was given.
async function tryGet<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}

export function GET() {
  return handle<BriefingData>(async () => {
    const [inbox, drive, tasks, complaints] = await Promise.all([
      tryGet(getUnreadInbox),
      tryGet(getRecentDriveFiles),
      tryGet(getTasks),
      tryGet(getComplaints),
    ]);

    const input: BriefingInput = { inbox, drive, tasks, complaints };
    // generateBriefing throws MissingEnvError if ANTHROPIC_API_KEY is unset,
    // which handle() converts into a needsSetup response.
    const briefing = await generateBriefing(input);
    return { briefing, generatedAt: new Date().toISOString() };
  });
}
