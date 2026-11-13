import { assertTestDatabase } from "../db-guard";

/** Os e2e criam e apagam usuários direto no banco: só num Postgres local _test. */
export default function globalSetup() {
  if (!process.env.DATABASE_URL) throw new Error("e2e precisa de DATABASE_URL de um Postgres local _test");
  assertTestDatabase();
}
