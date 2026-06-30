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
    <div className="panel-glow relative overflow-hidden rounded-xl border border-edge bg-surface-2/70 p-6 backdrop-blur-sm">
      {/* accent edge */}
      <div className="absolute inset-y-0 left-0 w-px bg-accent accent-glow text-accent" />

      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] text-accent uppercase">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Daily briefing
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="font-mono text-[10px] tracking-widest text-muted uppercase transition-colors hover:text-accent disabled:opacity-50"
        >
          {loading ? "thinking···" : "regenerate"}
        </button>
      </div>

      {needsSetup ? (
        <p className="text-sm text-amber-400">
          {error} Add your ANTHROPIC_API_KEY to enable the briefing.
        </p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : loading && !data ? (
        <p className="font-mono text-base text-muted">Gathering your day…</p>
      ) : (
        <p className="text-lg leading-relaxed text-balance text-foreground">
          {data?.briefing}
        </p>
      )}
    </div>
  );
}
