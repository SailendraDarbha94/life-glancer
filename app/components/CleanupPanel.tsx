"use client";

import { useState } from "react";
import { useApi } from "./useApi";
import type {
  ApiResult,
  CategoryCounts,
  CleanupCategory,
  CleanupResult,
} from "@/lib/types";

const LABELS: Record<CleanupCategory, string> = {
  social: "Social",
  promotions: "Promotions",
  updates: "Updates",
  forums: "Forums",
};
const ORDER: CleanupCategory[] = ["social", "promotions", "updates", "forums"];

// Irreversible permanent-delete UI. Guarded three ways: the server allowlist,
// a type-"DELETE" gate, and a dry-run preview.
export function CleanupPanel({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone?: () => void;
}) {
  const counts = useApi<CategoryCounts>("/api/inbox/categories");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const armed = confirmText.trim().toUpperCase() === "DELETE";
  const total = counts.data?.total;

  async function run(dryRun: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/inbox/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dryRun ? { dryRun: true } : { confirm: "DELETE" }),
      });
      const json = (await res.json()) as ApiResult<CleanupResult>;
      if (!json.ok) {
        setMessage(json.error);
      } else if (json.data.dryRun) {
        setMessage(`Preview: ${json.data.deleted} message(s) would be deleted.`);
      } else {
        setMessage(`Permanently deleted ${json.data.deleted} message(s).`);
        setConfirmText("");
        counts.refresh();
        onDone?.();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Cleanup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-red-400 uppercase">
          Clean up tabs · permanent
        </span>
        <button
          onClick={onClose}
          className="font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground"
        >
          close
        </button>
      </div>

      {counts.needsSetup ? (
        <p className="text-xs text-amber-400">{counts.error}</p>
      ) : counts.error ? (
        <p className="text-xs text-red-400">{counts.error}</p>
      ) : (
        <div className="mb-3 grid grid-cols-4 gap-2 text-center">
          {ORDER.map((c) => {
            const cell = counts.data?.perCategory[c];
            return (
              <div key={c} className="rounded bg-black/30 py-2">
                <p className="font-mono text-lg text-foreground">
                  {cell ? `${cell.count}${cell.capped ? "+" : ""}` : "·"}
                </p>
                <p className="text-[10px] text-muted">{LABELS[c]}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mb-3 text-xs leading-relaxed text-muted">
        Permanently deletes <span className="text-red-400">all</span> Social,
        Promotions, Updates and Forums mail
        {total != null ? ` (~${total}${counts.data?.totalCapped ? "+" : ""} shown; use Preview for the exact count)` : ""}.
        This cannot be undone.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="type DELETE"
          aria-label="Type DELETE to confirm"
          className="w-32 rounded border border-edge bg-black/40 px-2 py-1 font-mono text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          onClick={() => run(false)}
          disabled={!armed || busy}
          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "working…" : "Permanently delete"}
        </button>
        <button
          onClick={() => run(true)}
          disabled={busy}
          className="rounded border border-edge px-3 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40"
        >
          Preview only
        </button>
      </div>

      {message && <p className="mt-3 font-mono text-xs text-accent">{message}</p>}
    </div>
  );
}
