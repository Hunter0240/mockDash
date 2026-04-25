import { type ReactNode, memo, useState } from "react";

interface WidgetProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  onRangeChange?: (range: string) => void;
  onExport?: () => void;
}

const RANGES = ["5m", "15m", "1h", "6h", "24h", "7d"];

export const Widget = memo(function Widget({
  title,
  subtitle,
  children,
  onRefresh,
  onRangeChange,
  onExport,
}: WidgetProps) {
  const [range, setRange] = useState("1h");

  return (
    <section
      className="flex flex-col h-full rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface-raised)",
      }}
    >
      <div
        className="flex items-center justify-between border-b cursor-move drag-handle"
        style={{ borderColor: "var(--color-border-subtle)", padding: "var(--space-sm) var(--space-md)" }}
      >
        <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
          <GripDots />
          <h2 className="font-medium truncate" style={{ fontSize: "var(--text-lg)" }}>{title}</h2>
          {subtitle && <>{subtitle}</>}
        </div>
        <div className="flex items-center shrink-0" style={{ gap: "var(--space-sm)" }}>
          {onRangeChange && (
            <div className="flex rounded overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRange(r);
                    onRangeChange(r);
                  }}
                  aria-label={`${r} time range`}
                  aria-pressed={range === r}
                  className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-focus)]"
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "var(--space-xs) var(--space-sm)",
                    backgroundColor: range === r ? "var(--color-text)" : "var(--color-surface-sunken)",
                    color: range === r ? "var(--color-surface)" : "var(--color-text-muted)",
                    transition: "background-color 150ms ease-out, color 150ms ease-out",
                    minHeight: "28px",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          {onExport && (
            <button
              onClick={onExport}
              title="Export as CSV"
              aria-label="Export data as CSV"
              className="btn-icon px-2 py-1.5 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-1"
              style={{ fontSize: "var(--text-xs)" }}
            >
              CSV
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh data"
              aria-label="Refresh data"
              className="btn-icon px-2 py-1.5 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-1"
              style={{ fontSize: "var(--text-base)" }}
            >
              &#x21bb;
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0" style={{ padding: "var(--space-md)" }}>{children}</div>
    </section>
  );
});

function GripDots() {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="currentColor"
      aria-hidden="true"
      style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
    >
      <circle cx="2" cy="2" r="1.2" />
      <circle cx="6" cy="2" r="1.2" />
      <circle cx="2" cy="7" r="1.2" />
      <circle cx="6" cy="7" r="1.2" />
      <circle cx="2" cy="12" r="1.2" />
      <circle cx="6" cy="12" r="1.2" />
    </svg>
  );
}
