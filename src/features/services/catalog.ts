/** Regras puras do catálogo de serviços, usadas pela tela e pelas ações. */

/** Cores do bloco no calendário. Os valores moram em globals.css (`--svc-<cor>`, `-soft`, `-ink`). */
export const SERVICE_COLORS = {
  lav: "Lavanda",
  rosa: "Rosa",
  mel: "Mel",
  verde: "Verde",
  lilas: "Lilás",
  azul: "Azul",
} as const;
export type ServiceColor = keyof typeof SERVICE_COLORS;

/** Intervalo depois do serviço, para limpar e preparar. */
export const BUFFER_OPTIONS = [0, 10, 15, 30] as const;

export type CatalogService = {
  id: string;
  name: string;
  categoryId: string | null;
  durationMin: number;
  priceCents: number;
  priceFrom: boolean;
  bufferMin: number;
  color: string;
  notes: string | null;
  bookable: boolean;
  showInSlots: boolean;
  /** atendimentos marcados daqui para frente (avisados ao excluir) */
  upcoming: number;
};
export type Category = { id: string; name: string };

/** Busca e nome repetido ignoram acento e maiúscula. */
export const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const formatDuration = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

/** Nome já usado na mesma categoria, fora o próprio serviço. */
export const nameTaken = (
  list: Pick<CatalogService, "id" | "name" | "categoryId">[],
  name: string,
  categoryId: string | null,
  exceptId?: string,
) =>
  list.some((s) => s.id !== exceptId && s.categoryId === categoryId && normalizeName(s.name) === normalizeName(name));

export const NO_CATEGORY = "sem-categoria";

/**
 * Agrupa na ordem das categorias (a lista já vem na ordem salva), filtrando por categoria e busca.
 * Serviços sem categoria ficam num grupo no fim; grupos vazios somem.
 */
export function groupServices(services: CatalogService[], categories: Category[], filter: string, query: string) {
  const q = normalizeName(query);
  const visible = services.filter(
    (s) => (filter === "all" || (s.categoryId ?? NO_CATEGORY) === filter) && (!q || normalizeName(s.name).includes(q)),
  );
  const groups = [...categories, { id: NO_CATEGORY, name: "Sem categoria" }].map((c) => ({
    category: c,
    services: visible.filter((s) => (s.categoryId ?? NO_CATEGORY) === c.id),
  }));
  return groups.filter((g) => g.services.length > 0);
}

/** Move `id` para a posição de `overId` dentro da lista inteira (a ordem é a mesma do novo agendamento). */
export function moveService<T extends { id: string }>(list: T[], id: string, overId: string): T[] {
  const from = list.findIndex((s) => s.id === id);
  const to = list.findIndex((s) => s.id === overId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Média dos ativos (não pausados), em centavos. */
export const averagePrice = (services: Pick<CatalogService, "priceCents" | "bookable">[]) => {
  const on = services.filter((s) => s.bookable);
  return on.length ? Math.round(on.reduce((sum, s) => sum + s.priceCents, 0) / on.length) : 0;
};
