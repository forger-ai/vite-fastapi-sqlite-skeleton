import { describe, expect, it } from "vitest";
import {
  appNavigationItems,
  appRoutePaths,
  dashboardRoute,
  exampleRoute,
  routeTree,
} from "./routes";

describe("skeleton app shell routes", () => {
  it("defines the starter navigation items", () => {
    expect(appNavigationItems.map((item) => item.id)).toEqual([
      "dashboard",
      "example",
    ]);
    expect(appNavigationItems.map((item) => item.path)).toEqual([
      appRoutePaths.dashboard,
      appRoutePaths.example,
    ]);
  });

  it("defines the starter route paths", () => {
    expect(appRoutePaths).toEqual({
      dashboard: "/",
      example: "/example",
      fallback: "*",
    });
  });

  it("builds the shell around TanStack Router child routes", () => {
    expect(routeTree.children).toEqual([
      dashboardRoute,
      exampleRoute,
    ]);
  });
});
