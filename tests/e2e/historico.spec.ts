import postgres from "postgres";
import { expect, test } from "./fixtures";
import { addDays, todayStr, toInstant } from "../../src/lib/dates";

/** Estúdio da sessão com a Ana: 2 atendimentos concluídos, 1 falta, 1 cancelado, 1 marcado e um pacote. */
async function seed(cookies: { name: string; value: string }[]) {
  const token = decodeURIComponent(cookies.find((c) => c.name === "better-auth.session_token")!.value).split(".")[0];
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const [{ tenant_id: tid }] = await sql`select m.tenant_id from session s join memberships m on m.user_id = s."userId"
    where s.token = ${token}`;
  const [{ id: cli }] =
    await sql`insert into clients (tenant_id,name,phone_e164) values (${tid},'Ana Souza','+5511987650021') returning id`;
  const [{ id: svc }] =
    await sql`insert into services (tenant_id,name,duration_min,price_cents) values (${tid},'Esmaltação',60,5000) returning id`;
  const appt = async (days: number, status: string, price = 5000) => {
    const day = addDays(todayStr(), days);
    const [{ id }] = await sql`insert into appointments (tenant_id,client_id,service_id,starts_at,ends_at,price_cents,status)
      values (${tid},${cli},${svc},${toInstant(day, "10:00")},${toInstant(day, "11:00")},${price},${status}) returning id`;
    await sql`insert into appointment_services (appointment_id,tenant_id,service_id,position,price_cents,duration_min)
      values (${id},${tid},${svc},0,${price},60)`;
    return id as string;
  };
  const done1 = await appt(-60, "done");
  await sql`insert into client_ledger (tenant_id,client_id,appointment_id,kind,amount_cents,method,occurred_at)
    values (${tid},${cli},${done1},'payment',5000,'pix',${toInstant(addDays(todayStr(), -60), "11:00")})`;
  await appt(-45, "no_show");
  await appt(-30, "cancelled");
  const [{ id: pkg }] = await sql`insert into client_packages (tenant_id,client_id,name,service_id,service_ids,sessions_total,price_cents,sold_on,expires_on,created_at)
    values (${tid},${cli},'Pague 3 leve 4',${svc},${[svc]}::uuid[],4,15000,${addDays(todayStr(), -20)},${addDays(todayStr(), 70)},${toInstant(addDays(todayStr(), -20), "09:00")})
    returning id`;
  await sql`insert into client_ledger (tenant_id,client_id,client_package_id,kind,sessions,occurred_at)
    values (${tid},${cli},${pkg},'session_grant',4,${toInstant(addDays(todayStr(), -20), "09:00")})`;
  await sql`insert into client_ledger (tenant_id,client_id,client_package_id,kind,amount_cents,method,occurred_at)
    values (${tid},${cli},${pkg},'payment',15000,'pix',${toInstant(addDays(todayStr(), -20), "09:00")})`;
  const done2 = await appt(-10, "done", 3750);
  await sql`update appointments set client_package_id = ${pkg} where id = ${done2}`;
  await sql`insert into client_ledger (tenant_id,client_id,client_package_id,appointment_id,kind,sessions,amount_cents,occurred_at)
    values (${tid},${cli},${pkg},${done2},'session_reserve',1,3750,${toInstant(addDays(todayStr(), -10), "10:00")})`;
  const next = await appt(5, "confirmed");
  await sql`insert into client_ledger (tenant_id,client_id,appointment_id,kind,amount_cents,method,occurred_at)
    values (${tid},${cli},${next},'payment',1500,'pix',now())`;
  await sql.end();
}

test("histórico da cliente: resumo, linha do tempo e filtros", async ({ page, context }) => {
  await seed(await context.cookies());
  await page.goto("/clientes");
  const cartao = page.getByRole("dialog", { name: "Ana Souza" });
  await expect(async () => {
    await page.getByRole("button", { name: /^Ana Souza/ }).click({ timeout: 1000 });
    await expect(cartao).toBeVisible({ timeout: 1000 });
  }).toPass();

  await cartao.getByRole("button", { name: "Histórico" }).click();
  const hist = page.getByRole("dialog", { name: "Histórico de Ana" });
  await expect(hist).toBeVisible();

  // Resumo: 2 atendimentos, 1 falta, gastou R$ 87,50, plano ativo com 3 de 4
  await expect(hist.getByText("atendimentos", { exact: true })).toBeVisible();
  await expect(hist.getByText("R$ 87,50")).toBeVisible();
  await expect(hist.getByText("Comparece em 67% das vezes", { exact: false })).toBeVisible();
  await expect(hist.getByText("Pague 3 leve 4").first()).toBeVisible();

  // Linha do tempo
  await expect(hist.getByText("Marcado · Confirmado")).toBeVisible();
  await expect(hist.getByText("Sinal R$ 15,00 · falta R$ 35,00")).toBeVisible();
  await expect(hist.getByText("Plano: Pague 3 leve 4")).toBeVisible();
  await expect(hist.getByText("Comprou o pacote Pague 3 leve 4")).toBeVisible();
  await expect(hist.getByText("Faltou", { exact: true })).toBeVisible();
  await expect(hist.getByText("Cancelado", { exact: true })).toBeVisible();
  if (process.env.PRINTS_DIR) await page.screenshot({ path: `${process.env.PRINTS_DIR}/celular-1-historico.png` });

  // Filtros
  await hist.getByRole("tab", { name: "Faltas" }).click();
  await expect(hist.getByText("Faltou", { exact: true })).toBeVisible();
  await expect(hist.getByText("Compareceu")).toHaveCount(0);
  await hist.getByRole("tab", { name: "Pagamentos" }).click();
  await expect(hist.getByText("Pagou o pacote Pague 3 leve 4")).toBeVisible();
  await expect(hist.getByText("Sinal", { exact: true })).toBeVisible();
  if (process.env.PRINTS_DIR) await page.screenshot({ path: `${process.env.PRINTS_DIR}/celular-2-pagamentos.png` });
  await hist.getByRole("tab", { name: "Planos" }).click();
  await expect(hist.getByText("Comprou o pacote Pague 3 leve 4")).toBeVisible();
  await expect(hist.getByText("Faltou", { exact: true })).toHaveCount(0);
});
