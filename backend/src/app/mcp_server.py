from __future__ import annotations

from sqlmodel import Session, select

from app.database import engine
from app.database_ext import init_app_db
from app.mcp_runtime import ToolRegistry, main
from app.models import AppSetting

registry = ToolRegistry()


@registry.tool("status", "Return skeleton MCP and database status.")
def status(_args: dict[str, object]) -> dict[str, object]:
    init_app_db()
    with Session(engine) as session:
        count = len(session.exec(select(AppSetting)).all())
    return {
        "success": True,
        "status": "ok",
        "database": "sqlite",
        "settingCount": count,
    }


if __name__ == "__main__":
    main(registry, server_name="vite-fastapi-sqlite-skeleton")
