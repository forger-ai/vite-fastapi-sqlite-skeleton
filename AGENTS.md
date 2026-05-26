# AGENTS

## Source of Truth

This file is the main functional and operational context source for this app.

If `manifest.json` exists, use it for installation, service, and script metadata. Do not use it as the list of visible app capabilities.

When `.agents/skills/forger-manifest-authoring` exists, read it before creating or editing `manifest.json`.

When `.agents/skills/forger-desktop-runtime-bridge` exists, read it before wiring app backend routes that start, poll, cancel, or resume manifest promptTemplate tasks or manifest agent threads through Forger Desktop.

`cloudMessaging` in `manifest.json` controls whether Forger Desktop exposes cross-user message helpers to the app. It is an internal platform capability. Do not describe it as a visible app feature unless the app UI and documentation also implement a user-facing messaging workflow.

The agent must always distinguish between:

- visible app capabilities
- internal agent tools

Key rule: internal tools can be used to execute tasks, but they must not be presented as the app interface or as steps the person must run manually.

## Manifest Declaration Roles

The manifest can declare several agent-facing surfaces. They have different roles and must not be treated as interchangeable.

- `promptTemplates` are atomic, form-backed task prompts. Use them for one clearly bounded job with declared inputs, deterministic completion criteria, and no expectation of ongoing chat state.
- `promptTemplates` must use `title`, `description`, `arguments`, and `prompt`. Do not use `name` or `inputs` for prompt templates.
- Prompt template example: `"promptTemplates": [{ "id": "load-records", "title": "Load records", "description": "Read a shared file and load confirmed records.", "arguments": [{ "name": "file", "type": "file", "required": true, "acceptedFileTypes": [".csv", ".xlsx"] }], "prompt": "Read {{file}}, validate the rows, and load the confirmed records." }]`.
- `agents` are resumable app coworkers or orchestrators. Use them for ongoing conversations, multi-turn planning, steering, review, or work that needs a thread to continue later. Manifest agents can declare provider-aware `runtimeRecommendations` for `codex` and `claude`; for new manifests, prefer those recommendations over a rigid fixed runtime unless the app truly requires a specific provider or model.
- `agents` must use `title` plus either `initialPrompt` or `prompts.initial.body`. Do not use `name` or `prompt` for manifest agents.
- Preferred agent example: `"agents": [{ "id": "advisor", "title": "Advisor", "description": "A resumable coworker that helps you review decisions.", "kind": "thread_interface", "prompts": { "initial": { "body": "You are {{advisor_name}}. Help with this goal: {{goal}}.", "variables": { "advisor_name": { "type": "text", "required": true }, "goal": { "type": "text", "required": true } } }, "resume": { "body": "Continue helping with the current goal. New context: {{context}}.", "variables": { "context": { "type": "text", "required": false } } }, "steer": { "body": "Adjust the current work with this instruction: {{instruction}}.", "variables": { "instruction": { "type": "text", "required": true } } } } }]`.
- `tools` declares official Forger tools the app is allowed to access through Forger. Today the only official tool is Gmail. Do not use `tools` for app-owned data actions, scripts, MCP servers, or visible features.
- `tools.required` and `tools.optional` must contain objects, not strings. Each object must include `toolId`, `reason`, and `actions`.
- Gmail manifest declaration example: `"tools": { "required": [], "optional": [{ "toolId": "gmail", "reason": "Lets this app help you search, read, download attachments from, or draft/send email when you explicitly ask.", "actions": ["gmail.connection.status", "gmail.search_messages", "gmail.read_thread", "gmail.read_attachment", "gmail.send_email"] }] }`.
- `appSecrets` are declarations that name credentials an app may need. They must never contain secret values, and secret values must never be copied into prompts, memory, logs, generated files, or final messages.
- `scripts` are internal fallback automation for tasks not covered by app MCP tools, backend APIs, or another structured app-owned interface. Prefer app-owned structured interfaces before scripts when they exist.

## Product Identity

- id: `vite-fastapi-sqlite-skeleton`
- recommended visible name: `Skeleton`
- type: base template for creating new apps on the `vite-fastapi-sqlite` stack
- status: minimal functional base, without a specific business domain

## Functional Goal

Skeleton exists to accelerate creation of new Forger apps with a consistent baseline:

- working FastAPI backend
- working Vite + React frontend
- functional frontend-backend connection
- shared stack contract through the `commons/` submodule

It is not a final business app. It is a starting point.

## Target User

### Primary Person

- the person turning this skeleton into their own local Forger app
- the person who wants to quickly validate that their local app runtime works

### Demo Use

- the person checking that their app is alive

## Real Functional Scope

### What It Does Today

- starts frontend and backend locally
- responds to `GET /api/health` from the backend
- shows API connectivity status in the frontend
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

### 1. Verify General App Status

Examples:

- "is the app running?"
- "does the backend respond?"
- "why does the screen say API unavailable?"

Expected response:

- confirm visible status
- guide in simple functional terms
- avoid unnecessary internals unless requested

### 2. Confirm Frontend-Backend Connectivity

Examples:

- "what exactly does this template validate?"
- "what does API connected mean?"

Expected response:

- explain that the frontend checks backend health
- explain in simple language that both services are communicating

### 3. Request Template Evolution

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

Rule: if an improvement is reusable by multiple apps in the stack, consider moving it to `vite-fastapi-sqlite-commons`.

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

### Changelog

`manifest.json` keeps one `changelog` entry for each published version.

The changelog describes visible and operational changes the desktop can show when it detects an update.

Do not use the changelog to invent capabilities: it only summarizes real differences in that version.

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

## Allowed Agent Tasks

The agent must classify each user request into one main task before responding.

Valid tasks:

- `resolver_dudas`
- `trabajar_datos`
- `modificar_aplicacion`
- `interactuar_con_aplicacion`

### resolver_dudas

Applies to:

- usage questions
- capability clarifications
- basic functional troubleshooting

Rules:

- verify real repo context before making claims
- do not invent features
- use a simple, direct tone

### trabajar_datos

Applies to:

- requests involving persistent data reads/writes
- consistency validations

In this base app:

- data scope is minimal
- there is no strong default business model

Rules:

- avoid destructive operations without clear confirmation
- maintain consistency
- clearly report what changes will be made

### modificar_aplicacion

Applies to:

- adding endpoints
- creating screens
- changing flows
- adjusting UX

Rules:

- define functional scope first
- ask clarifying questions when context is missing
- do not assume edge cases
- respond in non-technical language for the person using the app
- do not mention files/implementation unless requested

### interactuar_con_aplicacion

Applies to:

- practical operations with the already installed app
- executing available flows
- using scripts/internal actions as a bridge

Rules:

- the visible result must be described in product terms
- hide internal operational details if unnecessary

## Minimum Protocol Before Responding

Before responding to any request:

1. Identify whether the request is within this app domain.
2. Determine the main task (`resolver_dudas`, `trabajar_datos`, `modificar_aplicacion`, `interactuar_con_aplicacion`).
3. Review real repo context (AGENTS, structure, scripts, services).
4. Confirm the response does not invent capabilities.
5. Respond in the language used in the request.

## Response Playbooks

### Question: "what can I do with this app?"

Answer only with current real visible capabilities:

- verify API status
- validate frontend-backend connectivity
- use it as a base to build new functions

Do not list nonexistent business functions.

### Question: "what should I configure first?"

Because this is a base template, the correct sequence is:

1. start services
2. confirm health
3. define the first functional business flow to implement

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

Forger saves applied app changes as internal versions. After implementing a requested change, save it as a new internal version before finishing. If the person reviews the result and asks for an adjustment, save that adjustment as another internal version. Use commits as the internal rollback mechanism, but talk about saved versions and previous versions unless technical details are requested.

## New App Creation Standards

When turning this skeleton into a concrete app, define the first real personal flow before expanding infrastructure. The app should remain local-first, understandable to the person using it, and consistent with the `vite-fastapi-sqlite` stack.

- For non-trivial behavior, write or update BDD/spec tests before implementation. Cover the backend behavior, frontend flow, and app integration point that prove the requested behavior.
- Where the app or stack enforces coverage thresholds, treat 100% coverage as the target for affected backend/frontend surfaces. If complete coverage is not practical, record the specific gap and why it remains.
- Build frontend changes as a browser-safe Vite React app using Tailwind CSS for styling, shadcn/ui copied components, and Radix primitives when accessible headless behavior is needed. Keep screens mobile-consistent and do not add Electron, Node, preload, `ipcRenderer`, `contextBridge`, or `window.forgerApp` dependencies to frontend code.
- Keep React frontend code in the feature-first structure: `frontend/src/app` for root wiring, `frontend/src/features/<area>` for domain screens and feature-local components/hooks, `frontend/src/components` for cross-feature reusable UI and shadcn-style primitives, `frontend/src/api` for backend contracts, `frontend/src/lib` for pure helpers, `frontend/src/i18n` for copy, and `frontend/src/styles` or `frontend/src/design-system` for Tailwind tokens and shared design setup. Keep `App.tsx` thin.
- Keep persistence, validation, import/export rules, secret usage, MCP tools, app scripts, and privileged Forger integration in the backend. The frontend sends intent and renders state; it does not own the only copy of business rules.
- Model SQLite data with explicit SQLModel tables, typed columns, constraints, relationships, and migrations. Do not add JSON columns unless the data is genuinely schemaless and the reason is documented in the app contract or migration notes.
- Keep secrets out of prompts, memory, logs, screenshots, generated files, test fixtures, and final messages. Manifest `appSecrets` entries declare requirements only; they never store values.
- Keep reusable stack infrastructure in `commons`. Keep app business rules, app copy, screens, seeds, prompts, product-specific scripts, and domain tests in the app repo.

## Tone

- clear
- direct
- simple
- no unnecessary jargon
- no promises about unimplemented capabilities
