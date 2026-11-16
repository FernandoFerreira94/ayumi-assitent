import postgres from "postgres";
import { expect, test } from "./fixtures";
import { addDays, todayStr, toInstant } from "../../src/lib/dates";

/** Estúdio da sessão deste teste, com uma cliente atendida ontem num serviço de retorno de 15 dias. */
async function seed(cookies: { name: string; value: string }[], returnDays: number | null = 15) {
  const token = decodeURIComponent(cookies.find((c) => c.name === "better-auth.session_token")!.value).split(".")[0];
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const [{ tenant_id: tid }] = await sql`select m.tenant_id from session s join memberships m on m.user_id = s."userId"
    where s.token = ${token}`;
  const [{ id: cli }] =
    await sql`insert into clients (tenant_id,name,phone_e164) values (${tid},'Ana Souza','+5511987650011') returning id`;
  const [{ id: svc }] = await sql`insert into services (tenant_id,name,duration_min,price_cents,return_days)
    values (${tid},'Unha',60,5000,${returnDays}) returning id`;
  const day = addDays(todayStr(), -1);
  const [{ id }] =
    await sql`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
    values (${tid},${cli},${svc},${toInstant(day, "10:00")},${toInstant(day, "11:00")},5000,'confirmed') returning id`;
  await sql`insert into appointment_services (appointment_id,tenant_id,service_id,position,price_cents,duration_min)
    values (${id},${tid},${svc},0,5000,60)`;
  return { sql, id: id as string, due: addDays(day, returnDays ?? 0) };
}

const concluir = async (page: import("@playwright/test").Page) => {
  await page.goto("/pendencias");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
};

test("concluir pergunta o retorno e um horário abre o agendamento preenchido", async ({ page, context }) => {
  const { sql, id, due } = await seed(await context.cookies());
  await concluir(page);

  const ask = page.getByRole("dialog", { name: "Marcar o retorno de Ana?" });
  await expect(ask).toBeVisible();
  await expect(ask.getByText("Atendimento concluído")).toBeVisible();
  const [{ d }] = await sql`select to_char(return_due_on,'YYYY-MM-DD') as d from appointments where id = ${id}`;
  expect(d).toBe(due);

  await ask
    .getByRole("button", { name: /^Agendar retorno .* às / })
    .first()
    .click();
  const form = page.getByRole("dialog", { name: "Novo agendamento" });
  await expect(form.getByRole("button", { name: "Cliente" })).toContainText("Ana Souza");
  await expect(form.getByRole("button", { name: "Serviço" })).toContainText("Unha");
  await sql.end();
});

test("Não precisa grava e não pergunta de novo; Desfazer volta o atendimento", async ({ page, context }) => {
  const { sql, id } = await seed(await context.cookies());
  await concluir(page);
  const ask = page.getByRole("dialog", { name: "Marcar o retorno de Ana?" });
  await ask.getByRole("button", { name: "Não precisa" }).click();
  await expect(page.getByText("fica sem retorno desta vez")).toBeVisible();
  await expect(ask).toHaveCount(0);
  const [row] = await sql`select status, return_skipped_at from appointments where id = ${id}`;
  expect(row.status).toBe("done");
  expect(row.return_skipped_at).not.toBeNull();

  // De novo para pendente e concluir: Desfazer na própria folha
  await sql`update appointments set status = 'confirmed', return_skipped_at = null, return_due_on = null where id = ${id}`;
  await concluir(page);
  await page
    .getByRole("dialog", { name: "Marcar o retorno de Ana?" })
    .getByRole("button", { name: "Desfazer" })
    .click();
  await expect
    .poll(async () => (await sql`select status from appointments where id = ${id}`)[0].status)
    .toBe("confirmed");
  await sql.end();
});

test("serviço sem retorno conclui só com o toast", async ({ page, context }) => {
  const { sql } = await seed(await context.cookies(), null);
  await concluir(page);
  await expect(page.getByText("Atendimento concluído")).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Marcar o retorno/ })).toHaveCount(0);
  await sql.end();
});

test("cartão da cliente mostra o retorno previsto, o histórico e abre os horários", async ({ page, context }) => {
  const { sql, id } = await seed(await context.cookies());
  // Uma visita anterior, 20 dias antes, para o intervalo do histórico
  const [a] = await sql`select tenant_id, client_id, service_id, starts_at from appointments where id = ${id}`;
  await sql`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
    values (${a.tenant_id},${a.client_id},${a.service_id},${a.starts_at}::timestamptz - interval '20 days',
            ${a.starts_at}::timestamptz - interval '20 days' + interval '1 hour',5000,'done')`;
  await concluir(page);
  await page
    .getByRole("dialog", { name: "Marcar o retorno de Ana?" })
    .getByRole("button", { name: "Agora não" })
    .click();

  await page.goto("/clientes");
  const cartao = page.getByRole("dialog", { name: "Ana Souza" });
  await expect(async () => {
    await page.getByRole("button", { name: /^Ana Souza/ }).click({ timeout: 1000 });
    await expect(cartao).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(cartao.getByText("Retorno previsto")).toBeVisible();
  const historico = cartao.getByRole("region", { name: "Histórico" });
  await expect(historico.getByText("após 20 dias")).toBeVisible();
  await expect(historico.getByText("1ª visita")).toBeVisible();

  await cartao.getByRole("button", { name: "Ver horários" }).click();
  const ask = page.getByRole("dialog", { name: "Marcar o retorno de Ana?" });
  await expect(ask).toBeVisible();
  // Pelo cartão não houve Concluir: sem o aviso nem o Desfazer
  await expect(ask.getByText("Atendimento concluído")).toHaveCount(0);
  await sql.end();
});

test("Para chamar lista quem passou do retorno e não marcou, com convite pronto", async ({ page, context }) => {
  const { sql, id } = await seed(await context.cookies());
  // Atendida há 20 dias num serviço de 15: passou 5 dias
  const d20 = addDays(todayStr(), -20);
  await sql`update appointments set status = 'done', starts_at = ${toInstant(d20, "10:00")},
    ends_at = ${toInstant(d20, "11:00")}, return_due_on = ${addDays(d20, 15)} where id = ${id}`;
  // Outra cliente com retorno vencido, mas já com horário marcado: não aparece
  const [a] = await sql`select tenant_id, service_id from appointments where id = ${id}`;
  const [{ id: bia }] = await sql`insert into clients (tenant_id,name,phone_e164)
    values (${a.tenant_id},'Bia Lima','+5511987650022') returning id`;
  await sql`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status,return_due_on) values
    (${a.tenant_id},${bia},${a.service_id},${toInstant(d20, "14:00")},${toInstant(d20, "15:00")},5000,'done',${addDays(d20, 15)}),
    (${a.tenant_id},${bia},${a.service_id},${toInstant(addDays(todayStr(), 3), "14:00")},${toInstant(addDays(todayStr(), 3), "15:00")},5000,'confirmed',null)`;

  await page.goto("/clientes");
  const lista = page.getByRole("region", { name: "Para chamar" });
  await expect(lista.getByText("Ana Souza")).toBeVisible();
  await expect(lista.getByText("Unha · passou 5 dias")).toBeVisible();
  await expect(lista.getByText("Bia Lima")).toHaveCount(0);

  await expect(async () => {
    await lista.getByRole("button", { name: "Chamar Ana Souza no WhatsApp" }).click({ timeout: 1000 });
    await expect(page.getByRole("textbox", { name: /mensagem/i })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(page.getByRole("textbox", { name: /mensagem/i })).toHaveValue(
    /Oi, Ana! Está chegando a hora do retorno/,
  );
  await page.keyboard.press("Escape");

  await lista.getByRole("button", { name: "Horários para o retorno de Ana Souza" }).click();
  await expect(page.getByRole("dialog", { name: "Marcar o retorno de Ana?" })).toBeVisible();
  await sql.end();
});
