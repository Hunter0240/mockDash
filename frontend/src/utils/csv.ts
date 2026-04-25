import type { DataPoint } from "@/types";

export function exportCsv(data: DataPoint[], filename: string) {
  if (data.length === 0) return;

  const labels = Array.from(
    new Set(data.flatMap((d) => d.series.map((s) => s.label)))
  );
  const header = ["timestamp", ...labels].join(",");
  const rows = data.map((d) => {
    const vals: Record<string, number> = {};
    for (const s of d.series) vals[s.label] = s.value;
    return [d.timestamp, ...labels.map((l) => vals[l] ?? "")].join(",");
  });

  const blob = new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
