from datetime import datetime

import httpx

from app.sources.base import DataPoint, DataSourceBase


class PrometheusSource(DataSourceBase):
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=10.0)

    async def query(self, query_str: str, start: datetime, end: datetime) -> list[DataPoint]:
        resp = await self._client.get(
            "/api/v1/query_range",
            params={
                "query": query_str,
                "start": start.timestamp(),
                "end": end.timestamp(),
                "step": max(1, int((end - start).total_seconds() / 100)),
            },
        )
        resp.raise_for_status()
        data = resp.json()

        grouped: dict[float, list[dict]] = {}
        for result in data.get("data", {}).get("result", []):
            label = result.get("metric", {}).get("__name__", "value")
            for ts, val in result.get("values", []):
                ts_f = float(ts)
                grouped.setdefault(ts_f, []).append(
                    {"label": label, "value": float(val)}
                )
        return [
            DataPoint(timestamp=datetime.fromtimestamp(ts), series=series)
            for ts, series in sorted(grouped.items())
        ]

    async def close(self):
        await self._client.aclose()
