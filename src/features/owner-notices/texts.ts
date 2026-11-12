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

/* ------------------------------------------------- bom dia das 7h */

export const GOOD_MORNING = [
  "Que hoje seja um dia leve, cheio de clientes felizes e de coisas boas para você.",
  "Cada cliente que senta na sua cadeira leva um pouco do seu carinho. Faça de hoje um dia especial.",
  "Comece o dia com calma, respire fundo e confie: você é muito boa no que faz.",
  "O seu talento transforma o dia de muita gente. Vá com tudo hoje!",
  "Um passo de cada vez, um atendimento de cada vez. Você está construindo algo lindo.",
  "Hoje é uma nova chance de fazer um trabalho do jeitinho que você sonha. Aproveite!",
  "Seja gentil com você hoje: o seu esforço já vale muito.",
  "Capriche no sorriso, ele é o melhor acabamento de qualquer atendimento.",
  "Quem faz com amor faz diferente. Que o seu dia seja cheio disso!",
  "Respira, toma um café e lembra: você chegou até aqui por mérito seu.",
  "Pequenos cuidados, grandes resultados. Tenha um dia incrível!",
  "O dia começou, e com ele novas oportunidades. Vai com fé e com coragem.",
  "Você faz as pessoas se sentirem bonitas. Isso é um dom, e hoje é dia de usar.",
  "Que não falte energia, nem paciência, nem café quentinho hoje.",
  "Todo grande negócio começou com um dia comum de trabalho bem feito. Bora!",
  "Não precisa ser perfeito, precisa ser feito com carinho. E você faz.",
  "Hoje é dia de brilhar, e você já tem tudo para isso.",
  "Confie no seu processo: cada dia de dedicação fica registrado nos resultados.",
  "Que as suas mãos criem coisas lindas hoje e o seu coração fique em paz.",
  "A sua agenda é feita de gente que confia em você. Que orgulho disso!",
  "Acorda o ânimo! O dia está esperando o seu melhor, e você sempre entrega.",
  "Que hoje a correria seja pequena e as boas notícias, grandes.",
  "Seu trabalho tem valor, seu tempo tem valor, você tem valor. Ótimo dia!",
  "Comece devagar, termine orgulhosa. Esse é o plano de hoje.",
  "Um dia bom é feito de atitudes simples. Comece com um sorriso no espelho.",
  "Sonhos grandes se constroem com dias como o de hoje. Segue firme!",
  "Que a gratidão abra o seu dia e a alegria feche. Você merece.",
  "Hoje o universo conspira a seu favor. Aproveite cada momento.",
  "Persistência é o seu superpoder. Mais um dia para mostrar isso!",
  "Aproveite o dia: ele é seu, do jeitinho que você fizer dele.",
];

export function goodMorningText(variant: number, hello: string): NoticeText {
  return { title: `${hello}! ☀️`, body: GOOD_MORNING[variant % GOOD_MORNING.length]! };
}

/* ----------------------------------------------------------------- folga */

export const DAY_OFF = [
  "Hoje é dia de folga. Desligue o modo agenda e aproveite o seu dia do jeitinho que você gosta.",
  "Folga merecida! Cuide de você hoje: descanse, coma algo gostoso e recarregue as energias.",
  "Hoje a agenda descansa e você também. Aproveite cada minuto do seu dia.",
  "Dia livre para você. Que tal fazer algo que te deixa feliz e que a correria não deixa?",
  "Folga é parte do trabalho bem feito. Descanse sem culpa, amanhã a gente continua.",
  "Bom descanso! Hoje o compromisso mais importante é com você.",
  "Hoje não tem cliente, tem você. Aproveite para respirar fundo e se cuidar.",
  "Dia de folga chegou. Que seja leve, tranquilo e cheio de coisas boas.",
];

export const DAY_OFF_SUN = [
  "Hoje é folga e o sol apareceu! Que tal uma caminhada ao ar livre ou um passeio para recarregar?",
  "Folga com sol é presente. Aproveite para se mexer: uma corrida, uma bike ou um passeio no parque.",
  "O dia está lindo lá fora. Bora aproveitar a folga com um pouco de sol, água e movimento?",
  "Sol e folga no mesmo dia! Chame alguém especial e saia para curtir um pouco.",
  "Dia de folga ensolarado: ótimo para uma atividade física leve e um sorvete depois, você merece.",
  "Hoje o sol veio te visitar na folga. Que tal um momento de lazer ao ar livre?",
];

export function dayOffText(
  variant: number,
  o: { greeting: string; sunny: boolean; holiday?: string | null; sky?: string },
): NoticeText {
  const bank = o.sunny ? DAY_OFF_SUN : DAY_OFF;
  const body = bank[variant % bank.length]!;
  return {
    title: `${o.greeting}! ${o.sky ?? skyEmoji(o.greeting)}`,
    body: o.holiday ? `Hoje é ${o.holiday}. ${body}` : body,
  };
}
export const dayOffBankSize = (sunny: boolean) => (sunny ? DAY_OFF_SUN : DAY_OFF).length;

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

export const DAY_END = [
  "Fim do expediente! {atendidas} hoje. Hora de descansar, você fez um ótimo trabalho.",
  "Expediente encerrado. {atendidas} com todo o seu carinho. Agora é com você: descanse.",
  "Mais um dia lindo de trabalho: {atendidas}. Desacelera e aproveita a noite.",
  "Missão cumprida! {atendidas} saíram felizes hoje. Hora de recarregar.",
  "Que dia! {atendidas}. Obrigada por cada detalhe, agora é hora de descansar.",
];

export const DAY_END_LATE = [
  "Hoje trabalhamos muito: {atendidas}. Já passou da hora, vai descansar que você merece.",
  "Que dia puxado! {atendidas} até agora. Hora de dormir e recuperar as energias.",
  "Expediente longo hoje, e com muito carinho: {atendidas}. Descanse bem, amanhã tem mais.",
  "Você deu tudo hoje: {atendidas}. Desliga, toma um banho gostoso e cama.",
  "Hoje foi intenso! {atendidas}. Orgulho de você, agora é descanso.",
];

export const DAY_END_EMPTY = [
  "Fim do expediente. Hora de descansar e fechar o dia com calma.",
  "Expediente encerrado por hoje. Aproveite a noite e descanse.",
  "Pronto, dia encerrado. Hora de cuidar de você.",
];

export function dayEndBank(served: number, late: boolean): string[] {
  if (served === 0) return DAY_END_EMPTY;
  return late ? DAY_END_LATE : DAY_END;
}

export function dayEndText(variant: number, served: number, late: boolean): NoticeText {
  const bank = dayEndBank(served, late);
  return {
    title: late ? "Hoje trabalhamos muito 🌙" : "Fim do expediente ✨",
    body: fill(bank[variant % bank.length]!, { atendidas: plural(served, "cliente atendida", "clientes atendidas") }),
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
