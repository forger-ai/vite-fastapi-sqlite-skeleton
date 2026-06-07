import { describe, expect, it } from "vitest";
import {
  appNavigationItems,
  appRoutePaths,
  dashboardRoute,
  examplesRoute,
  routeTree,
  statusRoute,
} from "./routes";

describe("skeleton app shell routes", () => {
  it("keeps a multi-view navigation contract for new apps", () => {
    expect(appNavigationItems.map((item) => item.id)).toEqual([
      "dashboard",
      "examples",
      "status",
    ]);
    expect(appNavigationItems.map((item) => item.path)).toEqual([
      appRoutePaths.dashboard,
      appRoutePaths.examples,
      appRoutePaths.status,
    ]);
  });

  it("keeps dashboard, feature list, status, and fallback routes explicit", () => {
    expect(appRoutePaths).toEqual({
      dashboard: "/",
      examples: "/examples",
      status: "/status",
      fallback: "*",
    });
  });

  it("builds the shell around TanStack Router child routes", () => {
    expect(routeTree.children).toEqual([
      dashboardRoute,
      examplesRoute,
      statusRoute,
    ]);
  });
});
