import { useQuery } from "@tanstack/react-query";
import type { DataPoint } from "@/types";
import { isDemoMode, generateHistory, parseMetrics } from "@/demo";

interface UseMetricsOptions {
  source: string;
  query: string;
  range?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

async function fetchMetrics(
  source: string,
  query: string,
  range: string
): Promise<DataPoint[]> {
  if (isDemoMode()) {
    const metrics = parseMetrics(query);
    const points = range === "5m" ? 12 : range === "15m" ? 36 : 60;
    return generateHistory(metrics, points);
  }
  const res = await fetch(
    `/api/metrics/${encodeURIComponent(source)}/${encodeURIComponent(query)}?range=${range}`
  );
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`);
  return res.json();
}

export function useMetrics({
  source,
  query,
  range = "1h",
  enabled = true,
  refetchInterval,
}: UseMetricsOptions) {
  return useQuery({
    queryKey: ["metrics", source, query, range],
    queryFn: () => fetchMetrics(source, query, range),
    enabled,
    refetchInterval,
    staleTime: 10_000,
  });
}
