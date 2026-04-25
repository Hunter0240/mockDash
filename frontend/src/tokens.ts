export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
];

const METRIC_COLOR_MAP: Record<string, string> = {
  cpu: "var(--color-chart-1)",
  memory: "var(--color-chart-2)",
  requests: "var(--color-chart-1)",
  latency: "var(--color-chart-2)",
  errors: "var(--color-chart-2)",
  connections: "var(--color-chart-1)",
};

export function metricColor(metric: string): string {
  return METRIC_COLOR_MAP[metric] ?? CHART_COLORS[0];
}

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-tooltip-bg)",
  border: "1px solid var(--color-tooltip-border)",
  borderRadius: "6px",
  fontSize: "var(--text-sm)",
  fontFamily: "var(--font-sans)",
  color: "var(--color-text)",
};
