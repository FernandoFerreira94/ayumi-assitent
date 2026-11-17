import { expect, test } from "./fixtures";

// Ponta a ponta: cria o link no sheet, o feed responde, trocar e desligar matam o link antigo na hora.
test("calendário do iPhone: criar, trocar, ocultar nome e desligar o link", async ({ page, request }) => {
  await page.goto("/ajustes/calendarios");
  await page.getByRole("button", { name: /Calendário do iPhone/ }).click();
  const sheet = page.getByRole("dialog", { name: "Calendário do iPhone" });
  // Sem nada ligado, abre em "Trazer do iPhone"; a ida fica na outra aba
  await expect(sheet.getByRole("tab", { name: "Trazer do iPhone" })).toHaveAttribute("aria-selected", "true");
  await sheet.getByRole("tab", { name: "Ver no iPhone" }).click();
  await sheet.getByRole("button", { name: "Criar link do calendário" }).click();

  const add = sheet.getByRole("link", { name: "Adicionar ao iPhone" });
  await expect(add).toHaveAttribute("href", /^webcal:\/\/.+\/api\/calendar\/[A-Za-z0-9_-]{43}\.ics$/);
  const first = (await add.getAttribute("href"))!.replace(/^webcal:/, "http:");
  const path1 = new URL(first).pathname;

  const ok = await request.get(path1);
  expect(ok.status()).toBe(200);
  expect(ok.headers()["content-type"]).toContain("text/calendar");
  expect(ok.headers()["cache-control"]).toContain("no-store");
  expect(await ok.text()).toContain("BEGIN:VCALENDAR");

  // O iPhone leu o link: o sheet percebe sozinho e o passo "Assinar" fica verde
  await expect(sheet.getByText("Assinado no iPhone")).toBeVisible({ timeout: 12_000 });
  await expect(sheet.getByRole("listitem").filter({ hasText: "Assinar" })).toContainText("Feito");

  await sheet.getByRole("switch", { name: "Ocultar nome da cliente" }).click();
  await expect(sheet.getByRole("switch", { name: "Ocultar nome da cliente" })).toBeChecked();

  // Gerar link novo: precisa recarregar (o link só aparece na hora em que é criado)
  await page.reload();
  await page.getByRole("button", { name: /Calendário do iPhone/ }).click();
  // Link já ligado: abre direto em "Ver no iPhone", com os passos feitos
  await expect(sheet.getByRole("tab", { name: /Ver no iPhone/ })).toHaveAttribute("aria-selected", "true");
  await expect(sheet.getByText("Assinado no iPhone")).toBeVisible();
  await expect(sheet.getByRole("switch", { name: "Ocultar nome da cliente" })).toBeChecked();
  await sheet.getByRole("button", { name: "Gerar link novo" }).click();
  const path2 = new URL((await add.getAttribute("href"))!.replace(/^webcal:/, "http:")).pathname;
  // Link novo ainda não lido: espera a assinatura de novo
  // (o webcal: não abre no navegador de teste: só o clique conta)
  await add.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
  await add.click();
  await expect(sheet.getByText("Esperando o iPhone assinar…")).toBeVisible();
  expect(path2).not.toBe(path1);
  expect((await request.get(path1)).status()).toBe(404);
  expect((await request.get(path2)).status()).toBe(200);

  await sheet.getByRole("button", { name: "Desligar link" }).click();
  await sheet.getByRole("button", { name: "Desligar", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Criar link do calendário" })).toBeVisible();
  expect((await request.get(path2)).status()).toBe(404);
});
