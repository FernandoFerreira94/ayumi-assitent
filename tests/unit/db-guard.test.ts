import { describe, expect, it } from "vitest";
import { assertTestDatabase } from "../db-guard";

describe("assertTestDatabase", () => {
  it("aceita banco local de teste", () => {
    expect(() => assertTestDatabase("postgres://postgres:postgres@localhost:5432/assist_test")).not.toThrow();
    expect(() => assertTestDatabase("postgres://u:p@127.0.0.1:54331/bubbly_test")).not.toThrow();
  });
  it("sem URL não faz nada (testes de banco são pulados)", () => {
    expect(() => assertTestDatabase(undefined)).not.toThrow();
  });
  it("recusa host remoto", () => {
    expect(() => assertTestDatabase("postgres://u:p@monorail.proxy.rlwy.net:5432/railway_test")).toThrow(/produção/);
  });
  it("recusa banco local sem _test", () => {
    expect(() => assertTestDatabase("postgres://u:p@localhost:5432/railway")).toThrow(/_test/);
  });
});
