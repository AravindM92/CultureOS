from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.gossip_service import GossipService
from app.models.schemas import GossipResponse

router = APIRouter(prefix="/gossips", tags=["gossips"])
gossip_service = GossipService()


@router.get("/", response_model=List[GossipResponse])
async def get_gossips(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    return await gossip_service.get_all(skip, limit)


@router.get("/{gossip_id}", response_model=GossipResponse)
async def get_gossip(gossip_id: int):
    gossip = await gossip_service.get_by_id(gossip_id)
    if not gossip:
        raise HTTPException(status_code=404, detail="Gossip not found")
    return gossip


@router.get("/type/{gossip_type}", response_model=List[GossipResponse])
async def get_gossips_by_type(
    gossip_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return await gossip_service.get_by_type(gossip_type, skip, limit)