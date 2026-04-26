# Dash

Real-time data dashboard with React frontend and FastAPI backend. Connects to any data source and presents live metrics through a drag-and-drop widget grid with WebSocket push updates.

**[Live Demo](https://hunter0240.github.io/mockDash/)**

## Features

- Six widget types: stat card, line chart, bar chart, gauge, data table, log stream
- Real-time updates via WebSocket with auto-reconnect and exponential backoff
- Drag-and-drop grid layout with resize (react-grid-layout)
- Layout persistence -- rearrange widgets and changes save automatically
- Pluggable data source adapters: Prometheus, REST API, database query, demo
- Time range selection per widget (5m, 15m, 1h, 6h, 24h, 7d)
- CSV export from any widget
- Dark/light theme
- Responsive breakpoints (4 / 2 / 1 column at lg / md / sm)
- Demo mode -- works out of the box with realistic mock metrics

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Recharts, TanStack Query, Tailwind CSS, react-grid-layout

**Backend:** Python 3.12, FastAPI, WebSocket, SQLAlchemy (async), httpx

**Infrastructure:** Docker, Docker Compose, Caddy

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Dashboard at http://localhost:3000. API docs at http://localhost:8000/docs.

The default dashboard ships with 10 demo widgets (stat cards, line charts, bar chart, gauge, data table, log stream) powered by a mock data source that generates realistic CPU, memory, request, and latency metrics.

## Quick Start with Prometheus + Grafana

```bash
docker compose -f docker-compose.demo.yml up --build
```

- Dashboard: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin)

Set `PROMETHEUS_URL=http://prometheus:9090` in `.env` to use Prometheus as a data source.

## Development

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/ws` to `localhost:8000`.

## Architecture

```
frontend/
  src/
    components/
      Dashboard.tsx        -- react-grid-layout responsive grid
      Widget.tsx           -- widget container (title, range selector, CSV export)
      charts/              -- StatCard, LineChart, BarChart, Gauge, DataTable, LogStream
    hooks/
      useWebSocket.ts      -- WebSocket with auto-reconnect + backoff
      useMetrics.ts        -- TanStack Query wrapper for REST data fetching
    utils/
      csv.ts               -- CSV export utility
backend/
  app/
    main.py                -- FastAPI app factory, WebSocket endpoint, health check
    config.py              -- pydantic-settings from environment
    database.py            -- async SQLAlchemy engine + session
    routers/
      dashboards.py        -- CRUD for dashboard configs
      metrics.py           -- GET /metrics/{source}/{query} with time range
    sources/               -- data source adapters (Prometheus, REST, DB, demo)
    websocket/
      manager.py           -- connection manager, per-widget pub/sub
      collector.py         -- background task polling sources
    models/                -- SQLAlchemy models
    schemas/               -- Pydantic request/response schemas
```

## WebSocket Protocol

Connect to `ws://host/ws/dashboard/{dashboard_id}`.

**Subscribe to widgets:**

```json
{"action": "subscribe", "widget_ids": ["cpu_chart", "memory_gauge"]}
```

**Server pushes metric updates:**

```json
{
  "widget_id": "cpu_chart",
  "timestamp": "2026-01-15T10:30:00Z",
  "data": {"series": [{"label": "api", "value": 45.2}]}
}
```

## Adding a Data Source

1. Create a new file in `backend/app/sources/` implementing `DataSourceBase`:

```python
from app.sources.base import DataSourceBase, DataPoint

class MySource(DataSourceBase):
    async def query(self, query_str, start, end):
        # Fetch data, return list[DataPoint]
        ...

    async def close(self):
        ...
```

2. Register it in `backend/app/sources/registry.py`:

```python
if name == "mysource":
    from app.sources.mysource import MySource
    return MySource(...)
```

3. Reference it in widget configs with `"source": "mysource"`.

## Adding a Widget Type

1. Create a React component in `frontend/src/components/charts/`:

```tsx
interface MyWidgetProps {
  data: DataPoint[];
}

export function MyWidget({ data }: MyWidgetProps) {
  return <div>{/* render data */}</div>;
}
```

2. Add a case in `Dashboard.tsx` `WidgetSlot` for your widget type.

3. Add the type to the `WidgetConfig.widget_type` union in `types.ts`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/dashboards | List all dashboards |
| POST | /api/dashboards | Create dashboard |
| GET | /api/dashboards/{id} | Get dashboard |
| PUT | /api/dashboards/{id} | Update dashboard |
| DELETE | /api/dashboards/{id} | Delete dashboard |
| GET | /api/metrics/{source}/{query} | Query metrics with time range |
| WS | /ws/dashboard/{id} | WebSocket for real-time updates |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | SQLAlchemy connection string | sqlite+aiosqlite:///./data/dash.db |
| PROMETHEUS_URL | Prometheus server URL | (empty -- demo mode) |
| COLLECTOR_INTERVAL | Seconds between data polls | 5 |
| WS_HEARTBEAT | WebSocket ping interval | 30 |
| CORS_ORIGINS | Allowed origins (comma-separated) | * |

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **lint-backend** -- ruff check + format
2. **lint-frontend** -- eslint + tsc --noEmit
3. **build-docker** -- build both Docker images
