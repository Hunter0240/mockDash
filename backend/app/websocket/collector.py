import asyncio
import logging

from app.config import settings
from app.sources.demo import DemoSource
from app.sources.registry import get_source
from app.websocket.manager import manager

logger = logging.getLogger(__name__)


async def collector_loop():
    while True:
        try:
            active_ids = manager.active_widget_ids
            if active_ids:
                source = get_source("demo")
                if isinstance(source, DemoSource):
                    point = source.sample_now()
                    for widget_id in active_ids:
                        await manager.broadcast(
                            widget_id,
                            {
                                "timestamp": point.timestamp.isoformat(),
                                "data": {"series": [s.copy() for s in point.series]},
                            },
                        )
        except Exception:
            logger.exception("Collector error")
        await asyncio.sleep(settings.collector_interval)
