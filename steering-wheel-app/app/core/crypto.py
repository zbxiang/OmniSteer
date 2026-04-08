"""轻量密码传输解密（前端 enc: 前缀 + XOR + base64）。"""

from __future__ import annotations

import base64

from app.core.config import settings


def decrypt_client_password(value: str) -> str:
    """
    兼容两种输入：
    - 明文：直接返回
    - enc:xxxx：按约定解密为明文
    """
    if not value.startswith("enc:"):
        return value

    payload = value[4:]
    key = settings.password_secret.encode("utf-8")
    if not key:
        return value
    try:
        cipher = base64.b64decode(payload.encode("utf-8"), validate=True)
        plain = bytes(b ^ key[i % len(key)] for i, b in enumerate(cipher))
        return plain.decode("utf-8")
    except Exception:
        # 解密失败时回退原值，后续由密码校验失败返回 401
        return value
