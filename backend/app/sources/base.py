from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DataPoint(BaseModel):
    timestamp: datetime
    series: list[dict[str, Any]]


class DataSourceBase(ABC):
    @abstractmethod
    async def query(self, query_str: str, start: datetime, end: datetime) -> list[DataPoint]:
        pass

    @abstractmethod
    async def close(self):
        pass
