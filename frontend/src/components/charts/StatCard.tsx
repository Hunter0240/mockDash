import { memo } from "react";
import type { SeriesPoint } from "@/types";

interface StatCardProps {
  sparkline?: { value: number }[];
  color?: string;
}

function sparklinePath(data: { value: number }[]): string {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export const StatCard = memo(function StatCard({
  sparkline,
  color = "var(--color-chart-1)",
}: StatCardProps) {
  if (!sparkline || sparkline.length < 2) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <path
        d={sparklinePath(sparkline)}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

export function statFromSeries(
  series: SeriesPoint[],
  metricLabel: string
): { value: number | null } {
  const point = series.find((s) => s.label === metricLabel);
  return { value: point?.value ?? null };
}
