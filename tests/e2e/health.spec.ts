import { expect, test } from "@playwright/test";

test("healthcheck responde 200 com o banco no ar", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});
