import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Activity, Home, ListChecks, type LucideIcon } from "lucide-react";
import { AppShell } from "./AppShell";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ExamplesView } from "@/features/examples/ExamplesView";
import { NotFoundView } from "@/features/not-found/NotFoundView";
import { StatusView } from "@/features/status/StatusView";

export type AppRouteId = "dashboard" | "examples" | "status";

export type AppNavigationItem = {
  id: AppRouteId;
  path: "/" | "/examples" | "/status";
  icon: LucideIcon;
};

export const appNavigationItems: AppNavigationItem[] = [
  { id: "dashboard", path: "/", icon: Home },
  { id: "examples", path: "/examples", icon: ListChecks },
  { id: "status", path: "/status", icon: Activity },
];

export const appRoutePaths = {
  dashboard: "/",
  examples: "/examples",
  status: "/status",
  fallback: "*",
} as const;

export const rootRoute = createRootRoute({
  component: AppShell,
});

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: appRoutePaths.dashboard,
  component: DashboardView,
});

export const examplesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: appRoutePaths.examples,
  component: ExamplesView,
});

export const statusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: appRoutePaths.status,
  component: StatusView,
});

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  examplesRoute,
  statusRoute,
]);

export const appRouter = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundView,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof appRouter;
  }
}
