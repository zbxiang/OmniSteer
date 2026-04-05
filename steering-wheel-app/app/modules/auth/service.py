"""登录业务逻辑（校验、发牌；与 HTTP 层分离，便于单测与替换账号体系）。"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.password import verify_password
from app.core.security import create_access_token
from app.models.user import User
from app.modules.auth.schemas import LoginRequest, LoginResponse


def login(db: Session, body: LoginRequest) -> LoginResponse:
    """根据数据库用户表校验用户名与密码哈希，通过后签发 JWT。"""
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=422, detail="用户名不能为空")

    user = db.scalar(select(User).where(User.username == username))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    return LoginResponse(
        token=create_access_token(subject=username),
        username=user.username,
    )
