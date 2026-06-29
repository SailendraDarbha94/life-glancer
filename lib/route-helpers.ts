import { NextResponse } from "next/server";
import { MissingEnvError } from "./env";
import type { ApiResult } from "./types";

// Wrap a data-fetching function into a JSON response. A missing credential
// becomes a friendly needsSetup flag; any other error is reported as-is.
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse<ApiResult<T>>> {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    if (err instanceof MissingEnvError) {
      return NextResponse.json(
        { ok: false, error: `Not connected yet (${err.key}).`, needsSetup: true },
        { status: 200 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
