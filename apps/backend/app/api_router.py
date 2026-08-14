from fastapi import APIRouter

from app.domains.system.router import router as system_router

api_router = APIRouter()
api_router.include_router(system_router)
