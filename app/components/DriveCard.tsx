"use client";

import { useApi } from "./useApi";
import { Card } from "./Card";
import { relativeTime, driveKind } from "./format";
import type { DriveData } from "@/lib/types";

export function DriveCard() {
  const { data, error, needsSetup, loading, refresh } = useApi<DriveData>(
    "/api/drive",
    5 * 60_000,
  );

  return (
    <Card
      title="Drive activity"
      accent="bg-sky-400"
      loading={loading}
      isEmpty={!data}
      error={error}
      needsSetup={needsSetup}
      onRefresh={refresh}
    >
      {data && (
        <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {data.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <span className="w-12 shrink-0 text-xs text-zinc-400">
                {driveKind(f.mimeType)}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={f.webViewLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-zinc-800 hover:underline dark:text-zinc-100"
                >
                  {f.name}
                </a>
                <p className="truncate text-xs text-zinc-400">
                  {relativeTime(f.modifiedTime)}
                  {f.modifiedBy ? ` · ${f.modifiedBy}` : ""}
                </p>
              </div>
            </li>
          ))}
          {data.files.length === 0 && (
            <li className="py-2 text-sm text-zinc-400">No recent files.</li>
          )}
        </ul>
      )}
    </Card>
  );
}
