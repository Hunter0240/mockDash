from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.sources.base import DataPoint, DataSourceBase

_ALLOWED_QUERIES: dict[str, str] = {}


class DatabaseSource(DataSourceBase):
    def __init__(self, connection_url: str, allowed_queries: dict[str, str] | None = None):
        self._engine = create_async_engine(connection_url, echo=False)
        self._session_factory = async_sessionmaker(
            self._engine, class_=AsyncSession, expire_on_commit=False
        )
        self._allowed = allowed_queries or _ALLOWED_QUERIES

    async def query(self, query_str: str, start: datetime, end: datetime) -> list[DataPoint]:
        sql = self._allowed.get(query_str)
        if sql is None:
            raise ValueError(
                f"Unknown query name: {query_str}. "
                f"Allowed: {list(self._allowed.keys())}"
            )
        async with self._session_factory() as session:
            result = await session.execute(
                text(sql), {"start": start, "end": end}
            )
            rows = result.mappings().all()

        points = []
        for row in rows:
            row_dict = dict(row)
            ts = row_dict.pop("timestamp", datetime.now())
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)
            series = [
                {"label": k, "value": float(v)}
                for k, v in row_dict.items()
                if isinstance(v, (int, float))
            ]
            points.append(DataPoint(timestamp=ts, series=series))
        return points

    async def close(self):
        await self._engine.dispose()
