import type { Dictionary } from ".";

export const en: Dictionary = {
  app: {
    title: "skeleton",
    subtitle: "FastAPI + uv · Vite + React + Tailwind/shadcn",
  },
  navigation: {
    label: "Primary navigation",
    items: {
      dashboard: "Dashboard",
      examples: "Examples",
      status: "Status",
    },
  },
  dashboard: {
    title: "App starting point",
    description:
      "Use this dashboard as a summary and routing surface. Move real work into dedicated feature views.",
    examplesTitle: "Feature list",
    examplesDescription:
      "A replaceable list view pattern for the first business area in the app.",
    statusTitle: "Runtime status",
    statusDescription:
      "Check that the frontend can still reach the FastAPI backend.",
    openExamples: "Open list",
    openStatus: "Check status",
  },
  examples: {
    title: "Example feature",
    description:
      "Replace this placeholder with the app's first real list, details, and create or edit flow.",
    create: "Create item",
    itemColumn: "Item",
    statusColumn: "Status",
    rowDescription: "Placeholder row for app-specific data.",
    rows: {
      draft: "Draft item",
      review: "Review item",
      done: "Completed item",
    },
  },
  status: {
    title: "Runtime status",
    description:
      "This view verifies that the frontend and backend can communicate.",
    cardTitle: "Backend connection",
    cardDescription: "The status updates when realtime events arrive.",
    loading: "Connecting...",
    ok: "API connected",
    error: "API unavailable",
  },
  notFound: {
    title: "View not found",
    description: "This route is not part of the app shell.",
    action: "Back to dashboard",
  },
};
