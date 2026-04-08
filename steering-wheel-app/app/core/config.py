"""应用级配置（环境变量）。"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    cors_origins_raw: str
    database_url: str
    database_echo: bool
    seed_demo_user: bool
    password_secret: str

    @property
    def cors_origins(self) -> list[str]:
        parts = [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]
        return parts if parts else ["*"]


def load_settings() -> Settings:
    return Settings(
        jwt_secret=os.environ.get("JWT_SECRET", "dev-only-change-JWT_SECRET-in-production"),
        jwt_algorithm="HS256",
        access_token_expire_minutes=int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        cors_origins_raw=os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:9000,http://127.0.0.1:9000",
        ),
        database_url=os.environ.get("DATABASE_URL", "sqlite:///./omnisteer.db"),
        database_echo=os.environ.get("DATABASE_ECHO", "").lower() in ("1", "true", "yes"),
        seed_demo_user=os.environ.get("SEED_DEMO_USER", "").lower() in ("1", "true", "yes"),
        password_secret=os.environ.get("PASSWORD_SECRET", "omnisteer-password-key"),
    )


settings = load_settings()
