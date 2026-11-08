import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchServerBuild, isBusyEditing } from "@/lib/update-check";

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("isBusyEditing", () => {
  it("livre sem nada em edição", () => expect(isBusyEditing(document, false)).toBe(false));
  it("ocupado com campo de texto em foco", () => {
    document.body.innerHTML = '<input id="a" type="text" />';
    (document.getElementById("a") as HTMLInputElement).focus();
    expect(isBusyEditing(document, false)).toBe(true);
  });
  it("ocupado com diálogo aberto", () => {
    document.body.innerHTML = '<div role="dialog"></div>';
    expect(isBusyEditing(document, false)).toBe(true);
  });
  it("ocupado com texto já digitado", () => expect(isBusyEditing(document, true)).toBe(true));
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
