from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

from app.sources.base import DataPoint
from app.sources.registry import get_source

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/{source}/{query:path}", response_model=list[DataPoint])
async def query_metrics(
    source: str,
    query: str,
    start: datetime | None = Query(None),
    end: datetime | None = Query(None),
    range: str = Query("1h", description="Time range shorthand: 5m, 15m, 1h, 6h, 24h, 7d"),
):
    now = datetime.now()
    if end is None:
        end = now
    if start is None:
        start = end - _parse_range(range)

    try:
        ds = get_source(source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await ds.query(query, start, end)


_UNITS = {"m": 60, "h": 3600, "d": 86400}


def _parse_range(value: str) -> timedelta:
    unit = value[-1]
    if unit in _UNITS:
        try:
            return timedelta(seconds=int(value[:-1]) * _UNITS[unit])
        except ValueError:
            pass
    return timedelta(hours=1)
