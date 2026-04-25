import json

from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.models.base import Base


class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    layout = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def layout_parsed(self) -> list:
        return json.loads(self.layout)

    @layout_parsed.setter
    def layout_parsed(self, value: list):
        self.layout = json.dumps(value)
