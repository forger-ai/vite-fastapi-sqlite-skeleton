from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

TERMINAL_RUN_STATUSES = {"completed", "failed", "canceled"}
TERMINAL_TASK_STATUSES = {"completed", "failed", "canceled"}


class ForgerDesktopRuntimeError(RuntimeError):
    pass


class ForgerDesktopRuntimeUnavailable(ForgerDesktopRuntimeError):
    pass


class ForgerAppGrantUnavailable(ForgerDesktopRuntimeUnavailable):
    pass


@dataclass(frozen=True)
class ForgerDesktopRuntimeConfig:
    url: str
    app_id: str
    secret: str


def is_desktop_runtime_available() -> bool:
    return bool(_config_or_none())


def get_agent_task_status() -> dict[str, Any]:
    return _request("GET", "/agent-tasks/status", None)


def get_app_context() -> dict[str, Any]:
    return _request("GET", "/context", None)


def create_folder_grant_token(
    *,
    path: str,
    expires_in_seconds: int = 300,
) -> str:
    app_id = (os.environ.get("FORGER_DESKTOP_RUNTIME_APP_ID") or "").strip()
    secret = (os.environ.get("FORGER_APP_GRANT_SECRET") or "").strip()
    folder_path = path.strip()
    if not app_id or not secret:
        raise ForgerAppGrantUnavailable(
            "Forger app folder grant signing is not available",
        )
    if not folder_path:
        raise ValueError("folder grant path is required")

    payload = _base64url_json(
        {
            "appId": app_id,
            "path": folder_path,
            "exp": int(time.time()) + max(1, int(expires_in_seconds)),
        },
    )
    signature = _base64url_bytes(
        hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).digest(),
    )
    return f"{payload}.{signature}"


def request_folder_grant_for_path(
    *,
    path: str,
    expires_in_seconds: int = 300,
) -> dict[str, Any]:
    return request_folder_grant(
        grant_token=create_folder_grant_token(
            path=path,
            expires_in_seconds=expires_in_seconds,
        ),
    )


def request_folder_grant(
    *,
    grant_token: str,
) -> dict[str, Any]:
    return _request(
        "POST",
        "/folder-grants/request",
        {
            "grantToken": grant_token,
        },
    )


def list_folder_grants() -> dict[str, Any]:
    return _request("GET", "/folder-grants", None)


def revoke_folder_grant(grant_id: str) -> dict[str, Any] | None:
    return _request(
        "DELETE",
        f"/folder-grants/{quote(grant_id, safe='')}",
        None,
    )


def list_connections() -> dict[str, Any]:
    return _request("GET", "/connections", None)


def get_connection_status(connection_type: str) -> dict[str, Any]:
    return _request(
        "GET",
        f"/connections/{quote(connection_type, safe='')}/status",
        None,
    )


def connection_status(connection_type: str) -> dict[str, Any]:
    return get_connection_status(connection_type)


def call_connection_action(
    connection_type: str,
    action_id: str,
    input: dict[str, Any] | None = None,
    connection_id: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"input": input or {}}
    if connection_id:
        body["connectionId"] = connection_id
    return _request(
        "POST",
        f"/connections/{quote(connection_type, safe='')}/actions/{quote(action_id, safe='')}",
        body,
    )


def start_agent_task(
    *,
    template_id: str,
    locale: str | None = None,
    arguments: dict[str, Any] | None = None,
    variables: dict[str, Any] | None = None,
    attachments: list[dict[str, Any]] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return _request(
        "POST",
        "/agent-tasks",
        {
            "templateId": template_id,
            "locale": locale or None,
            "arguments": arguments or None,
            "variables": variables or None,
            "attachments": attachments or None,
            "workspacePath": workspace_path or None,
            "workspace": workspace or None,
        },
    )


def get_agent_task(run_id: str) -> dict[str, Any] | None:
    return _request("GET", f"/agent-tasks/{run_id}", None)


def cancel_agent_task(run_id: str) -> dict[str, Any]:
    return _request("POST", f"/agent-tasks/{run_id}/cancel", {})


def wait_for_task(
    *,
    run_id: str,
    timeout_seconds: int = 600,
    poll_interval_seconds: float = 1.0,
) -> dict[str, Any]:
    deadline = time.monotonic() + max(1, timeout_seconds)
    last: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        task = get_agent_task(run_id)
        if task:
            last = task
            if str(task.get("status") or "") in TERMINAL_TASK_STATUSES:
                return task
        time.sleep(max(0.2, poll_interval_seconds))
    raise ForgerDesktopRuntimeError(f"agent task timed out: {last or run_id}")


def start_manifest_agent_thread(
    *,
    agent_id: str,
    title: str | None = None,
    variables: dict[str, Any] | None = None,
    runtime: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return _request(
        "POST",
        f"/agents/{agent_id}/start",
        {
            "title": title or None,
            "variables": variables or None,
            "runtime": runtime or None,
            "metadata": metadata or None,
            "workspacePath": workspace_path or None,
            "workspace": workspace or None,
        },
    )


def resume_manifest_agent_thread(
    *,
    desktop_thread_id: str,
    variables: dict[str, Any] | None = None,
    runtime: dict[str, Any] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return _request(
        "POST",
        f"/agent-threads/{desktop_thread_id}/resume",
        {
            "variables": variables or None,
            "runtime": runtime or None,
            "workspacePath": workspace_path or None,
            "workspace": workspace or None,
        },
    )


def steer_manifest_agent_run(
    *,
    desktop_thread_id: str,
    desktop_run_id: str,
    variables: dict[str, Any] | None = None,
    runtime: dict[str, Any] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return _request(
        "POST",
        f"/agent-threads/{desktop_thread_id}/runs/{desktop_run_id}/steer",
        {
            "variables": variables or None,
            "runtime": runtime or None,
            "workspacePath": workspace_path or None,
            "workspace": workspace or None,
        },
    )


def create_agent_thread(
    *,
    title: str,
    manifest_agent_id: str,
    initial_prompt: str,
    runtime: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    thread = start_manifest_agent_thread(
        agent_id=manifest_agent_id,
        title=title,
        variables={"message": initial_prompt},
        runtime=runtime,
        metadata=metadata,
        workspace_path=workspace_path,
        workspace=workspace,
    )
    return _with_legacy_thread_aliases(thread)


def start_agent_run(
    *,
    desktop_thread_id: str,
    message: str,
    context: str | None = None,
    runtime: dict[str, Any] | None = None,
    workspace_path: str | None = None,
    workspace: dict[str, Any] | None = None,
) -> dict[str, Any]:
    run = resume_manifest_agent_thread(
        desktop_thread_id=desktop_thread_id,
        variables={
            "message": message,
            "context": context or "",
            "session_state": context or "",
        },
        runtime=runtime,
        workspace_path=workspace_path,
        workspace=workspace,
    )
    return _with_legacy_run_aliases(run)


def get_agent_thread(desktop_thread_id: str) -> dict[str, Any] | None:
    return _request("GET", f"/agent-threads/{desktop_thread_id}", None)


def get_agent_run(desktop_thread_id: str, desktop_run_id: str) -> dict[str, Any] | None:
    return _request(
        "GET",
        f"/agent-threads/{desktop_thread_id}/runs/{desktop_run_id}",
        None,
    )


def cancel_agent_run(desktop_thread_id: str, desktop_run_id: str) -> dict[str, Any]:
    return _request(
        "POST",
        f"/agent-threads/{desktop_thread_id}/runs/{desktop_run_id}/cancel",
        {},
    )


def wait_for_run(
    *,
    desktop_thread_id: str,
    desktop_run_id: str,
    timeout_seconds: int = 600,
    poll_interval_seconds: float = 1.0,
) -> dict[str, Any]:
    deadline = time.monotonic() + max(1, timeout_seconds)
    last: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        run = get_agent_run(desktop_thread_id, desktop_run_id)
        if run:
            last = run
            if str(run.get("status") or "") in TERMINAL_RUN_STATUSES:
                return run
        time.sleep(max(0.2, poll_interval_seconds))
    raise ForgerDesktopRuntimeError(f"agent run timed out: {last or desktop_run_id}")


def _request(method: str, app_path: str, body: dict[str, Any] | None) -> Any:
    config = _config()
    path = f"/v1/apps/{config.app_id}{app_path}"
    body_bytes = (
        b""
        if body is None
        else json.dumps(_strip_none(body), separators=(",", ":")).encode("utf-8")
    )
    body_sha = hashlib.sha256(body_bytes).hexdigest()
    timestamp = datetime.now(UTC).isoformat()
    signature_payload = "\n".join(
        [method.upper(), path, timestamp, body_sha],
    ).encode("utf-8")
    signature = hmac.new(
        config.secret.encode("utf-8"),
        signature_payload,
        hashlib.sha256,
    ).hexdigest()
    request = Request(
        f"{config.url}{path}",
        data=None if method.upper() == "GET" else body_bytes,
        method=method.upper(),
        headers={
            "content-type": "application/json",
            "x-forger-app-id": config.app_id,
            "x-forger-timestamp": timestamp,
            "x-forger-body-sha256": body_sha,
            "x-forger-signature": signature,
        },
    )
    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        raise ForgerDesktopRuntimeError(
            f"desktop runtime returned {error.code}: {raw}",
        ) from error
    except URLError as error:
        raise ForgerDesktopRuntimeError(
            f"desktop runtime unavailable: {error.reason}",
        ) from error


def _config() -> ForgerDesktopRuntimeConfig:
    config = _config_or_none()
    if not config:
        raise ForgerDesktopRuntimeUnavailable(
            "Forger Desktop runtime bridge is not available",
        )
    return config


def _config_or_none() -> ForgerDesktopRuntimeConfig | None:
    url = normalize_runtime_url(os.getenv("FORGER_DESKTOP_RUNTIME_URL", ""))
    app_id = os.getenv("FORGER_DESKTOP_RUNTIME_APP_ID", "")
    secret = os.getenv("FORGER_DESKTOP_RUNTIME_SECRET", "")
    if not url or not app_id or not secret:
        return None
    return ForgerDesktopRuntimeConfig(url=url, app_id=app_id, secret=secret)


def normalize_runtime_url(raw_url: str) -> str:
    url = raw_url.strip().rstrip("/")
    if not url:
        return ""
    parsed = urlsplit(url)
    legacy_path = parsed.path.lower()
    if "forgerapp" in legacy_path or "bridge" in legacy_path:
        return urlunsplit((parsed.scheme, parsed.netloc, "", "", "")).rstrip("/")
    return url


def _strip_none(value: dict[str, Any]) -> dict[str, Any]:
    return {key: item for key, item in value.items() if item is not None}


def _base64url_json(value: dict[str, Any]) -> str:
    return _base64url_bytes(
        json.dumps(value, separators=(",", ":")).encode("utf-8"),
    )


def _base64url_bytes(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _with_legacy_thread_aliases(thread: dict[str, Any]) -> dict[str, Any]:
    desktop_thread_id = str(thread.get("desktop_thread_id") or "")
    if desktop_thread_id and not thread.get("threadId"):
        thread = {
            **thread,
            "threadId": desktop_thread_id,
            "id": thread.get("id") or desktop_thread_id,
        }
    return thread


def _with_legacy_run_aliases(run: dict[str, Any]) -> dict[str, Any]:
    desktop_run_id = str(run.get("desktop_run_id") or "")
    if desktop_run_id and not run.get("runId"):
        run = {
            **run,
            "runId": desktop_run_id,
            "id": run.get("id") or desktop_run_id,
        }
    return run
