import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Home, ListChecks, type LucideIcon } from "lucide-react";
import { AppShell } from "./AppShell";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ExampleView } from "@/features/example/ExampleView";
import { NotFoundView } from "@/features/not-found/NotFoundView";

export type AppRouteId = "dashboard" | "example";

export type AppNavigationItem = {
  id: AppRouteId;
  path: "/" | "/example";
  icon: LucideIcon;
};

export const appNavigationItems: AppNavigationItem[] = [
  { id: "dashboard", path: "/", icon: Home },
  { id: "example", path: "/example", icon: ListChecks },
];

export const appRoutePaths = {
  dashboard: "/",
  example: "/example",
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

export const exampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: appRoutePaths.example,
  component: ExampleView,
});

export const routeTree = rootRoute.addChildren([
  dashboardRoute,
  exampleRoute,
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
