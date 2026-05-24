---
name: forger-locale-module
description: Use when wiring locale, language detection, or visible app copy in a vite-fastapi-sqlite app. Keep locale detection in commons and app copy in local dictionaries.
---

# Forger Locale Module

This skill is for the agent, not for the end user.

Use it when an app needs to detect the Forger language, switch dictionaries,
localize visible copy, or pass locale into Forger-backed assistant tasks.

## Stack Contract

- Use `frontend/src/api/locale.ts` for locale normalization and initial locale detection.
- Use the app backend route `GET /api/forger/context` when the app needs Forger Desktop runtime context.
- The frontend must call the app backend. It must not call Desktop directly, read Desktop secrets, or depend on `window.forgerApp`.
- The backend route is backed by `app.forger_context`, which uses the signed Desktop runtime bridge through `app.forger_desktop`.
- If Desktop is not connected, the backend returns a fallback context and the frontend keeps its browser or URL-derived locale.

## Copy Rules

- Keep user-visible text in app-local dictionaries such as `frontend/src/i18n/es.ts` and `frontend/src/i18n/en.ts`.
- Do not hard-code visible UI copy in React components, backend routes, prompts, or services.
- Commons owns locale mechanics only. It does not own product dictionaries or domain wording.
- When adding a visible string, add Spanish and English entries together unless the app explicitly supports only one locale.

## Implementation Checklist

- Import `initialLocale`, `loadForgerRuntimeContext`, and `Locale` from `frontend/src/api/locale.ts`.
- Initialize the provider from URL/browser detection so first render works.
- After mount, load `/api/forger/context` and apply it only when `source === "desktop"`.
- Keep `document.documentElement.lang` synchronized with the active locale.
- Pass the active locale to Forger-backed assistant routes when those routes accept locale.
- Add or update tests for URL locale, browser fallback, Desktop context, and fallback behavior.
