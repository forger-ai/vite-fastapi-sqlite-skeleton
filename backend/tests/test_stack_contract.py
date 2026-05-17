from __future__ import annotations

import importlib
import sys
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlmodel import SQLModel

pytestmark = pytest.mark.bdd


@pytest.fixture(scope="module")
def skeleton_app(tmp_path_factory: pytest.TempPathFactory) -> Iterator[object]:
    monkeypatch = pytest.MonkeyPatch()
    db_path = tmp_path_factory.mktemp("data") / "app.sqlite"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173,http://example.test")
    SQLModel.metadata.clear()
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]
    module = importlib.import_module("app.main")
    yield module.app
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]
    SQLModel.metadata.clear()
    monkeypatch.undo()


def test_health_endpoint_validates_backend_and_database(skeleton_app: object) -> None:
    with TestClient(skeleton_app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "sqlite"}


def test_cors_origin_is_configured_from_environment(skeleton_app: object) -> None:
    with TestClient(skeleton_app) as client:
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://example.test",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://example.test"


def test_realtime_router_is_registered(skeleton_app: object) -> None:
    websocket_paths = [
        route.path
        for route in skeleton_app.routes  # type: ignore[attr-defined]
        if getattr(route, "path", None)
    ]

    assert "/api/realtime/ws" in websocket_paths


def test_app_database_extension_initializes_declared_models(skeleton_app: object) -> None:
    from app.database import engine
    from app.database_ext import init_app_db
    from app.models import AppSetting, utcnow

    init_app_db()

    assert "appsetting" in inspect(engine).get_table_names()
    assert AppSetting(key="demo").key == "demo"
    assert utcnow().tzinfo is not None
