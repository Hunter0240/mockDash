from datetime import datetime
from typing import Any

import httpx

from app.sources.base import DataPoint, DataSourceBase


class RestSource(DataSourceBase):
    def __init__(
        self,
        base_url: str,
        headers: dict[str, str] | None = None,
        allowed_paths: list[str] | None = None,
    ):
        self.base_url = base_url
        self._allowed_paths = allowed_paths
        self._client = httpx.AsyncClient(
            base_url=base_url, headers=headers or {}, timeout=10.0
        )

    async def query(self, query_str: str, start: datetime, end: datetime) -> list[DataPoint]:
        if query_str.startswith(("//", "http:", "https:")):
            raise ValueError("Absolute URLs are not allowed")
        if self._allowed_paths is not None and query_str not in self._allowed_paths:
            raise ValueError(
                f"Path not in allowlist: {query_str}. "
                f"Allowed: {self._allowed_paths}"
            )
        resp = await self._client.get(
            query_str,
            params={"start": start.isoformat(), "end": end.isoformat()},
        )
        resp.raise_for_status()
        data = resp.json()

        points = []
        for item in self._extract_items(data):
            ts = item.get("timestamp", datetime.now().isoformat())
            series = [
                {"label": k, "value": v}
                for k, v in item.items()
                if k != "timestamp" and isinstance(v, (int, float))
            ]
            points.append(
                DataPoint(timestamp=datetime.fromisoformat(ts), series=series)
            )
        return points

    def _extract_items(self, data: Any) -> list[dict]:
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("data", "results", "items", "records"):
                if key in data and isinstance(data[key], list):
                    return data[key]
            return [data]
        return []

    async def close(self):
        await self._client.aclose()
