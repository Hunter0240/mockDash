import type { DataPoint, SeriesPoint } from "@/types";

export function isDemoMode(): boolean {
  return new URLSearchParams(window.location.search).has("demo");
}

function noise(base: number, amplitude: number): number {
  return base + (Math.random() - 0.5) * 2 * amplitude;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const state: Record<string, number> = {
  cpu: 45,
  memory: 62,
  requests: 1200,
  latency: 85,
  errors: 12,
  connections: 340,
};

function tick(metric: string): number {
  const configs: Record<string, { min: number; max: number; drift: number }> = {
    cpu: { min: 5, max: 98, drift: 8 },
    memory: { min: 30, max: 95, drift: 3 },
    requests: { min: 200, max: 5000, drift: 300 },
    latency: { min: 10, max: 500, drift: 25 },
    errors: { min: 0, max: 100, drift: 8 },
    connections: { min: 50, max: 1000, drift: 40 },
  };
  const cfg = configs[metric] ?? { min: 0, max: 100, drift: 10 };
  state[metric] = clamp(noise(state[metric], cfg.drift), cfg.min, cfg.max);
  return Math.round(state[metric] * 100) / 100;
}

export function generateHistory(
  metrics: string[],
  points: number = 60
): DataPoint[] {
  const now = Date.now();
  const interval = 5000;
  const data: DataPoint[] = [];

  for (let i = points; i >= 0; i--) {
    const series: SeriesPoint[] = metrics.map((label) => ({
      label,
      value: tick(label),
    }));
    data.push({
      timestamp: new Date(now - i * interval).toISOString(),
      series,
    });
  }
  return data;
}

export function generateLivePoint(metrics: string[]): {
  timestamp: string;
  series: SeriesPoint[];
} {
  return {
    timestamp: new Date().toISOString(),
    series: metrics.map((label) => ({
      label,
      value: tick(label),
    })),
  };
}

export function parseMetrics(query: string): string[] {
  return query.split(",").map((s) => s.trim()).filter(Boolean);
}
