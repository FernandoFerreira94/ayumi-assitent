import postgres from "postgres";
import { expect, test } from "./fixtures";
import { addDays, todayStr, toInstant } from "../../src/lib/dates";

/** Estúdio da sessão deste teste (o cookie leva o token da sessão criada pela fixture). */
async function tenantOf(cookies: { name: string; value: string }[]) {
  const token = decodeURIComponent(cookies.find((c) => c.name === "better-auth.session_token")!.value).split(".")[0];
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const [{ tenant_id }] = await sql`select m.tenant_id from session s join memberships m on m.user_id = s."userId"
    where s.token = ${token}`;
  return { sql, tid: tenant_id as string };
}

test("evento do iPhone aparece cinza, mostra a origem e vira agendamento", async ({ page, context }) => {
  const { sql, tid } = await tenantOf(await context.cookies());
  const day = addDays(todayStr(), 1);
  await sql`insert into clients (tenant_id,name,phone_e164) values (${tid},'Maria Souza','+5511987650001')`;
  await sql`insert into services (tenant_id,name,duration_min,price_cents) values (${tid},'Corte',60,5000)`;
  await sql`insert into blocks (tenant_id,starts_at,ends_at,reason,source,external_uid) values
    (${tid},${toInstant(day, "14:00")},${toInstant(day, "15:00")},'Maria Souza - corte','icloud','u1'),
    (${tid},${toInstant(day, "16:00")},${toInstant(day, "17:00")},'Dentista','icloud','u2')`;
  await sql.end();

  await page.goto(`/calendario?d=${day}`);
  const outro = page.getByRole("button", { name: /Evento do Calendário do iPhone · Dentista/ });
  await expect(outro).toBeVisible();
  await expect(outro).toHaveClass(/ext/);
  await outro.click();
  const sheet = page.getByRole("dialog", { name: "Dentista" });
  await expect(sheet.getByText("Do Calendário do iPhone")).toBeVisible();
  await expect(sheet.getByText("Parece um atendimento")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Evento do Calendário do iPhone · Maria Souza - corte/ }).click();
  const det = page.getByRole("dialog", { name: "Maria Souza - corte" });
  await expect(det.getByText("Parece um atendimento")).toBeVisible();
  await det.getByRole("button", { name: "Transformar em agendamento" }).click();

  const form = page.getByRole("dialog", { name: "Novo agendamento" });
  // Tudo veio preenchido: abre direto no resumo
  await expect(form.getByRole("heading", { name: "Tudo certo?" })).toBeVisible();
  await expect(form.getByRole("button", { name: /^Cliente: Maria Souza/ })).toBeVisible();
  await expect(form.getByRole("button", { name: /^Quando: .* às 14:00/ })).toBeVisible();
  await expect(form.getByText("Corte", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Agendar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agendado, sem lembrete" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  // O evento cinza saiu e o atendimento ficou no lugar
  await expect(page.getByRole("button", { name: /Evento do Calendário do iPhone · Maria/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Maria Souza/ }).first()).toBeVisible();
});

test("Ajustes: o interruptor abre o passo a passo e recusa link que não é do iCloud", async ({ page }) => {
  await page.goto("/ajustes/calendarios");
  const sw = page.getByRole("switch", { name: "Calendário do iPhone" });
  await expect(sw).not.toBeChecked();
  await sw.click();
  const sheet = page.getByRole("dialog", { name: "Calendário do iPhone" });
  await expect(sheet.getByRole("heading", { name: "Trazer a agenda do iPhone para o app" })).toBeVisible();
  await expect(sheet.getByRole("tab", { name: "Ver no iPhone" })).toBeVisible();
  await sheet.getByLabel("Link do calendário").fill("https://exemplo.com/agenda.ics");
  await sheet.getByRole("button", { name: "Ligar", exact: true }).click();
  await expect(page.getByText(/não é um link de Calendário Público do iCloud/)).toBeVisible();
  await expect(sheet.getByLabel("Link do calendário")).toHaveAttribute("aria-invalid", "true");
  await expect(sheet.getByText("Use o link do Compartilhar Link do iCloud.")).toBeVisible();
});

test("Ajustes: vários calendários do iPhone em lista, com o que veio e o erro de cada um", async ({
  page,
  context,
}) => {
  const { sql, tid } = await tenantOf(await context.cookies());
  await sql`insert into icloud_calendars (tenant_id,url,name,event_count,synced_at,sync_error,created_at) values
    (${tid},'https://p01-caldav.icloud.com/published/2/pe2e','Pessoal',3,now(),null,now() - interval '1 minute'),
    (${tid},'https://p01-caldav.icloud.com/published/2/te2e','Trabalho',0,null,'not_found',now())`;
  await sql.end();
  await page.goto("/ajustes/calendarios");
  const sw = page.getByRole("switch", { name: "Calendário do iPhone" });
  await expect(sw).toBeChecked();
  // tocar no texto abre o sheet (o interruptor ligado pergunta se desliga)
  await page.getByText("Ligado. 2 calendários do iPhone na agenda, em cinza.").click();
  const sheet = page.getByRole("dialog", { name: "Calendário do iPhone" });
  const list = sheet.getByRole("list", { name: "Calendários do iPhone ligados" });
  await expect(list.getByText("Pessoal")).toBeVisible();
  await expect(list.getByText(/Lido às \d\d:\d\d · 3 eventos na agenda/)).toBeVisible();
  await expect(list.getByText("Trabalho")).toBeVisible();
  await expect(list.getByText(/Link parou de funcionar/)).toBeVisible();
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/1-lista.png` });
  // o campo de colar só aparece ao pedir outro calendário
  await expect(sheet.getByLabel("Link do calendário")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Adicionar outro calendário" }).click();
  await expect(sheet.getByLabel("Link do calendário")).toBeVisible();
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/2-adicionar.png`, fullPage: true });
  await sheet.getByRole("button", { name: "Cancelar" }).click();
  await sheet.getByRole("button", { name: "Parar de ler Trabalho" }).click();
  await expect(page.getByText("Eventos desse calendário tirados da agenda")).toBeVisible();
  await expect(list.getByText("Trabalho")).toHaveCount(0);
  await expect(list.getByText("Pessoal")).toBeVisible();
});

test("Calendário (mês): eventos de fora aparecem cinza todos os dias e o toque abre o dia", async ({
  page,
  context,
}) => {
  const { sql, tid } = await tenantOf(await context.cookies());
  const days = [1, 2, 3].map((n) => addDays(todayStr(), n));
  for (const [i, d] of days.entries())
    await sql`insert into blocks (tenant_id,starts_at,ends_at,reason,source,external_uid) values
      (${tid},${toInstant(d, "18:00")},${toInstant(d, "19:00")},'Curso','icloud',${`curso#${i}`})`;
  // Um evento do Google que já virou atendimento não aparece mais
  await sql`insert into blocks (tenant_id,starts_at,ends_at,reason,source,google_event_id,converted_at) values
    (${tid},${toInstant(days[0], "10:00")},${toInstant(days[0], "11:00")},'Convertido','google','g1',now())`;
  await sql.end();

  await page.goto(`/calendario?v=mes&m=${days[0].slice(0, 7)}`);
  for (const d of days) {
    const cell = page.locator(`.cal-cell[data-zoom="d${d}"]`).first();
    await expect(cell).toHaveAttribute("aria-label", /1 evento de fora/);
    await expect(cell.locator('.cal-pill[data-ext="icloud"]')).toHaveText("Curso");
  }
  await expect(page.locator(".cal-pill", { hasText: "Convertido" })).toHaveCount(0);

  await page.locator(`.cal-cell[data-zoom="d${days[1]}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`d=${days[1]}`));
  await expect(page.getByRole("button", { name: /Evento do Calendário do iPhone · Curso/ })).toBeVisible();
});
