import { getCategoryCounts } from "@/lib/google";
import { handle } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

// Powers the cleanup preview: how many messages sit in each category tab.
export function GET() {
  return handle(() => getCategoryCounts());
}
