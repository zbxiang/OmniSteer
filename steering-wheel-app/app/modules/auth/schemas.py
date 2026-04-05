"""登录请求 / 响应模型。"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=6, max_length=256)


class LoginResponse(BaseModel):
    token: str
    username: str
    token_type: str = "bearer"
