"use client";

import type { ReactNode } from "react";

interface CardProps {
  title: string;
  accent?: string; // tailwind text color class for the glowing title dot
  loading?: boolean;
  isEmpty?: boolean; // true while there is no data to show yet
  error?: string | null;
  needsSetup?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

// Shared HUD widget shell: title row, refresh affordance, and consistent
// loading / not-connected / error states.
export function Card({
  title,
  accent = "text-muted",
  loading,
  isEmpty,
  error,
  needsSetup,
  onRefresh,
  children,
}: CardProps) {
  return (
    <section className="panel-glow flex flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-sm">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full bg-current accent-glow ${accent}`}
          />
          {title}
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="font-mono text-[10px] tracking-widest text-muted uppercase transition-colors hover:text-accent"
            aria-label={`Refresh ${title}`}
          >
            {loading ? "···" : "sync"}
          </button>
        )}
      </header>

      {needsSetup ? (
        <p className="text-sm text-amber-400">
          {error ?? "Not connected yet."} See the README to add credentials.
        </p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : loading && isEmpty ? (
        <p className="font-mono text-xs text-muted">loading…</p>
      ) : (
        children
      )}
    </section>
  );
}
