"use client";

import { useState } from "react";
import { useApi } from "./useApi";
import { Card } from "./Card";
import { CleanupPanel } from "./CleanupPanel";
import type { InboxData, InboxSummaryData } from "@/lib/types";

export function InboxCard() {
  const inbox = useApi<InboxData>("/api/gmail", 5 * 60_000);
  // Separate, slower digest of Primary unread — the "split" summary.
  const summary = useApi<InboxSummaryData>("/api/inbox-summary", 30 * 60_000);
  const [showCleanup, setShowCleanup] = useState(false);

  return (
    <Card
      title="Inbox · Primary"
      accent="text-rose-400"
      loading={inbox.loading}
      isEmpty={!inbox.data}
      error={inbox.error}
      needsSetup={inbox.needsSetup}
      onRefresh={inbox.refresh}
    >
      {inbox.data && (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-3xl font-semibold text-foreground">
              {inbox.data.unreadCount}
              {inbox.data.unreadCountCapped ? "+" : ""}
              <span className="ml-2 text-sm font-normal text-muted">
                unread
              </span>
            </p>
            <button
              onClick={() => setShowCleanup((v) => !v)}
              className="font-mono text-[10px] tracking-widest text-muted uppercase transition-colors hover:text-red-400"
            >
              clean up tabs
            </button>
          </div>

          {/* dedicated inbox digest (distinct from the daily briefing) */}
          {summary.data ? (
            <p className="border-l border-edge pl-3 text-sm leading-relaxed text-muted">
              {summary.data.summary}
            </p>
          ) : summary.loading ? (
            <p className="font-mono text-xs text-muted">summarizing…</p>
          ) : null}

          <ul className="flex flex-col divide-y divide-edge">
            {inbox.data.messages.map((m) => (
              <li key={m.id} className="py-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {m.from}
                </span>
                <p className="truncate text-sm text-muted">{m.subject}</p>
                <p className="truncate text-xs text-muted/70">{m.snippet}</p>
              </li>
            ))}
            {inbox.data.messages.length === 0 && (
              <li className="py-2 text-sm text-muted">Primary inbox zero. Nice.</li>
            )}
          </ul>

          {showCleanup && (
            <CleanupPanel
              onClose={() => setShowCleanup(false)}
              onDone={inbox.refresh}
            />
          )}
        </div>
      )}
    </Card>
  );
}
