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
