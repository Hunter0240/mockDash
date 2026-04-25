import { memo } from "react";

interface GaugeProps {
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  thresholds?: { warn: number; crit: number };
}

export const Gauge = memo(function Gauge({
  value,
  min = 0,
  max = 100,
  unit = "",
  thresholds = { warn: 70, crit: 90 },
}: GaugeProps) {
  const pct =
    value !== null ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

  let color = "var(--color-chart-1)";
  if (value !== null) {
    if (value >= thresholds.crit) color = "var(--color-status-crit)";
    else if (value >= thresholds.warn) color = "var(--color-status-warn)";
  }

  const r = 80;
  const cx = 100;
  const cy = 95;

  const arcPath = describeArc(cx, cy, r, -180, 0);
  const filledPath = describeArc(cx, cy, r, -180, -180 + pct * 180);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[200px]"
        role="img"
        aria-label={`Gauge: ${value !== null ? value.toFixed(1) : "no data"}${unit ? ` ${unit}` : ""}`}
      >
        <path
          d={arcPath}
          fill="none"
          stroke="var(--color-grid)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {value !== null && (
          <path
            d={filledPath}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize="24"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          {value !== null ? value.toFixed(1) : "--"}
        </text>
        {unit && (
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="11"
            fontFamily="var(--font-sans)"
          >
            {unit}
          </text>
        )}
      </svg>
    </div>
  );
});

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
