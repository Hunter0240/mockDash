import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.dashboard import Dashboard
from app.schemas.dashboard import DashboardCreate, DashboardResponse, DashboardUpdate

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.get("", response_model=list[DashboardResponse])
async def list_dashboards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dashboard).order_by(Dashboard.id))
    dashboards = result.scalars().all()
    return [_to_response(d) for d in dashboards]


@router.post("", response_model=DashboardResponse, status_code=201)
async def create_dashboard(body: DashboardCreate, db: AsyncSession = Depends(get_db)):
    dashboard = Dashboard(
        name=body.name,
        layout=json.dumps([w.model_dump() for w in body.layout]),
    )
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)
    return _to_response(dashboard)


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(dashboard_id: int, db: AsyncSession = Depends(get_db)):
    dashboard = await db.get(Dashboard, dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return _to_response(dashboard)


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: int, body: DashboardUpdate, db: AsyncSession = Depends(get_db)
):
    dashboard = await db.get(Dashboard, dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if body.name is not None:
        dashboard.name = body.name
    if body.layout is not None:
        dashboard.layout = json.dumps([w.model_dump() for w in body.layout])
    await db.commit()
    await db.refresh(dashboard)
    return _to_response(dashboard)


@router.delete("/{dashboard_id}", status_code=204)
async def delete_dashboard(dashboard_id: int, db: AsyncSession = Depends(get_db)):
    dashboard = await db.get(Dashboard, dashboard_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    await db.delete(dashboard)
    await db.commit()


def _to_response(dashboard: Dashboard) -> dict:
    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "layout": json.loads(dashboard.layout),
        "created_at": dashboard.created_at,
        "updated_at": dashboard.updated_at,
    }
