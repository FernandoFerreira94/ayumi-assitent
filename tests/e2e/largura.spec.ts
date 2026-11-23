// tests/e2e/largura.spec.ts
import { expect, test } from "./fixtures";

test("menu lateral no lugar da barra do rodapé", async ({ page }) => {
  await page.goto("/agenda");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav).toBeVisible();
  await expect(page.locator(".tabbar")).toBeHidden();
  await expect(nav.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Vagas" }).click();
  await expect(page).toHaveURL(/\/vagas$/);
  await expect(nav.getByRole("link", { name: "Vagas" })).toHaveAttribute("aria-current", "page");
});

test("a coluna não fica presa nos 520 px do celular", async ({ page }) => {
  await page.goto("/ajustes");
  // boundingBox não espera: sem isto, pegar o <main> no meio da troca do loading dá null
  const main = page.locator("main").first();
  await expect(main).toBeVisible();
  const box = await main.boundingBox();
  expect(box!.width).toBeGreaterThan(600);
});

test("N abre o novo agendamento como painel lateral, e Fechar fecha", async ({ page }) => {
  await page.goto("/agenda");
  const sheet = page.getByRole("dialog").last();
  // O atalho só existe depois da hidratação; repete a tecla até o ouvinte estar ligado
  await expect(async () => {
    await page.keyboard.press("n");
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();
  const vp = page.viewportSize()!;
  const box = (await sheet.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(vp.width - 2);
  expect(box.height).toBeGreaterThan(vp.height - 2);
  await sheet.getByRole("button", { name: "Fechar" }).click();
  await expect(sheet).toBeHidden();
});

test("alvos do menu têm pelo menos 44 px", async ({ page }) => {
  await page.goto("/agenda");
  const links = page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link");
  for (const link of await links.all()) {
    const b = (await link.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});

test("Painel de tela larga: números, próxima cliente, mini mês, pendências e Dia/Semana", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page.getByRole("region", { name: "Ganhos da semana" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Confirmações de hoje" })).toBeVisible();
  await expect(page.getByRole("region", { name: /Próxima cliente|Atendendo agora/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pendências" })).toContainText("Tudo em dia");

  // Mini mês: o próximo mês troca o título e o clique num dia abre a agenda dele, sem recarregar
  const mes = page.getByRole("region", { name: "Mês" });
  const titulo = mes.getByRole("heading");
  const antes = await titulo.textContent();
  await mes.getByRole("button", { name: "Próximo mês" }).click();
  await expect(titulo).not.toHaveText(antes!);
  await mes.getByRole("button", { name: /^15\b/ }).click();
  await expect(page).toHaveURL(/\/agenda\?d=\d{4}-\d{2}-15$/);
  await expect(page.getByRole("region", { name: "Primeira cliente do dia" })).toBeVisible();

  // Semana: troca a agenda pela visão da semana e lembra a escolha
  await page.getByRole("tab", { name: "Semana" }).click();
  await expect(page.getByRole("tab", { name: "Semana" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("link", { name: /^dom/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Semana" })).toHaveAttribute("aria-selected", "true");
});

test("Clientes no desktop: a ficha abre ao lado da lista e os filtros trocam a lista", async ({ page }) => {
  const vp = page.viewportSize()!;
  test.skip(vp.width < 1024, "ficha ao lado só a partir de 1024 px");
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nova cliente" }).click();
  await page.getByLabel("Nome").fill("Bia Souza");
  await page.getByLabel("WhatsApp").fill("11987651111");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente cadastrada")).toBeVisible();

  await expect(page.getByRole("region", { name: "Resumo das clientes" })).toBeVisible();
  await page
    .getByRole("button", { name: /Bia Souza/ })
    .first()
    .click();
  const ficha = page.getByRole("region", { name: "Ficha de Bia Souza" });
  await expect(ficha).toBeVisible();
  await expect(ficha.getByText("Nenhum marcado")).toBeVisible();
  // Não abriu folha por cima: a ficha está na própria tela
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("navigation", { name: "Filtrar clientes" }).getByRole("link", { name: "Novas" }).click();
  await expect(page).toHaveURL(/\?f=novas$/);
  await expect(page.getByRole("button", { name: /^Bia Souza/ })).toBeVisible();
  await page.getByRole("navigation", { name: "Filtrar clientes" }).getByRole("link", { name: "Sumidas" }).click();
  await expect(page.getByText('Nenhuma cliente em "Sumidas"')).toBeVisible();
});

test("Financeiro de tela larga: 6 meses, quem mais trouxe e faltas", async ({ page }) => {
  await page.goto("/financeiro");
  await expect(page.getByRole("heading", { name: "Últimos 6 meses" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Recebido e gastos dos últimos meses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quem mais trouxe no mês" })).toBeVisible();
  await expect(page.getByText("Nenhum atendimento concluído nesse mês.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Faltas no mês" })).toBeVisible();
});

test("Pendências e Vagas usam a largura toda no desktop", async ({ page }) => {
  const width = async () => (await page.locator("main").first().boundingBox())!.width;
  await page.goto("/pendencias");
  await expect(page.getByText("Tudo em dia")).toBeVisible();
  expect(await width()).toBeGreaterThan(900);

  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Gel");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("100");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  await page.goto("/vagas");
  await expect(page.getByRole("link", { name: "Gel" })).toBeVisible();
  expect(await width()).toBeGreaterThan(900);
});

test("Serviços no desktop vira tabela com o mês", async ({ page }) => {
  await page.goto("/servicos");
  await page.getByRole("button", { name: "Criar serviço" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nome", exact: true }).fill("Gel");
  await page.getByRole("dialog").getByRole("textbox", { name: /Preço/ }).fill("100");
  await page.getByRole("dialog").getByRole("button", { name: "Criar serviço" }).click();
  await expect(page.getByText("Serviço criado")).toBeVisible();
  await expect(page.getByText("receita do mês", { exact: true })).toBeVisible();
  await expect(page.getByText("Receita do mês", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem").filter({ hasText: "Gel" })).toContainText(
    "Feitos no mês: 0",
  );
});

test("Ajustes no desktop: seções à esquerda, a aberta à direita", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByRole("heading", { name: "Este aparelho", exact: true })).toBeVisible();
  // Conexões abrem em acordeão também no desktop
  await page.locator("#ajuste-whatsapp").click();
  await expect(page.locator("#ajuste-whatsapp")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: /Expediente/ }).click();
  await expect(page).toHaveURL(/\/ajustes\/expediente$/);
  const nav = page.getByRole("navigation", { name: "Seções de ajustes" });
  await expect(nav.getByRole("link", { name: /Expediente/ })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: /WhatsApp/ }).click();
  await expect(page).toHaveURL(/\/ajustes\/whatsapp$/);
  await expect(nav.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("aria-current", "page");
});

test("Planos no menu lateral: números lado a lado e as três abas", async ({ page }, info) => {
  await page.goto("/agenda");
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Planos" }).click();
  await expect(page).toHaveURL(/\/planos$/);
  await expect(page.getByRole("region", { name: "Resumo dos planos" })).toContainText("clientes com pacote");
  await expect(page.getByText("Nenhuma cliente com pacote em uso")).toBeVisible();
  await page.getByRole("tab", { name: "Promoções" }).click();
  await expect(page).toHaveURL(/aba=promocoes/);
  await expect(page.getByRole("region", { name: "Promoções de desconto" })).toBeVisible();
  if (process.env.PRINTS) await page.screenshot({ path: `${process.env.PRINTS}/planos-${info.project.name}.png` });
});
