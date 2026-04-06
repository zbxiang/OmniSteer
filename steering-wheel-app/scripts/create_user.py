"""
命令行插入用户（与登录接口相同规则：密码 ≥ 6 位，密码存 bcrypt 哈希）。

在 steering-wheel-app 目录下执行：
  python -m scripts.create_user --username 张三 --password yourSecret123

需已配置 DATABASE_URL（或默认 SQLite），会先 ensure 表存在再插入。
"""

from __future__ import annotations

import argparse
import sys

import app.models  # noqa: F401 — 注册 ORM
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.db.user_ops import create_user


def main() -> int:
    parser = argparse.ArgumentParser(description="向 users 表插入一条用户")
    parser.add_argument("--username", "-u", required=True, help="登录用户名")
    parser.add_argument("--password", "-p", required=True, help="明文密码（≥6 位，仅用于生成哈希）")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    try:
        with SessionLocal() as db:
            user = create_user(db, args.username, args.password)
    except ValueError as e:
        print(f"错误: {e}", file=sys.stderr)
        return 1

    print(f"已创建用户 id={user.id} username={user.username}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
