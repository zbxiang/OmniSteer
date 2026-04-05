"""数据库引擎与会话。"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _create_engine():
    url = settings.database_url
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=settings.database_echo,
        )
    # MySQL：长连接可能被服务端断开，定期回收连接
    extra: dict = {"pool_pre_ping": True, "echo": settings.database_echo}
    if "+pymysql" in url or url.startswith("mysql+"):
        extra["pool_recycle"] = 3600
    return create_engine(url, **extra)


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
