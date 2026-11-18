import { afterEach, describe, expect, it, vi } from "vitest";
import { RESET_LINK_MINUTES, resetPasswordEmail } from "@/features/auth/emails";
import { sendEmail } from "@/lib/email";
import { redactUrl } from "@/lib/log";

const url = "https://app.bubbly.app.br/api/auth/reset-password/abcDEF123456789xyz?callbackURL=%2Fredefinir-senha";

describe("e-mail de nova senha", () => {
  it("traz o link no botão e em texto, com o prazo", () => {
    const m = resetPasswordEmail("yumi@x.com", "Yumi Tanaka", url);
    expect(m.to).toBe("yumi@x.com");
    expect(m.subject).toContain("nova senha");
    expect(m.text).toContain(url);
    expect(m.text).toContain("Oi, Yumi!");
    expect(m.text).toContain(`${RESET_LINK_MINUTES} minutos`);
    expect(m.html).toContain(url.replace(/&/g, "&amp;"));
    expect(m.html).toContain("Criar nova senha");
  });

  it("escapa o nome no HTML", () => {
    const m = resetPasswordEmail("a@x.com", "<script>alert(1)</script>", url);
    expect(m.html).not.toContain("<script>");
  });

  it("sem nome, saudação neutra", () => {
    expect(resetPasswordEmail("a@x.com", "", url).text.startsWith("Oi!")).toBe(true);
  });

  it("o token do link não vai para log nem Sentry", () => {
    expect(redactUrl(url)).not.toContain("abcDEF123456789xyz");
    expect(redactUrl("https://x/redefinir-senha?token=abcDEF123456789xyz")).not.toContain("abcDEF");
  });
});

describe("sendEmail (Resend)", () => {
  afterEach(() => vi.unstubAllEnvs());
  const mail = resetPasswordEmail("a@x.com", "Ana", url);

  it("chama a API do Resend com remetente e destinatário", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Bubbly <nao-responda@bubbly.app.br>");
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await sendEmail(mail, f as unknown as typeof fetch)).toBe(true);
    const [endpoint, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(endpoint).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(["a@x.com"]);
    expect(body.from).toContain("bubbly.app.br");
  });

  it("falha do provedor não lança", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "x@y.com");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendEmail(mail, (async () => new Response("", { status: 500 })) as typeof fetch)).toBe(false);
    expect(
      await sendEmail(mail, (async () => {
        throw new Error("offline");
      }) as typeof fetch),
    ).toBe(false);
    expect(JSON.stringify(err.mock.calls)).not.toContain(url);
    err.mockRestore();
  });

  it("sem chave, não chama a rede", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const f = vi.fn();
    expect(await sendEmail(mail, f as unknown as typeof fetch)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
