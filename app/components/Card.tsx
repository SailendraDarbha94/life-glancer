"use client";

import type { ReactNode } from "react";

interface CardProps {
  title: string;
  accent?: string; // tailwind bg color class for the title dot
  loading?: boolean;
  isEmpty?: boolean; // true while there is no data to show yet
  error?: string | null;
  needsSetup?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

// Shared widget shell: title row, refresh affordance, and consistent
// loading / not-connected / error states so each widget body stays focused
// on rendering its own data.
export function Card({
  title,
  accent = "bg-zinc-400",
  loading,
  isEmpty,
  error,
  needsSetup,
  onRefresh,
  children,
}: CardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.1] dark:bg-zinc-900">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          <span className={`inline-block h-2 w-2 rounded-full ${accent}`} />
          {title}
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label={`Refresh ${title}`}
          >
            {loading ? "…" : "refresh"}
          </button>
        )}
      </header>

      {needsSetup ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {error ?? "Not connected yet."} See the README to add credentials.
        </p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : loading && isEmpty ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : (
        children
      )}
    </section>
  );
}
