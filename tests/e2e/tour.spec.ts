import { expect, test } from "./fixtures";

test.use({ tourDone: false });

test("primeiro acesso: tour obrigatório passa pelo Painel e pela configuração em Ajustes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const card = page.getByRole("dialog");
  await expect(card.getByRole("heading", { name: "Oi, eu sou o Mimo!" })).toBeVisible();
  // Obrigatório: sem "Pular" e o Escape não fecha
  await expect(card.getByRole("button", { name: "Pular tour" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Começar" }).click();

  // Passo de toque: sem botão, só o destaque avança
  await expect(card.getByText("Toque no destaque")).toBeVisible();
  await page.locator("[data-tour='bubble']").click();
  await expect(card.getByRole("heading", { name: "Agendar e bloquear" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();
  await expect(card.getByRole("heading", { name: "O menu fica embaixo" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();
  await expect(card.getByRole("heading", { name: "Notificações" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();
  await expect(card.getByRole("heading", { name: "Instale o app no celular" })).toBeVisible();
  await card.getByRole("button", { name: "Próximo" }).click();

  // Configuração: o tour leva a Ajustes e mostra cada cartão
  await expect(page).toHaveURL(/\/ajustes$/);
  for (const name of [
    "1. Conecte o WhatsApp",
    "2. Conecte o Google Agenda",
    "3. Monte suas mensagens",
    "4. Leitura das respostas",
    "5. Seus horários",
  ]) {
    await expect(card.getByRole("heading", { name })).toBeVisible();
    // O cartão fica inteiro na tela, longe da borda de cima (não cola no header)
    await expect
      .poll(async () => {
        const b = await card.boundingBox();
        return b ? b.y >= 56 && b.y + b.height <= page.viewportSize()!.height : false;
      })
      .toBe(true);
    await card.getByRole("button", { name: "Próximo" }).click();
  }
  await expect(card.getByRole("heading", { name: "Tudo pronto!" })).toBeVisible();
  await card.getByRole("button", { name: "Ir para o Painel" }).click();
  await expect(card).toBeHidden();
  await expect(page).toHaveURL(/\/agenda$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("rever o tour por Ajustes começa no Painel e pode ser pulado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const card = page.getByRole("dialog");
  // Termina o obrigatório rápido: os passos de toque viram "Próximo" quando o destaque não está na tela
  await card.getByRole("button", { name: "Começar" }).click();
  await page.locator("[data-tour='bubble']").click();
  for (let i = 0; i < 9; i++) await card.getByRole("button", { name: "Próximo" }).click();
  await card.getByRole("button", { name: "Ir para o Painel" }).click();
  await expect(card).toBeHidden();
  await expect(page).toHaveURL(/\/agenda$/);

  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Rever o tour do app" }).click();
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole("heading", { name: "Oi, eu sou o Mimo!" })).toBeVisible();
  await page.getByRole("button", { name: "Pular tour" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});
