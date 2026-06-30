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
      example: "Example",
    },
  },
  dashboard: {
    title: "App starting point",
    description:
      "Use this dashboard as a minimal shell while you design the app's real first screen.",
    exampleTitle: "Replaceable example",
    exampleDescription:
      "A scaffold-only view to delete when the real app frontend is implemented.",
    openExample: "Open example",
  },
  examples: {
    title: "Example feature",
    description:
      "This placeholder is only here to show the route and layout shape. Remove it when building the real app.",
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
  notFound: {
    title: "View not found",
    description: "This route is not part of the app shell.",
    action: "Back to dashboard",
  },
};
