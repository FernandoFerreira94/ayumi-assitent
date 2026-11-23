import { expect, test } from "./fixtures";

test("Endereço do estúdio: atalho de Ajustes leva ao Meu perfil, cadastra no sheet e volta na lista", async ({
  page,
}) => {
  await page.goto("/ajustes");
  await expect(page.locator("#ajuste-endereco")).toContainText("Cadastrar");
  await page.locator("#ajuste-endereco").click();
  await expect(page).toHaveURL(/\/perfil#endereco$/);
  await expect(page.getByRole("heading", { level: 1, name: "Meu perfil" })).toBeVisible();

  await page.getByRole("button", { name: "Cadastrar endereço" }).click();
  const sheet = page.getByRole("dialog", { name: "Endereço do estúdio" });
  // CEP primeiro: a busca (ViaCEP) pode ou não responder no teste; depois os campos são preenchidos à mão
  await sheet.getByLabel("CEP").fill("12245000");
  await expect(sheet.getByLabel("CEP")).toHaveValue("12245-000");
  await expect(sheet.getByText("Buscando o CEP…")).toHaveCount(0, { timeout: 10_000 });
  await sheet.getByLabel("Rua").fill("Rua das Flores");
  await sheet.getByLabel("Número").fill("430");
  await sheet.getByLabel("Complemento").fill("Sala 2");
  await sheet.getByLabel("Bairro").fill("Centro");
  await sheet.getByLabel("Cidade").fill("São José dos Campos");
  await sheet.getByLabel("UF").selectOption("SP");
  await sheet.getByRole("button", { name: "Salvar endereço" }).click();

  const line = "Rua das Flores, 430, Sala 2 - Centro, São José dos Campos - SP, 12245-000";
  await expect(page.getByText(line)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver no mapa" })).toHaveAttribute("href", /google\.com\/maps/);
  await page.goto("/ajustes");
  await expect(page.locator("#ajuste-endereco")).toContainText("Rua das Flores, 430");
});

test("Endereço: campo obrigatório vazio mostra o erro e não fecha o sheet", async ({ page }) => {
  // link antigo de Ajustes redireciona para o Meu perfil
  await page.goto("/ajustes/endereco");
  await expect(page).toHaveURL(/\/perfil/);
  await page.getByRole("button", { name: "Cadastrar endereço" }).click();
  const sheet = page.getByRole("dialog", { name: "Endereço do estúdio" });
  await sheet.getByRole("button", { name: "Salvar endereço" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Digite o CEP com 8 números.");
});

test("Mensagens: salvar volta para a lista de Ajustes", async ({ page }) => {
  await page.goto("/ajustes/mensagens");
  await expect(page.getByRole("textbox", { name: "Texto do agendamento confirmado" })).toHaveValue(
    /^Oi! Seu agendamento/,
  );
  await page.getByRole("button", { name: "Salvar mensagens" }).click();
  await expect(page).toHaveURL(/\/ajustes$/);
});
