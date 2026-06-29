import { getTasks } from "@/lib/notion";
import { handle } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getTasks());
}
