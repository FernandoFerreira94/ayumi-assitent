import { expect, test } from "./fixtures";

// Ponta a ponta: cria o link no sheet, o feed responde, trocar e desligar matam o link antigo na hora.
test("calendário do iPhone: criar, trocar, ocultar nome e desligar o link", async ({ page, request }) => {
  await page.goto("/ajustes");
  await page.getByRole("button", { name: /Calendário do iPhone/ }).click();
  const sheet = page.getByRole("dialog", { name: "Calendário do iPhone" });
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

  await sheet.getByRole("switch", { name: "Ocultar nome da cliente" }).click();
  await expect(sheet.getByRole("switch", { name: "Ocultar nome da cliente" })).toBeChecked();

  // Gerar link novo: precisa recarregar (o link só aparece na hora em que é criado)
  await page.reload();
  await page.getByRole("button", { name: /Calendário do iPhone/ }).click();
  await expect(sheet.getByRole("switch", { name: "Ocultar nome da cliente" })).toBeChecked();
  await sheet.getByRole("button", { name: "Gerar link novo" }).click();
  const path2 = new URL((await add.getAttribute("href"))!.replace(/^webcal:/, "http:")).pathname;
  expect(path2).not.toBe(path1);
  expect((await request.get(path1)).status()).toBe(404);
  expect((await request.get(path2)).status()).toBe(200);

  await sheet.getByRole("button", { name: "Desligar link" }).click();
  await sheet.getByRole("button", { name: "Desligar", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Criar link do calendário" })).toBeVisible();
  expect((await request.get(path2)).status()).toBe(404);
});
