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
      accent="bg-teal-400"
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
            <Stat label="To do" value={data.byBucket.todo} tone="text-amber-500" />
            <Stat
              label="In progress"
              value={data.byBucket.inProgress}
              tone="text-sky-500"
            />
            <Stat label="Done" value={data.byBucket.done} tone="text-teal-500" />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">
              Upcoming inquiries
            </p>
            <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
              {data.upcomingInquiries.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-zinc-800 hover:underline dark:text-zinc-100"
                  >
                    {c.complaintId}
                    {c.doctor ? <span className="text-zinc-400"> · {c.doctor}</span> : null}
                  </a>
                  <span className="shrink-0 text-xs font-medium text-zinc-500">
                    {shortDate(c.inquiryDate)}
                  </span>
                </li>
              ))}
              {data.upcomingInquiries.length === 0 && (
                <li className="py-2 text-sm text-zinc-400">No hearings scheduled.</li>
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
    <div className="rounded-lg bg-black/[.03] py-2 dark:bg-white/[.04]">
      <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
