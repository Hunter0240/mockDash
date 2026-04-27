import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataPoint } from "@/types";
import { CHART_COLORS, chartTooltipStyle } from "@/tokens";

interface LineChartWidgetProps {
  data: DataPoint[];
  seriesKeys?: string[];
}

export const LineChartWidget = memo(function LineChartWidget({ data, seriesKeys }: LineChartWidgetProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        No data
      </div>
    );
  }

  const keys = useMemo(
    () =>
      seriesKeys ??
      Array.from(new Set(data.flatMap((d) => d.series.map((s) => s.label)))),
    [data, seriesKeys]
  );

  const chartData = useMemo(
    () =>
      data.map((point) => {
        const row: Record<string, unknown> = {
          time: new Date(point.timestamp).toLocaleTimeString(),
        };
        for (const s of point.series) {
          row[s.label] = s.value;
        }
        return row;
      }),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" opacity={0.3} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          stroke="var(--color-axis)"
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} stroke="var(--color-axis)" tickLine={false} />
        <Tooltip contentStyle={chartTooltipStyle()} />
        <Legend wrapperStyle={{ fontSize: "var(--text-sm)" }} />
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
});
