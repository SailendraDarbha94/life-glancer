"use client";

import { useApi } from "./useApi";
import { Card } from "./Card";
import { shortDate, isOverdue } from "./format";
import type { TasksData } from "@/lib/types";

export function TasksCard() {
  const { data, error, needsSetup, loading, refresh } = useApi<TasksData>(
    "/api/tasks",
    5 * 60_000,
  );

  return (
    <Card
      title="Tasks"
      accent="bg-violet-400"
      loading={loading}
      isEmpty={!data}
      error={error}
      needsSetup={needsSetup}
      onRefresh={refresh}
    >
      {data && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {data.open.length}
            </span>{" "}
            open · {data.doneCount} done
          </p>
          <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
            {data.open.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-zinc-800 hover:underline dark:text-zinc-100"
                >
                  {t.name}
                </a>
                <span
                  className={`shrink-0 text-xs ${
                    isOverdue(t.due)
                      ? "font-medium text-red-500"
                      : "text-zinc-400"
                  }`}
                >
                  {shortDate(t.due)}
                </span>
              </li>
            ))}
            {data.open.length === 0 && (
              <li className="py-2 text-sm text-zinc-400">All clear.</li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}
