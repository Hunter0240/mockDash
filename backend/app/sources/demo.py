import math
import random
import time
from datetime import datetime, timedelta

from app.sources.base import DataPoint, DataSourceBase

_METRICS = {
    "cpu": {"base": 45, "amplitude": 20, "noise": 5},
    "memory": {"base": 62, "amplitude": 8, "noise": 3},
    "requests": {"base": 1200, "amplitude": 400, "noise": 100},
    "latency": {"base": 85, "amplitude": 30, "noise": 15},
    "errors": {"base": 2, "amplitude": 3, "noise": 2},
    "connections": {"base": 150, "amplitude": 50, "noise": 10},
}


def _generate_value(metric: str, t: float) -> float:
    cfg = _METRICS.get(metric, {"base": 50, "amplitude": 10, "noise": 5})
    value = (
        cfg["base"]
        + cfg["amplitude"] * math.sin(t / 300)
        + cfg["noise"] * random.gauss(0, 1)
    )
    return max(0, round(value, 2))


class DemoSource(DataSourceBase):
    async def query(self, query_str: str, start: datetime, end: datetime) -> list[DataPoint]:
        metrics = [m.strip() for m in query_str.split(",") if m.strip()]
        if not metrics:
            metrics = list(_METRICS.keys())

        step = max(1, int((end - start).total_seconds() / 100))
        points = []
        t = start
        while t <= end:
            ts_epoch = t.timestamp()
            series = [{"label": m, "value": _generate_value(m, ts_epoch)} for m in metrics]
            points.append(DataPoint(timestamp=t, series=series))
            t += timedelta(seconds=step)
        return points

    def sample_now(self, metrics: list[str] | None = None) -> DataPoint:
        if not metrics:
            metrics = list(_METRICS.keys())
        now = time.time()
        series = [{"label": m, "value": _generate_value(m, now)} for m in metrics]
        return DataPoint(timestamp=datetime.now(), series=series)

    async def close(self):
        pass
