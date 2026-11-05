// Aplica src/db/migrations/*.sql em ordem, registrando o que já rodou.
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada");
const sql = postgres(url, { max: 1, onnotice: () => {} });
await sql`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`;
const done = new Set((await sql`select name from _migrations`).map((r) => r.name));
const dir = new URL("../src/db/migrations/", import.meta.url);
for (const f of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (done.has(f)) continue;
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(new URL(f, dir), "utf8"));
    await tx`insert into _migrations (name) values (${f})`;
  });
  console.log("aplicada", f);
}
await sql.end();
