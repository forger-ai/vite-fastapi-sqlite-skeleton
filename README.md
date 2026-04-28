# vite-fastapi-sqlite-skeleton

Base template for new Forger apps using the `vite-fastapi-sqlite` stack.

This repo **does depend on the stack common package** and must be used with submodules.
The goal is for every new app to inherit the same runtime and shared utilities
(`Dockerfile`, `database.py`, `health.py`, `cors.py`, `client.ts`) from `commons/`.

## Stack Common Dependency

- Required submodule: `commons/`
- Expected remote: `git@github.com:forger-ai/vite-fastapi-sqlite-commons.git`
- This skeleton is prepared for Docker to mount files from `commons` over:
  - `backend/src/app/database.py`
  - `backend/src/app/health.py`
  - `backend/src/app/cors.py`
  - `frontend/src/api/client.ts`

This avoids drift between apps and centralizes cross-cutting stack changes.

## Structure

```text
vite-fastapi-sqlite-skeleton/
├── .gitmodules
├── commons/                         # submodule: stack shared code
├── docker-compose.yml               # uses dockerfiles/helpers from commons
├── backend/
│   ├── pyproject.toml
│   ├── data/
│   └── src/app/
│       ├── main.py
│       ├── database.py              # local fallback, overridden by commons in Docker
│       ├── health.py                # local fallback, overridden by commons in Docker
│       ├── cors.py                  # local fallback, overridden by commons in Docker
│       └── models.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── theme.ts
│       └── api/client.ts            # local fallback, overridden by commons in Docker
└── scripts/
    └── package_app.sh
```

## Correct Clone

Always clone with submodules:

```bash
git clone --recurse-submodules git@github.com:forger-ai/vite-fastapi-sqlite-skeleton.git
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

## Recommended Development (Docker + commons)

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Health: `GET http://localhost:8000/api/health`

## Local Development without Docker (fallback)

You can run locally without Compose using the repo fallback versions:

```bash
cd backend
uv sync
uv run fastapi dev src/app/main.py
```

```bash
cd frontend
npm install
npm run dev
```

This is useful for quick iteration, but the canonical stack path is Docker with mounts to `commons`.

## Update the Stack Common

```bash
git submodule update --remote commons
git add commons
git commit -m "chore: bump commons"
```

## Convention for New Derived Apps

When creating an app from this skeleton:

1. Keep `commons/` as a submodule.
2. Preserve the `docker-compose.yml` mount pattern.
3. Avoid copying and forking shared files unless strictly necessary.
4. If you add reusable utilities for multiple apps, move them to `vite-fastapi-sqlite-commons`.
5. Keep `manifest.json` with one `changelog` entry for each published version.
6. Verify that the distributable ZIP does not include `.git` at any level.
