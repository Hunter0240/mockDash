import { memo, useMemo, useState } from "react";
import type { DataPoint } from "@/types";

interface DataTableProps {
  data: DataPoint[];
}

type SortDir = "asc" | "desc";

export const DataTable = memo(function DataTable({ data }: DataTableProps) {
  const [sortCol, setSortCol] = useState<string>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const columns = useMemo(() => {
    const labels = new Set<string>();
    for (const d of data) {
      for (const s of d.series) labels.add(s.label);
    }
    return ["time", ...Array.from(labels)];
  }, [data]);

  const rows = useMemo(() => {
    const mapped = data.map((d) => {
      const row: Record<string, string | number> = {
        time: new Date(d.timestamp).toLocaleTimeString(),
        _ts: new Date(d.timestamp).getTime(),
      };
      for (const s of d.series) row[s.label] = s.value;
      return row;
    });

    const key = sortCol === "time" ? "_ts" : sortCol;
    mapped.sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return mapped;
  }, [data, sortCol, sortDir]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        No data
      </div>
    );
  }

  function toggleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full" style={{ fontSize: "var(--text-sm)" }}>
        <thead className="sticky top-0" style={{ backgroundColor: "var(--color-surface-raised)" }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => toggleSort(col)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSort(col);
                  }
                }}
                tabIndex={0}
                role="columnheader"
                aria-sort={sortCol === col ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="text-left font-medium uppercase tracking-wide cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-focus)]"
                style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", padding: "var(--space-xs) var(--space-md)" }}
              >
                {col}
                {sortCol === col && (
                  <span className="ml-1" aria-hidden="true">{sortDir === "asc" ? "^" : "v"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-[var(--color-border-subtle)]">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-[var(--color-surface-sunken)]">
              {columns.map((col) => (
                <td key={col} className="tabular-nums" style={{ padding: "var(--space-xs) var(--space-md)" }}>
                  {typeof row[col] === "number"
                    ? (row[col] as number).toFixed(2)
                    : (row[col] ?? "--")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
