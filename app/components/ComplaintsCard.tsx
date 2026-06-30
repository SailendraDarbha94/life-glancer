"use client";

import { useApi } from "./useApi";
import { Card } from "./Card";
import { shortDate } from "./format";
import type { ComplaintsData } from "@/lib/types";

export function ComplaintsCard() {
  const { data, error, needsSetup, loading, refresh } = useApi<ComplaintsData>(
    "/api/complaints",
    5 * 60_000,
  );

  return (
    <Card
      title="KSDC complaints"
      accent="text-teal-400"
      loading={loading}
      isEmpty={!data}
      error={error}
      needsSetup={needsSetup}
      onRefresh={refresh}
    >
      {data && (
        <div className="flex flex-col gap-4">
          {/* Pipeline rollup */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="To do" value={data.byBucket.todo} tone="text-amber-400" />
            <Stat
              label="In progress"
              value={data.byBucket.inProgress}
              tone="text-sky-400"
            />
            <Stat label="Done" value={data.byBucket.done} tone="text-teal-400" />
          </div>

          <div>
            <p className="mb-1 font-mono text-[10px] tracking-widest text-muted uppercase">
              Upcoming inquiries
            </p>
            <ul className="flex flex-col divide-y divide-edge">
              {data.upcomingInquiries.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors hover:text-accent"
                  >
                    {c.complaintId}
                    {c.doctor ? <span className="text-muted"> · {c.doctor}</span> : null}
                  </a>
                  <span className="shrink-0 font-mono text-xs font-medium text-muted">
                    {shortDate(c.inquiryDate)}
                  </span>
                </li>
              ))}
              {data.upcomingInquiries.length === 0 && (
                <li className="py-2 text-sm text-muted">No hearings scheduled.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-edge bg-black/20 py-2">
      <p className={`font-mono text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
