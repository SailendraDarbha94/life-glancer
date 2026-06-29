"use client";

import { useApi } from "./useApi";
import { Card } from "./Card";
import type { InboxData } from "@/lib/types";

export function InboxCard() {
  const { data, error, needsSetup, loading, refresh } = useApi<InboxData>(
    "/api/gmail",
    5 * 60_000,
  );

  return (
    <Card
      title="Inbox"
      accent="bg-rose-400"
      loading={loading}
      isEmpty={!data}
      error={error}
      needsSetup={needsSetup}
      onRefresh={refresh}
    >
      {data && (
        <div className="flex flex-col gap-3">
          <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {data.unreadCount}
            <span className="ml-2 text-sm font-normal text-zinc-500">unread</span>
          </p>
          <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
            {data.messages.map((m) => (
              <li key={m.id} className="py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {m.from}
                  </span>
                </div>
                <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                  {m.subject}
                </p>
                <p className="truncate text-xs text-zinc-400">{m.snippet}</p>
              </li>
            ))}
            {data.messages.length === 0 && (
              <li className="py-2 text-sm text-zinc-400">Inbox zero. Nice.</li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}
