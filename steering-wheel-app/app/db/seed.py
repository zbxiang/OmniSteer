"""启动时种子数据（仅开发演示：无用户时插入默认账号）。"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.password import hash_password
from app.models.user import User


def ensure_demo_user(db: Session) -> None:
    if db.scalar(select(User).limit(1)) is not None:
        return
    db.add(
        User(
            username="admin",
            password_hash=hash_password("123456"),
        ),
    )
    db.commit()
