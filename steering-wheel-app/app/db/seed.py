"""启动时种子数据（仅开发演示：无用户时插入默认账号）。"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.user_ops import create_user
from app.models.user import User


def ensure_demo_user(db: Session) -> None:
    if db.scalar(select(User).limit(1)) is not None:
        return
    create_user(db, "admin", "123456")
