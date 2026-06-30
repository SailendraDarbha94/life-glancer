import { purgeCategories } from "@/lib/google";
import { handle } from "@/lib/route-helpers";
import type { CleanupCategory, CleanupResult } from "@/lib/types";

export const dynamic = "force-dynamic";

// Fixed targets — Social / Promotions / Updates / Forums. Primary is never here.
const TARGETS: CleanupCategory[] = ["social", "promotions", "updates", "forums"];

// POST so it can never be triggered by a navigation/GET. A real (non-dry-run)
// delete additionally requires the caller to echo confirm: "DELETE".
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as {
    confirm?: string;
    dryRun?: boolean;
  };
  const dryRun = Boolean(body.dryRun);

  if (!dryRun && body.confirm !== "DELETE") {
    return Response.json(
      { ok: false, error: 'Confirmation required: send confirm: "DELETE".' },
      { status: 200 },
    );
  }

  return handle<CleanupResult>(() => purgeCategories(TARGETS, { dryRun }));
}
