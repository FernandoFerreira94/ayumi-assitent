import { describe, expect, it } from "vitest";
import { isPlatformAdmin } from "@/features/admin/access";

describe("isPlatformAdmin", () => {
  it("vazio = ninguém é admin", () => {
    expect(isPlatformAdmin("u1", "")).toBe(false);
    expect(isPlatformAdmin("u1", undefined)).toBe(false);
  });
  it("aceita só ids da lista, sem espaços", () => {
    expect(isPlatformAdmin("u1", " u1 , u2 ")).toBe(true);
    expect(isPlatformAdmin("u3", "u1,u2")).toBe(false);
  });
  it("id é comparado exato (maiúscula conta)", () => {
    expect(isPlatformAdmin("U1", "u1")).toBe(false);
  });
  it("sem usuário nunca é admin", () => {
    expect(isPlatformAdmin(null, "u1")).toBe(false);
    expect(isPlatformAdmin("", ",")).toBe(false);
  });
});
