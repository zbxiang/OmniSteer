"""用户表写入：建表由应用启动时 create_all 完成，此处负责插入/校验逻辑。"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.password import hash_password
from app.models.user import User


def create_user(db: Session, username: str, password: str) -> User:
    """
    插入一条用户记录（密码经 bcrypt 哈希后写入 password_hash）。
    用户名已存在时抛出 ValueError。
    """
    name = username.strip()
    if not name:
        raise ValueError("用户名不能为空")
    if len(password) < 6:
        raise ValueError("密码至少 6 位")

    if db.scalar(select(User).where(User.username == name)) is not None:
        raise ValueError(f"用户名已存在: {name}")

    user = User(username=name, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
