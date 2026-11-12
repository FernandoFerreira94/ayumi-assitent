/**
 * Textos dos avisos do dia no celular da profissional. Cada tipo tem um banco de frases e o worker sorteia uma
 * que não saiu nas últimas vezes (`pickVariant`). Nada de valores em dinheiro: só gente atendida e carinho.
 */
export type NoticeText = { title: string; body: string };

/** Índice do banco que não está entre os últimos usados; se todos já saíram, só evita repetir o último. */
export function pickVariant(size: number, recent: number[], rand: () => number = Math.random): number {
  const fresh = Array.from({ length: size }, (_, i) => i).filter((i) => !recent.includes(i));
  const pool = fresh.length ? fresh : Array.from({ length: size }, (_, i) => i).filter((i) => i !== recent[0]);
  return pool[Math.floor(rand() * pool.length)] ?? 0;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/* ----------------------------------------------------- resumo da manhã */

const MORNING_OPENERS = [
  "Seu dia está organizado.",
  "Vamos com tudo hoje!",
  "Que o dia seja leve.",
  "Olha só o seu dia.",
  "Mais um dia lindo pela frente.",
  "Café na mão e vamos lá.",
];

export const EMPTY_DAY = [
  "Hoje não tem ninguém marcado. Que tal divulgar uma vaga?",
  "Agenda livre hoje! Bom dia para postar seus trabalhos.",
  "Nada marcado por enquanto. Aproveite para respirar.",
  "Dia tranquilo: bom para organizar o espaço e se cuidar.",
  "Agenda livre. Dá tempo de planejar a semana com calma.",
];

export type DaySummary = {
  names: string[];
  firstTime: string;
  confirmed: number;
  pending: number;
  reschedule: number;
  cancel: number;
};

/** Emoji do horário de Brasília, pela saudação: sol de manhã, sol entre nuvens à tarde, lua à noite. */
export const skyEmoji = (greeting: string) =>
  greeting.startsWith("Bom dia") ? "☀️" : greeting.startsWith("Boa tarde") ? "🌤️" : "🌙";

export const morningBankSize = (empty: boolean) => (empty ? EMPTY_DAY.length : MORNING_OPENERS.length);

export function morningText(
  variant: number,
  greeting: string,
  s: DaySummary | null,
  sky: string = skyEmoji(greeting),
): NoticeText {
  const title = `${greeting}! ${sky}`;
  if (!s || s.names.length === 0) return { title, body: EMPTY_DAY[variant % EMPTY_DAY.length]! };
  const total = s.names.length;
  const status: string[] = [];
  if (s.confirmed) status.push(plural(s.confirmed, "confirmada", "confirmadas"));
  if (s.pending) status.push(plural(s.pending, "pendente", "pendentes"));
  const parts = [
    MORNING_OPENERS[variant % MORNING_OPENERS.length]!,
    `${total === 1 ? "1 cliente" : `${total} clientes`}, a primeira às ${s.firstTime}${status.length ? `: ${status.join(" e ")}` : ""}.`,
  ];
  if (s.reschedule) parts.push(`${plural(s.reschedule, "pedido", "pedidos")} para remarcar em aberto.`);
  if (s.cancel) parts.push(`${plural(s.cancel, "pedido", "pedidos")} para cancelar em aberto.`);
  return { title, body: parts.join(" ") };
}

/* ------------------------------------------------- fim do expediente */

/** Fecho curto depois do resumo (sorteado para não repetir). */
export const DAY_END = [
  "Bom descanso, você fez um ótimo trabalho.",
  "Agora é com você: descanse.",
  "Aproveite a noite e recarregue as energias.",
  "Obrigada por cada detalhe de hoje. Bom descanso!",
  "Missão cumprida. Hora de descansar.",
];

export const DAY_END_LATE = [
  "Já passou da hora, vai descansar que você merece.",
  "Dia puxado! Descanse bem.",
  "Orgulho de você. Agora é descanso.",
  "Desliga, toma um banho gostoso e cama.",
];

/** O que aconteceu hoje: atendidas, faltas, cancelamentos e pedidos para remarcar ainda em aberto. */
export type DayEndToday = { served: number; noShow: number; cancelled: number; reschedule: number };
/** Amanhã: folga, ou quantas clientes e o primeiro horário (0 = agenda livre). */
export type DayEndTomorrow = { off: true } | { off: false; count: number; firstTime: string | null };

export const dayEndBank = (late: boolean) => (late ? DAY_END_LATE : DAY_END);

export function dayEndText(variant: number, today: DayEndToday, tomorrow: DayEndTomorrow, late: boolean): NoticeText {
  const done = [
    today.served ? plural(today.served, "cliente atendida", "clientes atendidas") : "nenhuma cliente atendida",
  ];
  if (today.noShow) done.push(plural(today.noShow, "falta", "faltas"));
  if (today.cancelled) done.push(plural(today.cancelled, "cancelamento", "cancelamentos"));
  if (today.reschedule) done.push(plural(today.reschedule, "pedido para remarcar", "pedidos para remarcar"));
  const last = done.pop()!;
  const todayLine = `Hoje: ${done.length ? `${done.join(", ")} e ${last}` : last}.`;
  const tomorrowLine = tomorrow.off
    ? "Amanhã: folga."
    : tomorrow.count
      ? `Amanhã: ${plural(tomorrow.count, "cliente", "clientes")}, a primeira às ${tomorrow.firstTime}.`
      : "Amanhã: agenda livre por enquanto.";
  const bank = dayEndBank(late);
  return {
    title: late ? "Hoje trabalhamos muito 🌙" : "Fim do expediente ✨",
    body: `${todayLine}\n${tomorrowLine}\n${bank[variant % bank.length]!}`,
  };
}

/* --------------------------------------------- roteiro da semana (sem IA) */

export type WeekDay = { date: string; label: string; off: boolean; count: number; holiday: string | null };

export function weekFallback(days: WeekDay[]): string {
  const total = days.reduce((s, d) => s + d.count, 0);
  const lines = days.map((d) => {
    const what = d.off ? "folga" : d.count ? plural(d.count, "cliente", "clientes") : "agenda livre";
    return `${d.label}: ${what}${d.holiday ? ` · ${d.holiday}` : ""}`;
  });
  const opener =
    total === 0
      ? "Semana nova e agenda aberta. Bom momento para divulgar suas vagas."
      : `Semana nova chegando! ${plural(total, "cliente marcada", "clientes marcadas")} até agora.`;
  return [opener, "", ...lines, "", "Boa semana! Conte comigo para lembrar as clientes."].join("\n");
}

/* --------------------------------------------- datas comemorativas */

export const HOLIDAY_ASK = [
  "Quer mandar um carinho às suas clientes? Deixei uma mensagem pronta, é só tocar.",
  "Que tal desejar um dia especial às suas clientes? Toque para ver a mensagem que preparei.",
  "Boa chance para lembrar das suas clientes com carinho. Toque para ver uma sugestão de mensagem.",
];

const CLIENT_GREETINGS: Record<string, string> = {
  Natal:
    "Oi! 🎄 Passando para te desejar um Natal cheio de amor, paz e momentos lindos com quem você ama. Obrigada por fazer parte do nosso ano! Com carinho, {salao}.",
  "Ano Novo":
    "Oi! ✨ Que o novo ano chegue com saúde, alegria e muitos motivos para sorrir. Obrigada pela confiança de sempre! Com carinho, {salao}.",
  "Dia das Mães":
    "Oi! 💐 Feliz Dia das Mães para você e para todas as mães da sua vida. Que hoje seja de muito carinho e descanso. Com carinho, {salao}.",
  "Dia Internacional da Mulher":
    "Oi! 💜 Feliz Dia da Mulher! Que você siga se sentindo forte, linda e cuidada todos os dias. Com carinho, {salao}.",
  "Dia dos Namorados":
    "Oi! 💕 Feliz Dia dos Namorados! Que hoje tenha muito amor, inclusive o amor-próprio. Com carinho, {salao}.",
  "Dia dos Pais":
    "Oi! 💙 Feliz Dia dos Pais para os pais da sua família. Que seja um dia de abraços e boas memórias. Com carinho, {salao}.",
  Páscoa: "Oi! 🐣 Feliz Páscoa! Que seja um tempo de renovação, doçura e muita paz. Com carinho, {salao}.",
  "Dia do Cliente":
    "Oi! 💜 Hoje é Dia do Cliente e eu não podia deixar de agradecer: obrigada por confiar no meu trabalho. Com carinho, {salao}.",
};

/** Mensagem pronta para as clientes quando a IA não responder. */
export function clientGreetingFallback(holiday: string, salon: string): string {
  const key = Object.keys(CLIENT_GREETINGS).find((k) => holiday.includes(k));
  const base = key
    ? CLIENT_GREETINGS[key]!
    : `Oi! 💜 Passando para te desejar um feliz ${holiday}, cheio de alegria. Obrigada por fazer parte da nossa história! Com carinho, {salao}.`;
  return fill(base, { salao: salon || "sua profissional" });
}
