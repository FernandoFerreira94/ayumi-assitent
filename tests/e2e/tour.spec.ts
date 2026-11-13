import { expect, test } from "./fixtures";

test.use({ tourDone: false });

test("primeiro acesso: tour obrigatório vai direto para Ajustes e aponta cada configuração", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const card = page.getByRole("dialog");
  await expect(card.getByRole("heading", { name: "Oi, eu sou o Bubbly!" })).toBeVisible();
  // Saudação já em Ajustes
  await expect(page).toHaveURL(/\/ajustes$/);
  // Obrigatório: sem "Pular" e o Escape não fecha
  await expect(card.getByRole("button", { name: "Pular tour" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Começar" }).click();

  for (const name of [
    "1. Conecte o WhatsApp",
    "2. Ligue seus calendários",
    "3. Ligue a Notificação",
    "4. Edite suas mensagens",
    "5. Seus horários",
  ]) {
    await expect(card.getByRole("heading", { name })).toBeVisible();
    // O cartão fica inteiro na tela, longe da borda de cima (não cola no header)
    await expect
      .poll(
        async () => {
          const b = await card.boundingBox();
          return b ? b.y >= 56 && b.y + b.height <= page.viewportSize()!.height : false;
        },
        { message: `cartão do passo "${name}" inteiro na tela` },
      )
      .toBe(true);
    await card.getByRole("button", { name: "Próximo" }).click();
  }
  // Passo de instalar é opcional (some quando o ícone não está na tela)
  const install = card.getByRole("heading", { name: "Instale o app no celular" });
  if (await install.isVisible()) await card.getByRole("button", { name: "Próximo" }).click();
  await expect(card.getByRole("heading", { name: "Agora é com você!" })).toBeVisible();
  await card.getByRole("button", { name: "Vamos configurar" }).click();
  await expect(card).toBeHidden();
  await expect(page).toHaveURL(/\/ajustes$/);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("rever o tour por Ajustes pode ser pulado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agenda");
  const card = page.getByRole("dialog");
  await card.getByRole("button", { name: "Começar" }).click();
  for (let i = 0; i < 6; i++) {
    const next = card.getByRole("button", { name: "Próximo" });
    if (await next.isVisible()) await next.click();
  }
  await card.getByRole("button", { name: "Vamos configurar" }).click();
  await expect(card).toBeHidden();

  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Rever o tour do app" }).click();
  await expect(page.getByRole("heading", { name: "Oi, eu sou o Bubbly!" })).toBeVisible();
  await page.getByRole("button", { name: "Pular tour" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});
