"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "@/lib/types";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  needsSetup: boolean;
  loading: boolean;
  refresh: () => void;
}

// Fetch an ApiResult<T> endpoint with loading/error state and manual refresh.
// Optionally re-fetches on an interval (ms).
export function useApi<T>(path: string, refreshMs?: number): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(path, { cache: "no-store" });
      const json = (await res.json()) as ApiResult<T>;
      if (json.ok) {
        setData(json.data);
        setError(null);
        setNeedsSetup(false);
      } else {
        setError(json.error);
        setNeedsSetup(Boolean(json.needsSetup));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
    if (!refreshMs) return;
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { data, error, needsSetup, loading, refresh: load };
}
