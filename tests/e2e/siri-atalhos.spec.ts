import { expect, test } from "./fixtures";

// Ponta a ponta: cria a chave no sheet, as rotas respondem só com ela, desligar corta na hora.
test("Siri e Atalhos: criar chave, consultar e desligar", async ({ page, request }) => {
  await page.goto("/ajustes/siri");
  await page.getByRole("button", { name: "Ligar a Siri" }).click();
  const sheet = page.getByRole("dialog", { name: "Ligar a Siri" });
  await sheet.getByLabel("Nome do aparelho").fill("iPhone teste");
  await sheet.getByRole("button", { name: "Criar chave" }).click();

  const token = (await sheet.locator("code").textContent())!.replace(/^Bearer\s+/, "").trim();
  expect(token).toMatch(/^bub_[A-Za-z0-9_-]{43}$/);
  await expect(sheet.getByRole("button", { name: "Copiar endereço de Agenda de hoje" })).toBeVisible();
  await expect(sheet.getByRole("region", { name: "Como montar o Atalho" })).toBeVisible();

  const auth = { authorization: `Bearer ${token}` };
  for (const path of ["/api/v1/atalhos/agenda?dia=hoje", "/api/v1/atalhos/proxima", "/api/v1/atalhos/resumo"]) {
    const res = await request.get(path, { headers: auth });
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect(res.headers()["content-type"]).toContain("text/plain");
    expect((await res.text()).length).toBeGreaterThan(10);
  }
  expect((await request.get("/api/v1/atalhos/agenda")).status()).toBe(401);

  await sheet.getByRole("button", { name: "Pronto" }).click();
  const item = page
    .getByRole("list", { name: "Chaves ligadas" })
    .getByRole("listitem")
    .filter({ hasText: "iPhone teste" });
  await expect(item).toContainText(token.slice(-4));
  await item.getByRole("button", { name: "Desligar" }).click();
  await item.getByRole("alertdialog").getByRole("button", { name: "Desligar" }).click();
  await expect(item).toHaveCount(0);
  expect((await request.get("/api/v1/atalhos/proxima", { headers: auth })).status()).toBe(401);
});
