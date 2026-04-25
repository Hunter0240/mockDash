from datetime import datetime
from typing import Any

from pydantic import BaseModel


class WidgetConfig(BaseModel):
    widget_id: str
    widget_type: str
    title: str
    row: int
    col: int
    row_span: int = 1
    col_span: int = 1
    source: str = "demo"
    query: str = ""
    config: dict[str, Any] = {}


class DashboardCreate(BaseModel):
    name: str
    layout: list[WidgetConfig] = []


class DashboardUpdate(BaseModel):
    name: str | None = None
    layout: list[WidgetConfig] | None = None


class DashboardResponse(BaseModel):
    id: int
    name: str
    layout: list[WidgetConfig]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
