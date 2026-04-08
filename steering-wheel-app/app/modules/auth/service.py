"""登录业务逻辑（校验、发牌；与 HTTP 层分离，便于单测与替换账号体系）。"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.crypto import decrypt_client_password
from app.core.password import verify_password
from app.core.security import create_access_token
from app.db.user_ops import create_user
from app.models.user import User
from app.modules.auth.schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse


def login(db: Session, body: LoginRequest) -> LoginResponse:
    """根据数据库用户表校验用户名与密码哈希，通过后签发 JWT。"""
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=422, detail="用户名不能为空")

    password = decrypt_client_password(body.password)
    user = db.scalar(select(User).where(User.username == username))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    return LoginResponse(
        token=create_access_token(subject=username),
        username=user.username,
    )


def register(db: Session, body: RegisterRequest) -> RegisterResponse:
    """
    注册新用户；密码由 create_user 使用 bcrypt 哈希后写入 password_hash，不存明文。
    """
    try:
        password = decrypt_client_password(body.password)
        user = create_user(db, body.username, password)
    except ValueError as e:
        msg = str(e)
        if "已存在" in msg:
            raise HTTPException(status_code=409, detail=msg) from e
        raise HTTPException(status_code=422, detail=msg) from e

    return RegisterResponse(id=user.id, username=user.username)
