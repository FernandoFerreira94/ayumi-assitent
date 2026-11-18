import "server-only";
import { errCode, log } from "./log";

export type Email = { to: string; subject: string; html: string; text: string };

/**
 * Envia e-mail pela API HTTP do Resend (sem SDK: um fetch basta). Configuração no Railway (web):
 * RESEND_API_KEY e EMAIL_FROM (ex.: "Bubbly <nao-responda@bubbly.app.br>", domínio verificado no Resend).
 * Nunca lança: quem chama é o fluxo de senha, que responde igual exista ou não a conta. Devolve se saiu.
 * Sem chave fora de produção, mostra o e-mail no terminal para testar o fluxo local (nunca em produção: leva o link).
 */
export async function sendEmail(mail: Email, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email de teste] para ${mail.to}: ${mail.subject}\n${mail.text}\n`);
    } else {
      log("error", "email.not_configured");
    }
    return false;
  }
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      log("error", "email.send_failed", { status: res.status });
      return false;
    }
    return true;
  } catch (e) {
    log("error", "email.send_failed", errCode(e));
    return false;
  }
}
