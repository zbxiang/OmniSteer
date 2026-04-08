"""
OmniSteer 后端 API 入口。
开发：uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.db.base import Base
from app.db.seed import ensure_demo_user
from app.db.session import SessionLocal, engine
from app.modules.auth import auth_router
from app.modules.product import product_router
import app.models  # noqa: F401 — 注册 ORM 模型到 Base.metadata


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_user:
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
app.include_router(product_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict[str, str]:
    """
    执行 SELECT 1，确认当前 DATABASE_URL 能连上数据库。
    返回的 dsn 已隐藏密码，便于核对是否连到预期的 MySQL / 库名。
    """
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"数据库不可用: {e}") from e
    return {
        "status": "ok",
        "database": "connected",
        "dsn": engine.url.render_as_string(hide_password=True),
    }