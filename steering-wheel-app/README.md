# steering-wheel-app

方向盘产品管理系统 - 后端（FastAPI）

## 环境要求

- Python 3.10+（建议）
- 依赖见 `requirements.txt`

## 安装依赖

在项目根目录 `steering-wheel-app` 下执行：

```powershell
python -m pip install -r requirements.txt
```

（可选）使用虚拟环境：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## 配置数据库

参考 `env.example`。本地可先用默认 SQLite，无需额外安装数据库服务。

PowerShell 当前会话中设置环境变量示例：

```powershell
$env:DATABASE_URL = "sqlite:///./omnisteer.db"
$env:SEED_DEMO_USER = "false"
# 或使用 MySQL，需先建库并安装依赖后：
# $env:DATABASE_URL = "mysql+pymysql://用户:密码@127.0.0.1:3306/库名?charset=utf8mb4"
# 如需首次启动自动插入 admin 演示用户，再设置为 true：
# $env:SEED_DEMO_USER = "true"
```

## 启动后端接口（开发）

在 `steering-wheel-app` 目录下执行：

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

- 默认监听 **3000**，与前端开发代理 `VITE_API_PROXY_TARGET=http://localhost:3000` 一致。
- `--reload`：代码变更自动重载；生产部署请去掉该参数并改用多进程/进程管理器。

启动成功后：

- 健康检查：<http://127.0.0.1:3000/health>
- **数据库连通性**（会执行 `SELECT 1`，并返回脱敏后的连接串 `dsn`，用于确认已连上 MySQL 等）：<http://127.0.0.1:3000/health/db>
- 接口文档（Swagger）：<http://127.0.0.1:3000/docs>

## 命令行插入用户

建表在首次启动应用时由 ORM 自动创建；向 `users` 表插入账号（密码会存为 bcrypt 哈希）：

```powershell
python -m scripts.create_user --username 用户名 --password 至少6位密码
```

简写：`-u`、`-p`。

## 默认演示账号

默认 **不自动插入** 演示账号。若要启用，设置 `SEED_DEMO_USER=true` 后再启动，
当数据库中尚无任何用户时会自动插入：`admin` / `123456`。
