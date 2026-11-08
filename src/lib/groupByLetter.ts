export type Group<T> = { letter: string; items: T[] };

const initial = (label: string) => {
  const c = label.trim().normalize("NFD").charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : "#";
};

/** Seções A, B, C… com a inicial sem acento; o que não começa por letra vai para # no fim. */
export function groupByLetter<T extends { label: string }>(items: T[]): Group<T>[] {
  const sorted = [...items].sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
  const groups = new Map<string, T[]>();
  for (const item of sorted) {
    const letter = initial(item.label);
    groups.set(letter, [...(groups.get(letter) ?? []), item]);
  }
  return [...groups]
    .map(([letter, list]) => ({ letter, items: list }))
    .sort((a, b) => (a.letter === "#" ? 1 : b.letter === "#" ? -1 : a.letter.localeCompare(b.letter)));
}
