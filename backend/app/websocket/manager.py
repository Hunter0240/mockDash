import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: dict[int, set[WebSocket]] = {}
        self._subscriptions: dict[WebSocket, set[str]] = {}
        self._widget_sockets: dict[str, set[WebSocket]] = {}
        self._ws_dashboard: dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, dashboard_id: int):
        await websocket.accept()
        self._connections.setdefault(dashboard_id, set()).add(websocket)
        self._subscriptions[websocket] = set()
        self._ws_dashboard[websocket] = dashboard_id
        logger.info("WebSocket connected: dashboard=%d", dashboard_id)

    def disconnect(self, websocket: WebSocket, dashboard_id: int):
        for wid in self._subscriptions.get(websocket, set()):
            sockets = self._widget_sockets.get(wid)
            if sockets:
                sockets.discard(websocket)
                if not sockets:
                    del self._widget_sockets[wid]
        conns = self._connections.get(dashboard_id, set())
        conns.discard(websocket)
        if not conns:
            self._connections.pop(dashboard_id, None)
        self._subscriptions.pop(websocket, None)
        self._ws_dashboard.pop(websocket, None)
        logger.info("WebSocket disconnected: dashboard=%d", dashboard_id)

    def subscribe(self, websocket: WebSocket, widget_ids: list[str]):
        if websocket in self._subscriptions:
            self._subscriptions[websocket].update(widget_ids)
            for wid in widget_ids:
                self._widget_sockets.setdefault(wid, set()).add(websocket)

    def unsubscribe(self, websocket: WebSocket, widget_ids: list[str]):
        if websocket in self._subscriptions:
            self._subscriptions[websocket].difference_update(widget_ids)
            for wid in widget_ids:
                sockets = self._widget_sockets.get(wid)
                if sockets:
                    sockets.discard(websocket)
                    if not sockets:
                        del self._widget_sockets[wid]

    async def broadcast(self, widget_id: str, data: dict[str, Any]):
        sockets = self._widget_sockets.get(widget_id)
        if not sockets:
            return
        message = json.dumps({"widget_id": widget_id, **data})
        dead: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            dashboard_id = self._ws_dashboard.get(ws)
            if dashboard_id is not None:
                self.disconnect(ws, dashboard_id)

    @property
    def active_widget_ids(self) -> set[str]:
        return set(self._widget_sockets.keys())


manager = ConnectionManager()
