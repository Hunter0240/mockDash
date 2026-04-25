export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DataPoint {
  timestamp: string;
  series: SeriesPoint[];
}

export interface WidgetConfig {
  widget_id: string;
  widget_type: "stat" | "line" | "bar" | "gauge" | "table" | "log";
  title: string;
  row: number;
  col: number;
  row_span: number;
  col_span: number;
  source: string;
  query: string;
  config: Record<string, unknown>;
}

export interface Dashboard {
  id: number;
  name: string;
  layout: WidgetConfig[];
  created_at: string;
  updated_at: string;
}

export interface WsMessage {
  widget_id: string;
  timestamp: string;
  data: { series: SeriesPoint[] };
}
