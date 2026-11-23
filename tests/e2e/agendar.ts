import { expect, type Page } from "@playwright/test";

/**
 * Preenche o agendar em passos (Para quem? → Qual serviço? → Quando? → Tudo certo?) a partir da folha já aberta.
 * Sem `hora`, o horário já veio escolhido (passo Quando pulado). A hora vai pelo "Outro horário" (seletor livre),
 * que aceita qualquer horário, dentro ou fora das vagas. Para no resumo, sem tocar em Agendar.
 */
export async function preencheAgendar(
  page: Page,
  o: { cliente?: RegExp; servicos?: RegExp[]; hora?: string; /** para no passo Quando? */ ateQuando?: boolean },
) {
  const sheet = page.getByRole("dialog", { name: "Novo agendamento" });
  if (o.cliente) {
    await expect(sheet.getByRole("heading", { name: "Para quem?" })).toBeVisible();
    await sheet.getByRole("button", { name: o.cliente }).last().click();
  }
  if (o.servicos?.length) {
    await expect(sheet.getByRole("heading", { name: "Qual serviço?" })).toBeVisible();
    for (const s of o.servicos) await sheet.getByRole("button", { name: s }).click();
    // Com um serviço só cadastrado, escolher já avança
    if (await sheet.getByRole("heading", { name: "Qual serviço?" }).isVisible())
      await sheet.getByRole("button", { name: "Continuar" }).click();
  }
  if (o.ateQuando) {
    await expect(sheet.getByRole("heading", { name: "Quando?" })).toBeVisible();
    return sheet;
  }
  if (o.hora) {
    // O botão Agendar da agenda sugere um horário, mas sempre pergunta "Quando?"
    await expect(sheet.getByRole("heading", { name: "Quando?" })).toBeVisible();
    await sheet.getByRole("button", { name: /Outro horário/ }).click();
    await sheet.getByLabel("Horário").selectOption(o.hora);
    await sheet.getByRole("button", { name: "Continuar" }).click();
  }
  await expect(sheet.getByRole("heading", { name: "Tudo certo?" })).toBeVisible();
  return sheet;
}
