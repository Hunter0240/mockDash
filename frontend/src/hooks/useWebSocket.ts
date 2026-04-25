import { useCallback, useEffect, useRef, useState } from "react";
import type { WsMessage } from "@/types";
import { isDemoMode, generateLivePoint, parseMetrics } from "@/demo";

const MAX_BACKOFF = 30000;

const DEMO_WIDGET_QUERIES: Record<string, string> = {
  cpu_stat: "cpu",
  memory_stat: "memory",
  requests_stat: "requests",
  latency_stat: "latency",
  cpu_chart: "cpu,memory",
  traffic_chart: "requests,errors",
  cpu_gauge: "cpu",
  error_bar: "errors,latency",
  metrics_table: "cpu,memory,requests",
  log_stream: "cpu,memory,requests,latency,errors,connections",
};

export function useWebSocket(dashboardId: number | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const [messages, setMessages] = useState<Map<string, WsMessage>>(new Map());
  const [connected, setConnected] = useState(false);
  const subscribedRef = useRef<Set<string>>(new Set());
  const demoIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const connect = useCallback(() => {
    if (dashboardId === null) return;

    if (isDemoMode()) {
      setConnected(true);
      demoIntervalRef.current = setInterval(() => {
        setMessages((prev) => {
          const next = new Map(prev);
          subscribedRef.current.forEach((widgetId) => {
            const query = DEMO_WIDGET_QUERIES[widgetId] ?? "cpu";
            const metrics = parseMetrics(query);
            const point = generateLivePoint(metrics);
            next.set(widgetId, {
              widget_id: widgetId,
              timestamp: point.timestamp,
              data: { series: point.series },
            });
          });
          return next;
        });
      }, 2000);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/dashboard/${dashboardId}`
    );

    ws.onopen = () => {
      setConnected(true);
      backoffRef.current = 1000;
      if (subscribedRef.current.size > 0) {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            widget_ids: Array.from(subscribedRef.current),
          })
        );
      }
    };

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);
      setMessages((prev) => {
        const next = new Map(prev);
        next.set(msg.widget_id, msg);
        return next;
      });
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(backoffRef.current, MAX_BACKOFF);
      backoffRef.current = delay * 2;
      setTimeout(connect, delay);
    };

    wsRef.current = ws;
  }, [dashboardId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearInterval(demoIntervalRef.current);
    };
  }, [connect]);

  const subscribe = useCallback((widgetIds: string[]) => {
    widgetIds.forEach((id) => subscribedRef.current.add(id));
    if (isDemoMode()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "subscribe", widget_ids: widgetIds })
      );
    }
  }, []);

  const unsubscribe = useCallback((widgetIds: string[]) => {
    widgetIds.forEach((id) => subscribedRef.current.delete(id));
    if (isDemoMode()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "unsubscribe", widget_ids: widgetIds })
      );
    }
  }, []);

  return { messages, connected, subscribe, unsubscribe };
}
