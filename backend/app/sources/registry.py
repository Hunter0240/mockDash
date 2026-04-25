from app.config import settings
from app.sources.base import DataSourceBase
from app.sources.demo import DemoSource

_sources: dict[str, DataSourceBase] = {}


def get_source(name: str) -> DataSourceBase:
    if name not in _sources:
        _sources[name] = _create_source(name)
    return _sources[name]


def _create_source(name: str) -> DataSourceBase:
    if name == "prometheus" and settings.prometheus_url:
        from app.sources.prometheus import PrometheusSource

        return PrometheusSource(settings.prometheus_url)
    if name == "demo":
        return DemoSource()
    raise ValueError(f"Unknown data source: {name}")


async def close_all():
    for source in _sources.values():
        await source.close()
    _sources.clear()
