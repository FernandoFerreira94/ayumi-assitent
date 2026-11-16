// tests/unit/client-neighbor.test.ts
import { describe, expect, it } from "vitest";
import { neighborId } from "@/features/clients/neighbor";

const ids = ["a", "b", "c"];

describe("neighborId", () => {
  it("anda para a próxima e a anterior", () => {
    expect(neighborId(ids, "b", 1)).toBe("c");
    expect(neighborId(ids, "b", -1)).toBe("a");
  });

  it("para nas pontas em vez de dar a volta", () => {
    expect(neighborId(ids, "c", 1)).toBe("c");
    expect(neighborId(ids, "a", -1)).toBe("a");
  });

  it("sem cliente aberta (ou fora da lista filtrada) começa pela ponta do sentido", () => {
    expect(neighborId(ids, null, 1)).toBe("a");
    expect(neighborId(ids, "z", -1)).toBe("c");
  });

  it("lista vazia não devolve nada", () => {
    expect(neighborId([], null, 1)).toBeNull();
  });
});
