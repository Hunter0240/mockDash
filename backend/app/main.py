import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models.base import Base
from app.routers import dashboards, metrics
from app.sources.registry import close_all
from app.websocket.collector import collector_loop
from app.websocket.manager import manager

logging.basicConfig(
    level=settings.log_level,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(collector_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_all()
    await engine.dispose()


app = FastAPI(title="Dash", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboards.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


_VALID_ACTIONS = {"subscribe", "unsubscribe"}


@app.websocket("/ws/dashboard/{dashboard_id}")
async def websocket_endpoint(websocket: WebSocket, dashboard_id: int):
    await manager.connect(websocket, dashboard_id)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            action = msg.get("action")
            if action not in _VALID_ACTIONS:
                continue
            widget_ids = msg.get("widget_ids", [])
            if not isinstance(widget_ids, list) or not all(isinstance(w, str) for w in widget_ids):
                continue
            if action == "subscribe":
                manager.subscribe(websocket, widget_ids)
            elif action == "unsubscribe":
                manager.unsubscribe(websocket, widget_ids)
    except WebSocketDisconnect:
        manager.disconnect(websocket, dashboard_id)
