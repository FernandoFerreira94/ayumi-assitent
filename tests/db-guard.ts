const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Testes de banco apagam tabelas inteiras (truncate tenants cascade): só rodam em Postgres local
 * cujo nome termina em _test. Sem DATABASE_URL não faz nada (os testes de banco são pulados).
 */
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  if (!url) return;
  const u = new URL(url);
  if (!LOCAL.has(u.hostname))
    throw new Error(
      `DATABASE_URL aponta para ${u.hostname}: testes não rodam fora do localhost (risco de apagar produção).`,
    );
  if (!/_test$/.test(u.pathname.replace(/^\//, "")))
    throw new Error("O banco de teste precisa terminar em _test (ex.: assist_test).");
}
