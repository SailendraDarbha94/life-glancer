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
      accent="text-sky-400"
      loading={loading}
      isEmpty={!data}
      error={error}
      needsSetup={needsSetup}
      onRefresh={refresh}
    >
      {data && (
        <ul className="flex flex-col divide-y divide-edge">
          {data.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <span className="w-12 shrink-0 font-mono text-[10px] tracking-wide text-muted uppercase">
                {driveKind(f.mimeType)}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={f.webViewLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-foreground transition-colors hover:text-accent"
                >
                  {f.name}
                </a>
                <p className="truncate text-xs text-muted">
                  {relativeTime(f.modifiedTime)}
                  {f.modifiedBy ? ` · ${f.modifiedBy}` : ""}
                </p>
              </div>
            </li>
          ))}
          {data.files.length === 0 && (
            <li className="py-2 text-sm text-muted">No recent files.</li>
          )}
        </ul>
      )}
    </Card>
  );
}
