/**
 * Lançamento grátis: uma verdade só para o texto do aviso e para a regra de fundadora.
 *
 * Ainda não há data de cobrança (decisão do Fernando, 26/11/2026). Quando houver, ela entra em
 * `BILLING_STARTS_AT` (ISO, horário de Brasília), o aviso passa a mostrar a data e quem já tinha
 * estúdio antes dela fica como fundadora.
 */
export const BILLING_STARTS_AT: string | null = null;

export const LAUNCH_NOTICE = {
  title: "Grátis durante o lançamento",
  text: "Nenhuma cobrança está marcada. Antes de qualquer cobrança, avisamos aqui no app, e quem já usa o Bubbly ganha preço de fundadora travado por 12 meses.",
} as const;

/**
 * Fundadora = estúdio criado antes do início da cobrança. Sem data marcada, todo estúdio é fundador.
 * Não grava nada no banco: a data de criação do estúdio já basta, e o preço entra junto com a cobrança.
 */
export function isFounder(tenantCreatedAt: Date, billingStartsAt: string | null = BILLING_STARTS_AT): boolean {
  if (!billingStartsAt) return true;
  return tenantCreatedAt.getTime() < new Date(billingStartsAt).getTime();
}
