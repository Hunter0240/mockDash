import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Widget } from "./Widget";
import { ErrorBoundary } from "./ErrorBoundary";
import { LineChartWidget } from "./charts/LineChart";
import { BarChartWidget } from "./charts/BarChart";
import { StatCard, statFromSeries } from "./charts/StatCard";
import { Gauge } from "./charts/Gauge";
import { DataTable } from "./charts/DataTable";
import { LogStream } from "./charts/LogStream";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMetrics } from "@/hooks/useMetrics";
import { exportCsv } from "@/utils/csv";
import { metricColor } from "@/tokens";
import type { DataPoint, WidgetConfig, WsMessage } from "@/types";

const ResponsiveGrid = WidthProvider(Responsive);

interface DashboardProps {
  dashboardId: number;
  layout: WidgetConfig[];
  onLayoutChange?: (layout: WidgetConfig[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

function widgetsToGridLayout(widgets: WidgetConfig[]): Layout[] {
  return widgets.map((w) => ({
    i: w.widget_id,
    x: w.col,
    y: w.row,
    w: w.col_span,
    h: w.row_span,
    minW: 1,
    minH: 1,
  }));
}

export function Dashboard({
  dashboardId,
  layout,
  onLayoutChange,
  onConnectionChange,
}: DashboardProps) {
  const { messages, connected, subscribe } = useWebSocket(dashboardId);

  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);
  const [ranges, setRanges] = useState<Record<string, string>>({});
  const widgetsRef = useRef(layout);
  widgetsRef.current = layout;

  const widgetIds = useMemo(() => layout.map((w) => w.widget_id), [layout]);

  useEffect(() => {
    if (widgetIds.length > 0) {
      subscribe(widgetIds);
    }
  }, [widgetIds, subscribe]);

  const gridLayout = useMemo(() => widgetsToGridLayout(layout), [layout]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!onLayoutChange) return;
      const updated = widgetsRef.current.map((w) => {
        const item = newLayout.find((l) => l.i === w.widget_id);
        if (!item) return w;
        return { ...w, col: item.x, row: item.y, col_span: item.w, row_span: item.h };
      });
      onLayoutChange(updated);
    },
    [onLayoutChange]
  );

  return (
    <div>
      <ResponsiveGrid
        layouts={{ lg: gridLayout, md: gridLayout, sm: gridLayout }}
        breakpoints={{ lg: 1024, md: 768, sm: 0 }}
        cols={{ lg: 4, md: 2, sm: 1 }}
        rowHeight={140}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        isResizable={true}
        compactType="vertical"
        margin={[16, 16]}
      >
        {layout.map((widget) => (
          <div key={widget.widget_id}>
            <ErrorBoundary>
              <MemoWidgetSlot
                config={widget}
                liveMessage={messages.get(widget.widget_id)}
                range={ranges[widget.widget_id] ?? "1h"}
                setRanges={setRanges}
              />
            </ErrorBoundary>
          </div>
        ))}
      </ResponsiveGrid>
    </div>
  );
}

function MemoWidgetSlot({
  config,
  liveMessage,
  range,
  setRanges,
}: {
  config: WidgetConfig;
  liveMessage?: WsMessage;
  range: string;
  setRanges: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const onRangeChange = useCallback(
    (r: string) => setRanges((prev) => ({ ...prev, [config.widget_id]: r })),
    [config.widget_id, setRanges]
  );
  return (
    <WidgetSlot
      config={config}
      liveMessage={liveMessage}
      range={range}
      onRangeChange={onRangeChange}
    />
  );
}

const WidgetSlot = memo(function WidgetSlot({
  config,
  liveMessage,
  range,
  onRangeChange,
}: {
  config: WidgetConfig;
  liveMessage?: WsMessage;
  range: string;
  onRangeChange: (r: string) => void;
}) {
  const { data: historicalData, isLoading, error, refetch } = useMetrics({
    source: config.source,
    query: config.query,
    range,
    refetchInterval: 60_000,
  });

  const historyRef = useRef<DataPoint[]>([]);
  const seededRef = useRef(false);

  if (historicalData && historicalData.length > 0 && !seededRef.current) {
    historyRef.current = [...historicalData];
    seededRef.current = true;
  }

  if (liveMessage) {
    const point: DataPoint = {
      timestamp: liveMessage.timestamp,
      series: liveMessage.data.series,
    };
    const history = historyRef.current;
    if (
      history.length === 0 ||
      history[history.length - 1].timestamp !== point.timestamp
    ) {
      if (history.length >= 200) {
        history.splice(0, history.length - 199);
      }
      history.push(point);
    }
  }

  const displayData =
    historyRef.current.length > 0
      ? historyRef.current
      : (historicalData ?? []);

  const latestSeries = liveMessage?.data.series ?? [];

  const prevRef = useRef<number | null>(null);
  const renderedPrevRef = useRef<number | null>(null);
  const currentValue =
    latestSeries.length > 0 ? latestSeries[0].value : null;
  const previousValue = renderedPrevRef.current;

  useEffect(() => {
    if (currentValue !== null) {
      renderedPrevRef.current = prevRef.current;
      prevRef.current = currentValue;
    }
  }, [currentValue]);

  const handleExport = () => exportCsv(displayData, config.title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase());
  const showRange = config.widget_type !== "stat";

  if (error && displayData.length === 0) {
    return (
      <Widget title={config.title}>
        <div
          className="flex flex-col items-center justify-center h-full"
          style={{ gap: "var(--space-sm)", color: "var(--color-status-crit)", fontSize: "var(--text-sm)" }}
        >
          <span>Failed to load data</span>
          <button
            onClick={() => refetch()}
            className="btn-icon rounded"
            style={{
              fontSize: "var(--text-xs)",
              padding: "var(--space-xs) var(--space-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            Retry
          </button>
        </div>
      </Widget>
    );
  }

  if (isLoading && displayData.length === 0) {
    return (
      <Widget title={config.title}>
        <WidgetSkeleton type={config.widget_type} />
      </Widget>
    );
  }

  if (config.widget_type === "stat") {
    const metricLabel =
      (config.config.metric as string) ??
      (latestSeries[0]?.label || config.query.split(",")[0] || "value");
    const stat = statFromSeries(latestSeries, metricLabel);
    const sparkline = displayData.map((d) => {
      const s = d.series.find((p) => p.label === metricLabel);
      return { value: s?.value ?? 0 };
    });

    const unit = (config.config.unit as string) ?? "";
    const color = metricColor(metricLabel);
    const formatted = stat.value !== null && stat.value !== undefined
      ? stat.value.toFixed(1)
      : "--";

    return (
      <Widget
        title={config.title}
        subtitle={
          <span className="font-semibold tabular-nums" style={{ fontSize: "var(--text-lg)", color }}>
            {formatted}{unit && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginLeft: 2 }}>{unit}</span>}
          </span>
        }
        onExport={handleExport}
      >
        <StatCard
          sparkline={sparkline}
          color={color}
        />
      </Widget>
    );
  }

  if (config.widget_type === "line") {
    return (
      <Widget
        title={config.title}
        onRefresh={() => refetch()}
        onRangeChange={showRange ? onRangeChange : undefined}
        onExport={handleExport}
      >
        <LineChartWidget
          data={displayData}
          seriesKeys={config.config.series as string[] | undefined}
        />
      </Widget>
    );
  }

  if (config.widget_type === "bar") {
    return (
      <Widget
        title={config.title}
        onRefresh={() => refetch()}
        onRangeChange={onRangeChange}
        onExport={handleExport}
      >
        <BarChartWidget
          data={displayData}
          seriesKeys={config.config.series as string[] | undefined}
        />
      </Widget>
    );
  }

  if (config.widget_type === "gauge") {
    const metricLabel =
      (config.config.metric as string) ??
      (latestSeries[0]?.label || config.query.split(",")[0] || "value");
    const point = latestSeries.find((s) => s.label === metricLabel);

    return (
      <Widget title={config.title} onExport={handleExport}>
        <Gauge
          value={point?.value ?? null}
          min={(config.config.min as number) ?? 0}
          max={(config.config.max as number) ?? 100}
          unit={(config.config.unit as string) ?? ""}
          thresholds={
            config.config.thresholds as
              | { warn: number; crit: number }
              | undefined
          }
        />
      </Widget>
    );
  }

  if (config.widget_type === "table") {
    return (
      <Widget
        title={config.title}
        onRefresh={() => refetch()}
        onRangeChange={onRangeChange}
        onExport={handleExport}
      >
        <DataTable data={displayData} />
      </Widget>
    );
  }

  if (config.widget_type === "log") {
    return (
      <Widget title={config.title} onExport={handleExport}>
        <LogStream data={displayData} />
      </Widget>
    );
  }

  return (
    <Widget title={config.title}>
      <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Unknown widget type: {config.widget_type}
      </div>
    </Widget>
  );
});

const skeletonPulse: React.CSSProperties = {
  backgroundColor: "var(--color-surface-sunken)",
  borderRadius: "4px",
  animation: "skeleton-pulse 1.5s ease-in-out infinite",
};

function WidgetSkeleton({ type }: { type: string }) {
  if (type === "stat") {
    return (
      <div className="flex flex-col justify-between h-full" style={{ padding: "var(--space-sm) 0" }}>
        <div style={{ ...skeletonPulse, width: "40%", height: "12px" }} />
        <div style={{ ...skeletonPulse, width: "60%", height: "28px", marginTop: "var(--space-sm)" }} />
        <div style={{ ...skeletonPulse, width: "100%", height: "24px", marginTop: "var(--space-sm)" }} />
      </div>
    );
  }
  if (type === "gauge") {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ ...skeletonPulse, width: "120px", height: "70px", borderRadius: "60px 60px 0 0" }} />
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-end h-full" style={{ gap: "var(--space-xs)" }}>
      {[65, 40, 80, 55, 70, 35, 60].map((w, i) => (
        <div key={i} style={{ ...skeletonPulse, width: `${w}%`, height: "8px" }} />
      ))}
    </div>
  );
}
