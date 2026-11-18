import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchServerBuild, isBusy, takeJustUpdated } from "@/lib/update-check";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  sessionStorage.clear();
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

describe("takeJustUpdated", () => {
  it("true uma vez só depois de atualizar", () => {
    sessionStorage.setItem("bubbly:app-atualizado", "1");
    expect(takeJustUpdated()).toBe(true);
    expect(takeJustUpdated()).toBe(false);
  });
});

describe("isBusy", () => {
  it("livre sem nada aberto", () => {
    expect(isBusy()).toBe(false);
  });
  it("ocupado com sheet aberto", () => {
    document.body.innerHTML = '<div role="dialog"></div>';
    expect(isBusy()).toBe(true);
  });
  it("ocupado digitando", () => {
    document.body.innerHTML = "<input />";
    document.querySelector("input")!.focus();
    expect(isBusy()).toBe(true);
  });
});
