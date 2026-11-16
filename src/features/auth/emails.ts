import type { Email } from "@/lib/email";

/** Minutos que o link de nova senha vale (mesmo valor de resetPasswordTokenExpiresIn no auth.ts). */
export const RESET_LINK_MINUTES = 30;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Primeiro nome para a saudação; vazio se o nome não ajuda. */
function firstName(name: string | null | undefined) {
  const n = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return n.length > 0 && n.length <= 40 ? n : "";
}

/**
 * E-mail do "Esqueci a senha". Layout em tabela e estilo inline (clientes de e-mail ignoram CSS de fora),
 * cores da marca (Lavanda Digital), botão grande para o dedo e o link em texto para quem não vê o botão.
 */
export function resetPasswordEmail(to: string, name: string | null | undefined, url: string): Email {
  const hi = firstName(name);
  const greet = hi ? `Oi, ${hi}!` : "Oi!";
  const subject = "Crie sua nova senha do Bubbly";
  const text = [
    greet,
    "",
    "Recebemos um pedido para trocar a senha da sua conta no Bubbly.",
    `Abra o link abaixo para criar a nova senha. Ele vale por ${RESET_LINK_MINUTES} minutos e só funciona uma vez:`,
    "",
    url,
    "",
    "Não foi você? É só ignorar este e-mail: sua senha continua a mesma.",
    "",
    "Bubbly",
  ].join("\n");
  const u = esc(url);
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f6f3ff;font-family:Quicksand,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2340">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ff;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:24px;padding:32px 28px;box-shadow:0 8px 32px rgba(109,74,255,.10)">
<tr><td style="font-size:28px;font-weight:700;color:#6d4aff;letter-spacing:-.5px;padding-bottom:20px">bubbly</td></tr>
<tr><td style="font-size:20px;font-weight:700;padding-bottom:8px">${esc(greet)}</td></tr>
<tr><td style="font-size:16px;line-height:1.55;padding-bottom:24px">Recebemos um pedido para trocar a senha da sua conta no Bubbly. Toque no botão para criar a nova senha. O link vale por <b>${RESET_LINK_MINUTES} minutos</b> e só funciona uma vez.</td></tr>
<tr><td align="center" style="padding-bottom:24px">
<a href="${u}" style="display:inline-block;background:#6d4aff;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 28px;border-radius:16px">Criar nova senha</a>
</td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#6b6385;padding-bottom:20px">Se o botão não abrir, copie este endereço no navegador:<br><a href="${u}" style="color:#5535e6;word-break:break-all">${u}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#6b6385;border-top:1px solid #eee9ff;padding-top:16px">Não foi você? É só ignorar este e-mail: sua senha continua a mesma.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  return { to, subject, html, text };
}
