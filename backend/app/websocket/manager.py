import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: dict[int, set[WebSocket]] = {}
        self._subscriptions: dict[WebSocket, set[str]] = {}

    async def connect(self, websocket: WebSocket, dashboard_id: int):
        await websocket.accept()
        self._connections.setdefault(dashboard_id, set()).add(websocket)
        self._subscriptions[websocket] = set()
        logger.info("WebSocket connected: dashboard=%d", dashboard_id)

    def disconnect(self, websocket: WebSocket, dashboard_id: int):
        conns = self._connections.get(dashboard_id, set())
        conns.discard(websocket)
        if not conns:
            self._connections.pop(dashboard_id, None)
        self._subscriptions.pop(websocket, None)
        logger.info("WebSocket disconnected: dashboard=%d", dashboard_id)

    def subscribe(self, websocket: WebSocket, widget_ids: list[str]):
        if websocket in self._subscriptions:
            self._subscriptions[websocket].update(widget_ids)

    def unsubscribe(self, websocket: WebSocket, widget_ids: list[str]):
        if websocket in self._subscriptions:
            self._subscriptions[websocket].difference_update(widget_ids)

    async def broadcast(self, widget_id: str, data: dict[str, Any]):
        message = json.dumps({"widget_id": widget_id, **data})
        for ws, subs in list(self._subscriptions.items()):
            if widget_id in subs:
                try:
                    await ws.send_text(message)
                except Exception:
                    logger.debug("Failed to send to WebSocket, will be cleaned up")

    @property
    def active_widget_ids(self) -> set[str]:
        ids: set[str] = set()
        for subs in self._subscriptions.values():
            ids.update(subs)
        return ids


manager = ConnectionManager()
