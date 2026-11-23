/**
 * Texto pronto para divulgar um pacote ou promoção (status do WhatsApp ou mensagem), montado só com os dados
 * que existem: nada de inventar endereço, preço ou prazo. Puro (sem banco), testado em `tests/unit/promo-text.test.ts`.
 */

import { dayMonth, serviceNames } from "./rules";

export type SalonInfo = { name: string; address: string | null; instagram: string | null };
export type ShareVariant = "status" | "message";

export type PromoFacts = {
  /** nome que a dona deu ("Natal", "Black Friday"); null = sem nome */
  title: string | null;
  /** frase do que é: "Pague 3 e leve 4 sessões de Esmaltação" ou "20% de desconto em Esmaltação" */
  offer: string;
  /** preço cheio e com desconto; sem desconto real, a linha "De… por…" não sai */
  fullCents: number;
  priceCents: number;
  /** "Válido de 01/12 a 31/12" (vazio = sem período) */
  when: string;
  /** limite de clientes e quantas vagas restam (null = sem limite / não mostrar) */
  maxClients: number | null;
  left: number | null;
  /** linha extra opcional, ex.: "O pacote vale 90 dias depois da compra." */
  extra: string | null;
  /** chamada final ("Garanta o seu", "Agende o seu horário") */
  cta: string;
};

/** "Válido de 01/12 a 31/12", "Válido a partir de 01/12", "Válido até 31/12" ou "". */
export function periodText(startsOn: string | null, endsOn: string | null): string {
  if (startsOn && endsOn) return `Válido de ${dayMonth(startsOn)} a ${dayMonth(endsOn)}`;
  if (startsOn) return `Válido a partir de ${dayMonth(startsOn)}`;
  if (endsOn) return `Válido até ${dayMonth(endsOn)}`;
  return "";
}

/** "Só para as 30 primeiras clientes! Restam 12 vagas." */
export function capText(maxClients: number | null, left: number | null): string {
  if (maxClients === null) return "";
  const head = maxClients === 1 ? "Só para a primeira cliente!" : `Só para as ${maxClients} primeiras clientes!`;
  if (left === null || left >= maxClients) return head;
  if (left <= 0) return "Vagas esgotadas.";
  return `${head} ${left === 1 ? "Resta 1 vaga." : `Restam ${left} vagas.`}`;
}

const brlPlain = (cents: number, brl: (c: number) => string) => brl(cents).replace(/ /g, " ");

/** Monta o texto. "status" é curto (sem saudação); "message" começa com "Oi!" e fecha com a chamada. */
export function promoText(f: PromoFacts, salon: SalonInfo, variant: ShareVariant, brl: (c: number) => string): string {
  const salonName = salon.name.trim();
  const head = `✨ ${[f.title?.trim() || "Promoção", salonName].filter(Boolean).join(" · ")} ✨`;
  const save = f.fullCents - f.priceCents;
  const price =
    save > 0 && f.priceCents >= 0
      ? `De ${brlPlain(f.fullCents, brl)} por ${brlPlain(f.priceCents, brl)} (economize ${brlPlain(save, brl)})`
      : f.priceCents > 0
        ? `Por ${brlPlain(f.priceCents, brl)}`
        : "";
  const when = f.when ? `${f.when}.` : "";
  const cap = capText(f.maxClients, f.left);
  const place = [
    salon.address?.trim() ? `📍 ${salon.address.trim()}` : "",
    salon.instagram?.trim() ? `📸 @${salon.instagram.trim().replace(/^@/, "")}` : "",
  ].filter(Boolean);
  const lines =
    variant === "status"
      ? [head, f.offer, price, [when, cap].filter(Boolean).join(" "), place[0] ?? "", `${f.cta} 💜`].filter(Boolean)
      : [
          "Oi! Tudo bem? 💜",
          "",
          head,
          "",
          `${f.offer}.`,
          price ? `${price}.` : "",
          when,
          cap,
          f.extra ?? "",
          "",
          ...place,
          place.length ? "" : null,
          `${f.cta}: é só me responder aqui.`,
        ];
  return lines
    .filter((l): l is string => l !== null)
    .filter((l, i, all) => l !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim();
}

/** Fatos de um pacote ("Pague X, leve Y" ou sessões). */
export function packageFacts(p: {
  name: string;
  /** nome é o automático (não vale como título) */
  autoName?: boolean;
  kind: "pay_x" | "sessions";
  sessionsPaid: number | null;
  sessionsTotal: number;
  serviceNames: readonly string[];
  priceCents: number;
  unitCents: number;
  validDays: number;
  startsOn: string | null;
  endsOn: string | null;
  maxClients: number | null;
  left: number | null;
}): PromoFacts {
  const what = serviceNames(p.serviceNames);
  const n = (k: number) => `${k} ${k === 1 ? "sessão" : "sessões"}`;
  return {
    title: p.autoName ? null : p.name,
    offer:
      p.kind === "pay_x"
        ? `Pague ${p.sessionsPaid} e leve ${n(p.sessionsTotal)} de ${what}`
        : `Pacote com ${n(p.sessionsTotal)} de ${what}`,
    fullCents: p.sessionsTotal * p.unitCents,
    priceCents: p.priceCents,
    when: periodText(p.startsOn, p.endsOn),
    maxClients: p.maxClients,
    left: p.left,
    extra: `O pacote vale ${p.validDays} dias depois da compra.`,
    cta: "Garanta o seu",
  };
}
