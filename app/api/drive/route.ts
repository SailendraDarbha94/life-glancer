import { getRecentDriveFiles } from "@/lib/google";
import { handle } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getRecentDriveFiles());
}
