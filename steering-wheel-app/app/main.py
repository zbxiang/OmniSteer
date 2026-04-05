"""
OmniSteer 后端 API 入口。
开发：uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.seed import ensure_demo_user
from app.db.session import SessionLocal, engine
from app.modules.auth import auth_router
import app.models  # noqa: F401 — 注册 ORM 模型到 Base.metadata


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_demo_user(db)
    yield


app = FastAPI(title="OmniSteer API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
