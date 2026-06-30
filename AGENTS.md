# AGENTS

## Source of Truth

This file is the main functional and operational context source for this app.

If `manifest.json` exists, treat it as runtime metadata. Do not use it as the list of visible app capabilities.

When a manifest-authoring skill exists under `.agents/skills/`, read it before creating or editing `manifest.json`.

When a runtime-bridge skill exists under `.agents/skills/`, read it before wiring backend routes that communicate with platform runtime bridge features.

The agent must always distinguish between:

- visible app capabilities
- internal agent tools

Key rule: internal tools can be used to execute tasks, but they must not be presented as the app interface or as steps the person must run manually.

## Product Identity

- id: `vite-fastapi-sqlite-skeleton`
- recommended visible name: `Skeleton`
- type: base template for creating new apps on the `vite-fastapi-sqlite` stack
- status: minimal functional base, without a specific business domain

## Functional Goal

Skeleton exists to accelerate creation of local apps with a consistent baseline:

- working FastAPI backend
- working Vite + React frontend
- backend runtime health contract for Desktop and service checks
- shared stack contract through the `commons/` submodule

It is not a final business app. It is a starting point.

## Target User

### Primary Person

- the person turning this skeleton into their own local app
- the person who wants to quickly validate that their local app runtime works

### Demo Use

- the person checking that their app is alive

## Real Functional Scope

### What It Does Today

- starts frontend and backend locally
- responds to `GET /api/health` from the backend
- shows a minimal frontend shell with a removable `/example` route
- uses TanStack Query for frontend server state
- can refresh server state from the stack realtime channel
- provides a base structure for expanding features

### What It Does Not Do Today

- authentication
- role-based authorization
- business flows such as finance, inventory, CRM, etc.
- default external integrations
- default file ingestion
- default batch processing

The agent must not invent capabilities outside this scope.

## Visible Capabilities

These are the actions you can present as real to the person using the app.

### 1. Review The Starting Frontend Shell

Examples:

- "what is on the starter screen?"
- "what should I replace first?"

Expected response:

- explain that the dashboard and `/example` route are scaffold-only
- say the real app frontend should replace them
- guide in simple functional terms
- avoid unnecessary internals unless requested

### 2. Request Template Evolution

Examples:

- "I want to turn this into an app for X"
- "add endpoint Y and screen Z"

Expected response:

- ask for concrete functional scope
- clarify acceptance criteria
- propose functional steps before code

## Capabilities You Must Not Assume

Do not claim the app supports these functions unless they were explicitly implemented:

- bank accounts
- credit cards
- budgets
- alerts
- 2FA
- advanced reports
- real business dashboards
- CSV importers in the UI
- rule engine
- cloud sync
- multi-account or team workflows

Also do not assume:

- complex persistence
- defined migrations
- backup/restore policies
- background jobs

## Internal Agent Tools

These tools are for internal agent operation. Do not present them as app usage steps unless the person explicitly asks for technical details.

### Repository and Structure

- `backend/`
- `frontend/`
- `commons/` (submodule)
- `docker-compose.yml`
- `scripts/package_app.sh`

### `commons/` Submodule

Shared stack source:

- `commons/backend/Dockerfile`
- `commons/backend/database.py`
- `commons/backend/health.py`
- `commons/backend/cors.py`
- `commons/frontend/Dockerfile`
- `commons/frontend/client.ts`
- `commons/docker-compose.base.yml`

`GET /api/health` is a backend/runtime contract used by Desktop and service checks. It is not a product screen and the frontend must not preserve an API connection demo when the skeleton becomes a real app.

Rule: if an improvement is reusable by multiple apps in the stack, consider moving it to `vite-fastapi-sqlite-commons`.
For backend WebSocket URLs, apps must use the commons `apiWebSocketUrl()` helper instead of replacing `URL.pathname` manually, because installed apps receive a prefixed `VITE_API_BASE_URL`.

### Docker Compose

`docker-compose.yml` mounts helpers from `commons` over local files:

- `/app/src/app/database.py`
- `/app/src/app/health.py`
- `/app/src/app/cors.py`
- `/app/src/api/client.ts`

Implication:

- in Docker, the mounted files from `commons` take precedence
- outside Docker, local fallbacks are used

### Skill `skills/stack-database-extension`

Audience: agent.

Main task: modificar_aplicacion.

Use when an app based on this skeleton needs SQLModel models, database initialization, SQLite migrations, Docker Compose mounts related to `app.database`, or internal scripts that depend on the database.

This skill documents the current stack pattern:

- `commons/backend/database.py` is the shared database helper;
- Docker Compose mounts that shared helper over the local app helper;
- each app registers models and keeps its own migrations in a local extension, conventionally `database_ext.py`;
- backend and internal scripts in each app must call the app initializer so they do not skip app-specific migrations.

Do not solve app-specific migration needs by removing the `commons/backend/database.py` mount. If a migration depends on tables or data from a concrete app, it must live in that app local extension, not in commons.

Do not present this skill as a usage tool. Translate it to functional impact and keep commands/paths as internal details unless explicitly requested.

### Local Backend

Typical internal commands:

- `cd backend && uv sync`
- `cd backend && uv run fastapi dev src/app/main.py`

### Local Frontend

Typical internal commands:

- `cd frontend && npm install`
- `cd frontend && npm run dev`

### Packaging

Internal script:

- `scripts/package_app.sh`

Use:

- generate a distributable ZIP without temporary artifacts
- exclude Git metadata at every level, including submodules
- do not ask the person to run internal paths unless they ask for technical mode

## Communication Rule

### General Principle

Translate internal tools into product language.

### Do Not Ask the Final User For

- filesystem paths
- shell commands
- internal folder structure
- Git submodule manipulation

### If the User Asks for Technical Details

If the person explicitly asks "how does it work internally", then you can explain:

- scripts
- mounts
- Dockerfiles
- internal paths

Keep the explanation clear and precise.

## Response Playbooks

### Question: "what can I do with this app?"

Answer only with current real visible capabilities:

- open the starter shell
- inspect the removable `/example` placeholder
- use it as a base to build real app functions

Do not list nonexistent business functions.

### Question: "what should I configure first?"

Because this is a base template, the correct sequence is:

1. start services
2. define the first functional business flow to implement
3. replace the scaffold frontend with real app screens

Do not recommend product configurations that do not exist in the skeleton.

### Ambiguous Change Request

If they say "improve it" or "make it more useful", answer by asking for scope:

- business goal
- personal goal
- main flow
- minimum required data

## Safety and Consistency

- do not run mass deletions without confirmation
- avoid implicit behavior changes
- maintain compatibility with the `vite-fastapi-sqlite` stack
- if there is conflict between old docs and this file, this file takes precedence

## Evolution Conventions

When deriving an app from this skeleton:

1. Keep `AGENTS.md` as the single functional source for the agent.
2. Clearly separate:
   - `User-Visible Capabilities`
   - `Internal Agent Tools`
3. Version relevant agent contract changes.
4. Avoid contradictory instructions across multiple files.

## New App Creation Standards

When turning this skeleton into a concrete app, define the first real personal flow before expanding infrastructure. The app should remain local-first, understandable to the person using it, and consistent with the `vite-fastapi-sqlite` stack.

- For non-trivial behavior, write or update BDD/spec tests before implementation. Cover the backend behavior, frontend flow, and app integration point that prove the requested behavior.
- Where the app or stack enforces coverage thresholds, treat 100% coverage as the target for affected backend/frontend surfaces. If complete coverage is not practical, record the specific gap and why it remains.
- Build frontend changes as a browser-safe Vite React app using Tailwind CSS for styling, shadcn/ui copied components, and Radix primitives when accessible headless behavior is needed. Keep screens mobile-consistent and do not add Electron, Node, preload, `ipcRenderer`, `contextBridge`, or `window.forgerApp` dependencies to frontend code.
- Keep React frontend code in the feature-first structure: `frontend/src/app` for root wiring, `frontend/src/features/<area>` for domain screens and feature-local components/hooks, `frontend/src/components` for cross-feature reusable UI and shadcn-style primitives, `frontend/src/api` for backend contracts, `frontend/src/lib` for pure helpers, `frontend/src/i18n` for copy, and `frontend/src/styles` or `frontend/src/design-system` for Tailwind tokens and shared design setup. Keep `App.tsx` thin.
- Keep persistence, validation, import/export rules, secret usage, app tools, scripts, and privileged platform integration in the backend. The frontend sends intent and renders state; it does not own the only copy of business rules.
- Model SQLite data with explicit SQLModel tables, typed columns, constraints, relationships, and migrations. Do not add JSON columns unless the data is genuinely schemaless and the reason is documented in the app contract or migration notes.
- Keep secrets out of prompts, memory, logs, screenshots, generated files, test fixtures, and final messages.
- Keep reusable stack infrastructure in `commons`. Keep app business rules, app copy, screens, seeds, prompts, product-specific scripts, and domain tests in the app repo.

## Tone

- clear
- direct
- simple
- no unnecessary jargon
- no promises about unimplemented capabilities
