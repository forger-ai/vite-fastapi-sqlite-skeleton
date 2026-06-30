import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
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
    expect(forgerQueryKeys.resource("example", "items")).toEqual(["forger", "example", "items"]);
    const providedClient = ForgerQueryProvider({
      children: "ok",
      client,
    }) as ReactElement<{ client: unknown }>;
    const defaultClient = ForgerQueryProvider({
      children: "ok",
    }) as ReactElement<{ client: unknown }>;

    expect(providedClient.props.client).toBe(client);
    expect(defaultClient.props.client).toBeDefined();
  });
});
