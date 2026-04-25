import { memo, useEffect, useRef } from "react";
import type { DataPoint } from "@/types";

interface LogStreamProps {
  data: DataPoint[];
  maxLines?: number;
}

export const LogStream = memo(function LogStream({ data, maxLines = 200 }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data.length]);

  const lines = data.slice(-maxLines);

  if (lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Waiting for data...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-auto h-full font-mono leading-5" role="log" aria-live="off" style={{ fontSize: "var(--text-xs)" }}>
      {lines.map((point, i) => {
        const ts = new Date(point.timestamp).toLocaleTimeString();
        const values = point.series
          .map((s) => `${s.label}=${s.value.toFixed(2)}`)
          .join(" ");
        return (
          <div
            key={i}
            className="hover:bg-[var(--color-surface-sunken)]"
            style={{ padding: "0 var(--space-sm)" }}
          >
            <span style={{ color: "var(--color-text-muted)", marginRight: "var(--space-sm)" }}>{ts}</span>
            <span>{values}</span>
          </div>
        );
      })}
    </div>
  );
});
