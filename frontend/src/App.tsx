import { useCallback, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "@/components/Dashboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePersistedSettings } from "@/hooks/usePersistedSettings";
import { isDemoMode } from "@/demo";
import type { Dashboard as DashboardType, WidgetConfig } from "@/types";

const CHART_VARS = [
  "--color-chart-1",
  "--color-chart-2",
];

const queryClient = new QueryClient();

const DEFAULT_LAYOUT: WidgetConfig[] = [
  {
    widget_id: "cpu_stat",
    widget_type: "stat",
    title: "CPU Usage",
    row: 0,
    col: 0,
    row_span: 1,
    col_span: 1,
    source: "demo",
    query: "cpu",
    config: { metric: "cpu", unit: "%", min: 0, max: 100 },
  },
  {
    widget_id: "memory_stat",
    widget_type: "stat",
    title: "Memory",
    row: 0,
    col: 1,
    row_span: 1,
    col_span: 1,
    source: "demo",
    query: "memory",
    config: { metric: "memory", unit: "%", min: 0, max: 100 },
  },
  {
    widget_id: "requests_stat",
    widget_type: "stat",
    title: "Requests/s",
    row: 0,
    col: 2,
    row_span: 1,
    col_span: 1,
    source: "demo",
    query: "requests",
    config: { metric: "requests", unit: "req/s" },
  },
  {
    widget_id: "latency_stat",
    widget_type: "stat",
    title: "Latency",
    row: 0,
    col: 3,
    row_span: 1,
    col_span: 1,
    source: "demo",
    query: "latency",
    config: { metric: "latency", unit: "ms" },
  },
  {
    widget_id: "cpu_chart",
    widget_type: "line",
    title: "CPU + Memory",
    row: 1,
    col: 0,
    row_span: 2,
    col_span: 2,
    source: "demo",
    query: "cpu,memory",
    config: { series: ["cpu", "memory"] },
  },
  {
    widget_id: "traffic_chart",
    widget_type: "line",
    title: "Traffic",
    row: 1,
    col: 2,
    row_span: 2,
    col_span: 2,
    source: "demo",
    query: "requests,errors",
    config: { series: ["requests", "errors"] },
  },
  {
    widget_id: "cpu_gauge",
    widget_type: "gauge",
    title: "CPU Gauge",
    row: 3,
    col: 0,
    row_span: 2,
    col_span: 1,
    source: "demo",
    query: "cpu",
    config: { metric: "cpu", unit: "%", min: 0, max: 100, thresholds: { warn: 70, crit: 90 } },
  },
  {
    widget_id: "error_bar",
    widget_type: "bar",
    title: "Errors by Interval",
    row: 3,
    col: 1,
    row_span: 2,
    col_span: 2,
    source: "demo",
    query: "errors,latency",
    config: { series: ["errors", "latency"] },
  },
  {
    widget_id: "metrics_table",
    widget_type: "table",
    title: "Metrics Table",
    row: 3,
    col: 3,
    row_span: 2,
    col_span: 1,
    source: "demo",
    query: "cpu,memory,requests",
    config: {},
  },
  {
    widget_id: "log_stream",
    widget_type: "log",
    title: "Log Stream",
    row: 5,
    col: 0,
    row_span: 2,
    col_span: 4,
    source: "demo",
    query: "cpu,memory,requests,latency,errors,connections",
    config: {},
  },
];

function App() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const { settings, update: updateSettings } = usePersistedSettings();
  const { theme, dark } = settings;
  const [connected, setConnected] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", dark);
    el.classList.remove("theme-stone", "theme-carbon");
    if (theme !== "slate") el.classList.add(`theme-${theme}`);
    el.classList.toggle("force-reduced-motion", settings.reducedMotion);
    el.classList.toggle("force-high-contrast", settings.highContrast);
    if (settings.chartColors) {
      settings.chartColors.forEach((hex, i) => {
        if (CHART_VARS[i]) el.style.setProperty(CHART_VARS[i], hex);
      });
    } else {
      CHART_VARS.forEach((v) => el.style.removeProperty(v));
    }
  }, [dark, theme, settings.reducedMotion, settings.highContrast, settings.chartColors]);

  useEffect(() => {
    if (isDemoMode()) {
      setDashboard({
        id: 0,
        name: "Demo",
        layout: DEFAULT_LAYOUT,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }
    fetch("/api/dashboards")
      .then((r) => r.json())
      .then((dashboards: DashboardType[]) => {
        if (dashboards.length > 0) {
          setDashboard(dashboards[0]);
        } else {
          return fetch("/api/dashboards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Default", layout: DEFAULT_LAYOUT }),
          })
            .then((r) => r.json())
            .then((d: DashboardType) => setDashboard(d));
        }
      })
      .catch(console.error);
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: WidgetConfig[]) => {
      if (!dashboard) return;
      setDashboard((d) => (d ? { ...d, layout: newLayout } : d));
      if (isDemoMode()) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch(`/api/dashboards/${dashboard.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: newLayout }),
        }).catch(console.error);
      }, 1000);
    },
    [dashboard]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}>
        <a
          href="#dashboard"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:ring-2 focus:ring-[var(--color-focus)]"
          style={{
            padding: "var(--space-sm) var(--space-md)",
            backgroundColor: "var(--color-surface-raised)",
            color: "var(--color-text)",
            fontSize: "var(--text-sm)",
          }}
        >
          Skip to dashboard
        </a>
        <header
          className="border-b flex items-center justify-between"
          style={{ borderColor: "var(--color-border)", padding: "var(--space-md) var(--space-xl)" }}
        >
          <div className="flex items-baseline" style={{ gap: "var(--space-sm)" }}>
            <h1 className="font-semibold" style={{ fontSize: "var(--text-xl)", lineHeight: "var(--leading-tight)" }}>mockDash</h1>
            {dashboard && (
              <div
                className="flex items-center"
                role="status"
                aria-live="polite"
                style={{ gap: "var(--space-xs)" }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: connected ? "var(--color-status-ok)" : "var(--color-status-crit)",
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {connected ? "Live" : "Reconnecting"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center" style={{ gap: "var(--space-md)" }}>
            <SettingsPanel
              theme={theme}
              dark={dark}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              chartColors={settings.chartColors}
              onThemeChange={(t) => updateSettings({ theme: t })}
              onDarkChange={(d) => updateSettings({ dark: d })}
              onReducedMotionChange={(v) => updateSettings({ reducedMotion: v })}
              onHighContrastChange={(v) => updateSettings({ highContrast: v })}
              onChartColorsChange={(c) => updateSettings({ chartColors: c })}
            />
          </div>
        </header>
        {dashboard && !connected && (
          <div
            role="alert"
            style={{
              backgroundColor: "var(--color-status-warn)",
              color: "var(--color-text)",
              fontSize: "var(--text-sm)",
              padding: "var(--space-xs) var(--space-xl)",
              textAlign: "center",
            }}
          >
            Connection lost -- reconnecting...
          </div>
        )}
        <main id="dashboard" style={{ padding: "var(--space-lg) var(--space-xl)" }} role="main">
          <ErrorBoundary>
            {dashboard ? (
              <Dashboard
                dashboardId={dashboard.id}
                layout={dashboard.layout}
                onLayoutChange={handleLayoutChange}
                onConnectionChange={setConnected}
              />
            ) : (
              <div className="flex items-center justify-center h-32 sm:h-48 md:h-64" role="status" aria-label="Loading" style={{ color: "var(--color-text-muted)" }}>
                Loading dashboard...
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
