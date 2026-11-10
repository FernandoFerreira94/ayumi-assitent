/**
 * Feriados e datas comemorativas do Brasil: uma lista só, em código, usada por todos os salões. Os nacionais
 * e as datas móveis saem do cálculo da Páscoa; os estaduais vêm pela UF e os municipais pela cidade do salão
 * (por enquanto as capitais e cidades grandes; para incluir outra, é só somar uma linha em CITY).
 */
export type Holiday = {
  date: string;
  name: string;
  scope: "nacional" | "estadual" | "municipal" | "comemorativa";
  /** Feriado de fato (o comércio costuma fechar ou mudar o horário) */
  holiday: boolean;
  /** Data boa para mandar um carinho às clientes */
  greet: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function easter(y: number): string {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, month, day);
}

function shift(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** N-ésimo domingo do mês (Dia das Mães = 2º de maio, Dia dos Pais = 2º de agosto). */
function nthSunday(y: number, month: number, n: number): string {
  const first = new Date(Date.UTC(y, month - 1, 1)).getUTCDay();
  return iso(y, month, 1 + ((7 - first) % 7) + (n - 1) * 7);
}

type Fixed = [month: number, day: number, name: string];

const STATE: Record<string, Fixed[]> = {
  AC: [[6, 15, "Aniversário do Acre"]],
  AL: [[9, 16, "Emancipação de Alagoas"]],
  AM: [[9, 5, "Elevação do Amazonas a província"]],
  AP: [[3, 19, "Dia de São José"]],
  BA: [[7, 2, "Independência da Bahia"]],
  CE: [[3, 25, "Data Magna do Ceará"]],
  DF: [[11, 30, "Dia do Evangélico"]],
  MA: [[7, 28, "Adesão do Maranhão à Independência"]],
  MS: [[10, 11, "Criação de Mato Grosso do Sul"]],
  PA: [[8, 15, "Adesão do Pará à Independência"]],
  PB: [[8, 5, "Fundação da Paraíba"]],
  PE: [[3, 6, "Revolução Pernambucana"]],
  PI: [[10, 19, "Dia do Piauí"]],
  PR: [[12, 19, "Emancipação do Paraná"]],
  RJ: [[4, 23, "Dia de São Jorge"]],
  RN: [[10, 3, "Mártires de Cunhaú e Uruaçu"]],
  RO: [[1, 4, "Criação de Rondônia"]],
  RR: [[10, 5, "Criação de Roraima"]],
  RS: [[9, 20, "Revolução Farroupilha"]],
  SE: [[7, 8, "Emancipação de Sergipe"]],
  SP: [[7, 9, "Revolução Constitucionalista"]],
  TO: [[10, 5, "Criação do Tocantins"]],
};

/** Cidade sem acento e em minúsculas + UF. */
const CITY: Record<string, Fixed[]> = {
  "sao paulo/SP": [[1, 25, "Aniversário de São Paulo"]],
  "rio de janeiro/RJ": [[1, 20, "Dia de São Sebastião"]],
  "belo horizonte/MG": [[12, 8, "Dia de Nossa Senhora da Conceição"]],
  "curitiba/PR": [[9, 8, "Dia de Nossa Senhora da Luz"]],
  "porto alegre/RS": [[2, 2, "Dia de Nossa Senhora dos Navegantes"]],
  "recife/PE": [[7, 16, "Dia de Nossa Senhora do Carmo"]],
  "fortaleza/CE": [[8, 15, "Dia de Nossa Senhora da Assunção"]],
  "salvador/BA": [[12, 8, "Dia de Nossa Senhora da Conceição da Praia"]],
  "goiania/GO": [[10, 24, "Aniversário de Goiânia"]],
  "manaus/AM": [[10, 24, "Aniversário de Manaus"]],
  "florianopolis/SC": [[3, 23, "Aniversário de Florianópolis"]],
  "campinas/SP": [[7, 14, "Aniversário de Campinas"]],
  "santos/SP": [[1, 26, "Aniversário de Santos"]],
  "guarulhos/SP": [[12, 8, "Dia de Nossa Senhora da Conceição"]],
};

export const cityKey = (city: string, uf: string) =>
  `${city.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase()}/${uf.trim().toUpperCase()}`;

/** Tudo o que cai no ano, já com os locais do salão. Datas repetidas viram uma só (nomes juntos). */
export function holidaysOf(year: number, uf?: string | null, city?: string | null): Holiday[] {
  const e = easter(year);
  const n = (date: string, name: string, holiday = true, greet = false): Holiday => ({
    date,
    name,
    scope: "nacional",
    holiday,
    greet,
  });
  const c = (date: string, name: string, greet = true): Holiday => ({
    date,
    name,
    scope: "comemorativa",
    holiday: false,
    greet,
  });
  const list: Holiday[] = [
    n(iso(year, 1, 1), "Ano Novo", true, true),
    n(shift(e, -48), "Carnaval", false),
    n(shift(e, -47), "Carnaval", false),
    c(iso(year, 3, 8), "Dia Internacional da Mulher"),
    n(shift(e, -2), "Sexta-feira Santa"),
    c(e, "Páscoa"),
    n(iso(year, 4, 21), "Tiradentes"),
    n(iso(year, 5, 1), "Dia do Trabalho"),
    c(nthSunday(year, 5, 2), "Dia das Mães"),
    c(iso(year, 6, 12), "Dia dos Namorados"),
    n(shift(e, 60), "Corpus Christi", false),
    c(nthSunday(year, 8, 2), "Dia dos Pais"),
    n(iso(year, 9, 7), "Independência do Brasil"),
    c(iso(year, 9, 15), "Dia do Cliente"),
    n(iso(year, 10, 12), "Dia das Crianças e de Nossa Senhora Aparecida", true, true),
    c(iso(year, 10, 31), "Halloween", false),
    n(iso(year, 11, 2), "Finados"),
    n(iso(year, 11, 15), "Proclamação da República"),
    n(iso(year, 11, 20), "Dia da Consciência Negra"),
    n(iso(year, 12, 25), "Natal", true, true),
    c(iso(year, 12, 31), "Véspera de Ano Novo", false),
  ];
  const u = uf?.trim().toUpperCase();
  if (u)
    for (const [m, d, name] of STATE[u] ?? [])
      list.push({ date: iso(year, m, d), name, scope: "estadual", holiday: true, greet: false });
  if (u && city?.trim())
    for (const [m, d, name] of CITY[cityKey(city, u)] ?? [])
      list.push({ date: iso(year, m, d), name, scope: "municipal", holiday: true, greet: false });

  // Junta as datas que coincidem (ex.: Carnaval cai em dois dias, mas cada dia é uma linha)
  const byDate = new Map<string, Holiday>();
  for (const h of list) {
    const prev = byDate.get(h.date);
    byDate.set(
      h.date,
      prev
        ? {
            ...prev,
            name: prev.name === h.name ? prev.name : `${prev.name} e ${h.name}`,
            holiday: prev.holiday || h.holiday,
            greet: prev.greet || h.greet,
          }
        : h,
    );
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Datas de `from` a `to` (inclusive, YYYY-MM-DD). */
export function holidaysBetween(from: string, to: string, uf?: string | null, city?: string | null): Holiday[] {
  const years = new Set([Number(from.slice(0, 4)), Number(to.slice(0, 4))]);
  return [...years]
    .flatMap((y) => holidaysOf(y, uf, city))
    .filter((h) => h.date >= from && h.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const holidayOn = (date: string, uf?: string | null, city?: string | null) =>
  holidaysBetween(date, date, uf, city)[0] ?? null;
