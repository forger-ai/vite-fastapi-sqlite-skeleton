import { describe, expect, it } from "vitest";
import { ForgerQueryProvider, createForgerQueryClient, forgerQueryKeys } from "./query";

describe("skeleton query helpers", () => {
  it("uses conservative TanStack Query defaults and stable keys", () => {
    const client = createForgerQueryClient();

    expect(client.getDefaultOptions().queries).toMatchObject({
      retry: 1,
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    });
    expect(client.getDefaultOptions().mutations).toMatchObject({ retry: 0 });
    expect(forgerQueryKeys.resource("status", "health")).toEqual(["forger", "status", "health"]);
    expect(ForgerQueryProvider({ children: "ok", client }).props.client).toBe(client);
    expect(ForgerQueryProvider({ children: "ok" }).props.client).toBeDefined();
  });
});
