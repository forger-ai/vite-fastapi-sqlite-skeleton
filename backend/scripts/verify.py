"""Run backend quality gates for vite-fastapi-sqlite skeleton apps."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(label: str, command: list[str]) -> bool:
    print(f"\n-> {label}: {' '.join(command)}")
    try:
        result = subprocess.run(command, cwd=ROOT, check=False)
    except FileNotFoundError as exc:
        print(f"  skipped: {exc}")
        return True
    if result.returncode != 0:
        print(f"  FAILED with exit code {result.returncode}")
        return False
    print("  ok")
    return True


def main() -> int:
    ok = True
    ok = run(
        "Ruff",
        ["uv", "run", "--extra", "dev", "ruff", "check", "src/app", "scripts", "tests"],
    ) and ok
    ok = run("Pytest coverage", ["uv", "run", "--extra", "dev", "pytest"]) and ok
    print("\n" + ("All checks passed." if ok else "Some checks failed."))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
