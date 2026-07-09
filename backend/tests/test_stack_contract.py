from __future__ import annotations

import importlib
import json
import os
import socket
import sys
import threading
from collections.abc import Iterator
from pathlib import Path
from urllib.request import urlopen

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlmodel import SQLModel

pytestmark = pytest.mark.bdd

TEST_FILE = Path(__file__).resolve()


def read_manifest() -> dict[str, object]:
    env_manifest = os.environ.get("FORGER_APP_MANIFEST_PATH")
    candidates = []
    if env_manifest:
        candidates.append(Path(env_manifest))
    candidates.extend((
        TEST_FILE.parents[1] / "manifest.json",
        TEST_FILE.parents[2] / "manifest.json",
    ))
    for candidate in candidates:
        if candidate.exists():
            return json.loads(candidate.read_text(encoding="utf-8"))
    raise AssertionError("manifest.json is not available to the backend contract test")


@pytest.fixture(scope="module")
def skeleton_app(tmp_path_factory: pytest.TempPathFactory) -> Iterator[object]:
    monkeypatch = pytest.MonkeyPatch()
    db_path = tmp_path_factory.mktemp("data") / "forger-app.sqlite"
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


def test_manifest_backend_healthcheck_matches_real_app_route(skeleton_app: object) -> None:
    manifest = read_manifest()
    backend_service = next(
        service for service in manifest["services"] if service["name"] == "backend"
    )

    with TestClient(skeleton_app) as client:
        response = client.get(backend_service["healthcheck"])

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "sqlite"}


def test_unprefixed_health_endpoint_remains_available_for_agents(skeleton_app: object) -> None:
    with TestClient(skeleton_app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "sqlite"}


def test_mcp_health_endpoint_reports_server_ready() -> None:
    from app.mcp_runtime import ToolRegistry, run_mcp_server

    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]

    thread = threading.Thread(
        target=run_mcp_server,
        kwargs={
            "registry": ToolRegistry(),
            "server_name": "test-mcp",
            "host": "127.0.0.1",
            "port": port,
        },
        daemon=True,
    )
    thread.start()

    response_payload: dict[str, str] | None = None
    for _attempt in range(40):
        try:
            with urlopen(f"http://127.0.0.1:{port}/health", timeout=0.25) as response:
                assert response.status == 200
                response_payload = json.loads(response.read().decode("utf-8"))
                break
        except OSError:
            continue

    assert response_payload == {"status": "ok", "server": "test-mcp"}


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


def test_forger_context_router_is_registered_with_fallback(skeleton_app: object) -> None:
    with TestClient(skeleton_app) as client:
        response = client.get("/api/forger/context")

    assert response.status_code == 200
    assert response.json() == {
        "locale": "es",
        "rawLocale": None,
        "source": "fallback",
    }


def test_forger_context_normalizes_desktop_payloads(
    skeleton_app: object,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app import forger_context

    monkeypatch.setattr(
        forger_context,
        "get_app_context",
        lambda: {"locale": "en", "rawLocale": "en-US"},
    )
    with TestClient(skeleton_app) as client:
        desktop = client.get("/api/forger/context")
    assert desktop.json() == {
        "locale": "en",
        "rawLocale": "en-US",
        "source": "desktop",
    }

    monkeypatch.setattr(forger_context, "get_app_context", lambda: "bad")
    assert forger_context.runtime_context() == {
        "locale": "es",
        "rawLocale": None,
        "source": "fallback",
    }


def test_forger_desktop_helpers_pass_workspace_and_folder_grants(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app import forger_desktop

    calls: list[tuple[str, str, dict | None]] = []

    def fake_request(method: str, path: str, body: dict | None, **_kwargs: object):
        calls.append((method, path, body))
        return {"desktop_thread_id": "thread_1", "desktop_run_id": "run_1", "runId": "task_1"}

    monkeypatch.setattr(forger_desktop, "_request", fake_request)
    workspace = {
        "cwdGrantId": "workspace_1",
        "additionalFolderGrantIds": ["workspace_2"],
    }

    forger_desktop.start_agent_task(
        template_id="review",
        workspace_path="/tmp/app",
        workspace=workspace,
    )
    forger_desktop.start_manifest_agent_thread(
        agent_id="advisor",
        workspace_path="/tmp/app",
        workspace=workspace,
    )
    forger_desktop.resume_manifest_agent_thread(
        desktop_thread_id="thread_1",
        workspace_path="/tmp/app",
        workspace=workspace,
    )
    forger_desktop.steer_manifest_agent_run(
        desktop_thread_id="thread_1",
        desktop_run_id="run_1",
        workspace_path="/tmp/app",
        workspace=workspace,
    )
    forger_desktop.request_folder_grant(grant_token="grant-token")
    forger_desktop.list_folder_grants()
    forger_desktop.revoke_folder_grant("grant/id")
    forger_desktop.list_connections()
    forger_desktop.connection_status("gmail")
    forger_desktop.get_connection_status("gmail")
    forger_desktop.configure_connection("gmail", label="Personal Gmail", connection_id="gmail-default")
    forger_desktop.request_connection_grant(
        "gmail",
        reason="Use Gmail from the app",
        connection_ids=["gmail-default"],
    )
    forger_desktop.call_connection_action(
        "gmail",
        "gmail.search_messages",
        {"query": "from:example@example.com"},
        connection_id="gmail-default",
    )

    assert calls[0] == (
        "POST",
        "/agent-tasks",
        {
            "templateId": "review",
            "locale": None,
            "arguments": None,
            "variables": None,
            "attachments": None,
            "runtime": None,
            "workspacePath": "/tmp/app",
            "workspace": workspace,
        },
    )
    assert calls[1][2]["workspace"] == workspace
    assert calls[2][2]["workspace"] == workspace
    assert calls[3][2]["workspace"] == workspace
    assert calls[4] == ("POST", "/folder-grants/request", {"grantToken": "grant-token"})
    assert calls[5] == ("GET", "/folder-grants", None)
    assert calls[6] == ("DELETE", "/folder-grants/grant%2Fid", None)
    assert calls[7] == ("GET", "/connections", None)
    assert calls[8] == ("GET", "/connections/gmail/status", None)
    assert calls[9] == ("GET", "/connections/gmail/status", None)
    assert calls[10] == (
        "POST",
        "/connections/gmail/setup",
        {
            "label": "Personal Gmail",
            "connectionId": "gmail-default",
        },
    )
    assert calls[11] == (
        "POST",
        "/connections/gmail/grants/request",
        {
            "reason": "Use Gmail from the app",
            "connectionIds": ["gmail-default"],
        },
    )
    assert calls[12] == (
        "POST",
        "/connections/gmail/actions/gmail.search_messages",
        {
            "input": {"query": "from:example@example.com"},
            "connectionId": "gmail-default",
        },
    )


def test_forger_desktop_folder_grant_token_matches_contract(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app import forger_desktop

    monkeypatch.setenv("FORGER_DESKTOP_RUNTIME_APP_ID", "app.test")
    monkeypatch.setenv("FORGER_APP_GRANT_SECRET", "grant.secret")
    monkeypatch.setattr(forger_desktop.time, "time", lambda: 1_700_000_000)

    token = forger_desktop.create_folder_grant_token(
        path=" /Users/me/Project ",
        expires_in_seconds=60,
    )
    payload, _signature = token.split(".")
    raw_payload = payload + "=" * (-len(payload) % 4)
    decoded_payload = json.loads(forger_desktop.base64.urlsafe_b64decode(raw_payload))

    assert decoded_payload == {
        "appId": "app.test",
        "path": "/Users/me/Project",
        "exp": 1_700_000_060,
    }
    with pytest.raises(forger_desktop.ForgerAppGrantUnavailable):
        monkeypatch.delenv("FORGER_APP_GRANT_SECRET")
        forger_desktop.create_folder_grant_token(path="/Users/me/Project")


def test_app_database_extension_initializes_declared_models(skeleton_app: object) -> None:
    import asyncio

    from app import background_jobs, desktop_agent_jobs, desktop_task_jobs
    from app.database import engine
    from app.database_ext import init_app_db
    from app.models import AppSetting, utcnow

    init_app_db()

    assert "appsetting" in inspect(engine).get_table_names()
    assert "backgroundjob" in inspect(engine).get_table_names()
    assert AppSetting(key="demo").key == "demo"
    assert background_jobs.BackgroundJob(job_type="demo.ready").job_type == "demo.ready"
    assert not background_jobs.BackgroundJobRunner(background_jobs.JobRegistry()).running
    assert asyncio.iscoroutinefunction(background_jobs.run_due_jobs_once)
    registry = desktop_task_jobs.register_desktop_task_jobs(background_jobs.JobRegistry())
    registry = desktop_agent_jobs.register_desktop_agent_jobs(registry)
    assert registry.has(desktop_task_jobs.DESKTOP_TASK_JOB_TYPE)
    assert registry.has(desktop_agent_jobs.DESKTOP_AGENT_START_JOB_TYPE)
    assert registry.has(desktop_agent_jobs.DESKTOP_AGENT_RESUME_JOB_TYPE)
    assert utcnow().tzinfo is not None
