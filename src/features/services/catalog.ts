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

/** Busca e nome repetido ignoram acento e maiúscula. */
export const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const formatDuration = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

/** Nome já usado por outro serviço (sem diferenciar maiúsculas e acentos), fora o próprio serviço. */
export const nameTaken = (list: Pick<CatalogService, "id" | "name">[], name: string, exceptId?: string) =>
  list.some((s) => s.id !== exceptId && normalizeName(s.name) === normalizeName(name));

/** Filtra pela busca (sem diferenciar maiúsculas e acentos); a lista já vem na ordem salva. */
export const filterServices = <T extends Pick<CatalogService, "name">>(services: T[], query: string) => {
  const q = normalizeName(query);
  return q ? services.filter((s) => normalizeName(s.name).includes(q)) : services;
};

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
