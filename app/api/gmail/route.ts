import { getUnreadInbox } from "@/lib/google";
import { handle } from "@/lib/route-helpers";

// Always fetch fresh; the dashboard controls its own refresh cadence.
export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getUnreadInbox());
}
