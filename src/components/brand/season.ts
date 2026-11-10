import { easter } from "@/features/owner-notices/holidays";

/**
 * Datas comemorativas da Bolha: perto de cada uma ela ganha um acessório, sozinha.
 * Tudo pela data do estúdio (America/Sao_Paulo). Páscoa, Carnaval e Dia das Mães são calculados.
 */
export type Season =
  | "anonovo"
  | "carnaval"
  | "mulher"
  | "pascoa"
  | "maes"
  | "namorados"
  | "junina"
  | "criancas"
  | "halloween"
  | "natal";

/** Saudação curta que abre o balão do painel nos dias da data. */
export const SEASON_GREETING: Record<Season, string> = {
  anonovo: "Feliz ano novo!",
  carnaval: "Bom carnaval!",
  mulher: "Feliz Dia da Mulher!",
  pascoa: "Feliz Páscoa!",
  maes: "Feliz Dia das Mães!",
  namorados: "Feliz Dia dos Namorados!",
  junina: "Arraiá do salão!",
  criancas: "Feliz Dia das Crianças!",
  halloween: "Feliz Halloween!",
  natal: "Boas festas!",
};

const DAY = 864e5;
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);

function windows(y: number): [Season, number, number][] {
  const e = Date.parse(`${easter(y)}T00:00:00Z`);
  const may1 = new Date(utc(y, 5, 1)).getUTCDay();
  const mothers = utc(y, 5, 1 + ((7 - may1) % 7) + 7); // 2º domingo de maio
  return [
    ["anonovo", utc(y - 1, 12, 26), utc(y, 1, 1)],
    ["anonovo", utc(y, 12, 26), utc(y + 1, 1, 1)],
    ["carnaval", e - 51 * DAY, e - 46 * DAY], // sexta antes até Quarta de Cinzas
    ["mulher", utc(y, 3, 8), utc(y, 3, 8)],
    ["pascoa", e - 7 * DAY, e], // Domingo de Ramos até a Páscoa
    ["maes", mothers - 6 * DAY, mothers],
    ["namorados", utc(y, 6, 10), utc(y, 6, 12)],
    ["junina", utc(y, 6, 13), utc(y, 6, 29)],
    ["criancas", utc(y, 10, 10), utc(y, 10, 12)],
    ["halloween", utc(y, 10, 25), utc(y, 10, 31)],
    ["natal", utc(y, 12, 1), utc(y, 12, 25)],
  ];
}

/** Data comemorativa do dia (YYYY-MM-DD). Se duas caem juntas, vale a mais curta. */
export function seasonOn(date: string): Season | null {
  const [y, m, d] = date.split("-").map(Number);
  const t = utc(y, m, d);
  let best: Season | null = null;
  let len = Infinity;
  for (const [s, a, b] of windows(y)) {
    if (t >= a && t <= b && b - a < len) {
      best = s;
      len = b - a;
    }
  }
  return best;
}
