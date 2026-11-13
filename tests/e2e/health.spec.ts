import { expect, test } from "@playwright/test";

test("healthcheck responde 200 com o banco no ar", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("respostas trazem cabeçalhos de segurança", async ({ request }) => {
  const h = (await request.get("/login")).headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");
});
