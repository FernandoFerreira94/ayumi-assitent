import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchServerBuild } from "@/lib/update-check";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchServerBuild", () => {
  it("lê a versão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ build: "abc" }) }));
    expect(await fetchServerBuild()).toBe("abc");
  });
  it("null se falhar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchServerBuild()).toBeNull();
  });
});
