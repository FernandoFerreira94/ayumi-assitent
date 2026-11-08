import { describe, expect, it } from "vitest";
import { groupByLetter } from "@/lib/groupByLetter";

const items = (...labels: string[]) => labels.map((label, i) => ({ id: String(i), label }));

describe("groupByLetter", () => {
  it("agrupa por inicial em ordem alfabética, como os contatos do iPhone", () => {
    const groups = groupByLetter(items("Bruna", "ana", "Beatriz", "Carla"));
    expect(groups.map((g) => g.letter)).toEqual(["A", "B", "C"]);
    expect(groups[1].items.map((i) => i.label)).toEqual(["Beatriz", "Bruna"]);
  });
  it("ignora acento na inicial: Érica fica no E", () => {
    expect(groupByLetter(items("Érica", "Eva")).map((g) => g.letter)).toEqual(["E"]);
  });
  it("número e símbolo vão para # no fim", () => {
    expect(groupByLetter(items("123 Studio", "Zélia")).map((g) => g.letter)).toEqual(["Z", "#"]);
  });
  it("lista vazia não cria grupo", () => expect(groupByLetter([])).toEqual([]));
});
