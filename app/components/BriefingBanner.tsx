"use client";

import { useApi } from "./useApi";
import type { BriefingData } from "@/lib/types";

// The JARVIS line across the top. Slower than the widgets (it calls the model),
// so it shows its own thinking state and refreshes less often.
export function BriefingBanner() {
  const { data, error, needsSetup, loading, refresh } = useApi<BriefingData>(
    "/api/briefing",
    30 * 60_000,
  );

  return (
    <div className="rounded-xl border border-black/[.08] bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 text-zinc-100 dark:border-white/[.1]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
          Daily briefing
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-zinc-400 transition-colors hover:text-zinc-100 disabled:opacity-50"
        >
          {loading ? "thinking…" : "regenerate"}
        </button>
      </div>

      {needsSetup ? (
        <p className="text-sm text-amber-300">
          {error} Add your ANTHROPIC_API_KEY to enable the briefing.
        </p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading && !data ? (
        <p className="text-lg text-zinc-400">Gathering your day…</p>
      ) : (
        <p className="text-lg leading-relaxed text-balance">{data?.briefing}</p>
      )}
    </div>
  );
}
