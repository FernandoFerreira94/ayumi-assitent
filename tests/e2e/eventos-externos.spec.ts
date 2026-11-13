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
  await expect(form.getByRole("button", { name: "Cliente" })).toContainText("Maria Souza");
  await expect(form.getByRole("button", { name: "Serviço" })).toContainText("Corte");
  await expect(form.getByLabel("Horário")).toHaveValue("14:00");
  await form.getByRole("button", { name: "Agendar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agendado, sem lembrete" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  // O evento cinza saiu e o atendimento ficou no lugar
  await expect(page.getByRole("button", { name: /Evento do Calendário do iPhone · Maria/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Maria Souza/ }).first()).toBeVisible();
});

test("Ajustes: o interruptor abre o passo a passo e recusa link que não é do iCloud", async ({ page }) => {
  await page.goto("/ajustes");
  const sw = page.getByRole("switch", { name: "Calendário do iPhone" });
  await expect(sw).not.toBeChecked();
  await sw.click();
  const sheet = page.getByRole("dialog", { name: "Calendário do iPhone" });
  await expect(sheet.getByText("Trazer a agenda do iPhone para o app")).toBeVisible();
  await expect(sheet.getByText("Ver os agendamentos no Calendário do iPhone")).toBeVisible();
  await sheet.getByLabel("Link do calendário").fill("https://exemplo.com/agenda.ics");
  await sheet.getByRole("button", { name: "Ligar", exact: true }).click();
  await expect(page.getByText(/não é um link de Calendário Público do iCloud/)).toBeVisible();
  await expect(sheet.getByLabel("Link do calendário")).toHaveAttribute("aria-invalid", "true");
});
