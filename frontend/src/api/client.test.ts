import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, del, get, patch, post, put } from "./client";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

describe("skeleton API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests and parses JSON responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(post<{ ok: boolean }>("/api/items", { name: "demo" })).resolves.toEqual({
      ok: true,
    });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "demo" }));
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("keeps FormData browser-native and returns 204 as undefined", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ uploaded: true }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const body = new FormData();

    await post("/api/uploads", body);
    await expect(del<void>("/api/items/1")).resolves.toBeUndefined();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.body).toBe(body);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("normalizes API and network errors", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ detail: "Missing" }, { status: 404 }))
      .mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }))
      .mockResolvedValueOnce(jsonResponse({ saved: true }))
      .mockRejectedValueOnce(new Error("offline"));

    await expect(get("/api/missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Missing",
    });
    await expect(patch("/api/items/1", { name: "updated" })).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      message: "HTTP 502",
      body: "Bad gateway",
    });
    await expect(put("/api/items/1", { name: "saved" })).resolves.toEqual({ saved: true });

    const error = await get("/api/health").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
  });
});
