import "server-only";
import { and, asc, eq, gt, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { apiTokens } from "@/db/schema";
import { listDay } from "@/features/appointments/core";
import { errInfo, log } from "@/lib/log";
import type { AtalhoRow } from "./core";
import { allowIp, allowToken } from "./rate";
import { bearerToken, hashApiToken, isPairingCodeShape, newApiToken, tokenLast4 } from "./token";
import type { TokenItem } from "./tokens-shared";

/** Chave ativa dona do hash. Roda como dono do banco: ainda não se sabe o estúdio (igual ao webhook). */
export async function activeTokenByHash(hash: string) {
  const [t] = await getDb()
    .select({ id: apiTokens.id, tenantId: apiTokens.tenantId, scope: apiTokens.scope })
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hash), isNull(apiTokens.revokedAt), isNull(apiTokens.pairingExpiresAt)))
    .limit(1);
  return t ?? null;
}

/** Marca o uso (a tela mostra "usado há X"). No máximo a cada 10 min; nunca derruba a resposta. */
export async function markTokenUsed(id: string) {
  await getDb()
    .update(apiTokens)
    .set({ lastUsedAt: sql`now()` })
    .where(
      and(
        eq(apiTokens.id, id),
        or(isNull(apiTokens.lastUsedAt), lt(apiTokens.lastUsedAt, sql`now() - interval '10 minutes'`)),
      ),
    );
}

/** Atendimentos (sem cancelados) entre `from` e `to`, já isolados pelo estúdio. */
export async function loadRows(tenantId: string, range: [Date, Date]): Promise<AtalhoRow[]> {
  const rows = await withTenant(tenantId, (tx) => listDay(tx, range));
  return rows.map((r) => ({
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    status: r.status,
    clientName: r.clientName,
    serviceName: r.serviceName,
    priceCents: r.priceCents,
  }));
}

const HEADERS = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };
/**
 * Por padrão a resposta é só a frase, em texto puro: o Atalho fala direto o "Conteúdo do URL", sem passo de
 * dicionário (com JSON a Siri lia chaves e aspas). `?formato=json` ou `Accept: application/json` devolve os dados.
 */
export const wantsJson = (req: Request) =>
  new URL(req.url).searchParams.get("formato") === "json" || /application\/json/i.test(req.headers.get("accept") ?? "");

function respond(req: Request, status: number, body: Record<string, unknown> & { fala: string }) {
  if (wantsJson(req)) return Response.json(body, { status, headers: HEADERS });
  return new Response(body.fala, { status, headers: { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" } });
}

/** IP de quem chama (Railway põe o cliente primeiro no x-forwarded-for). */
const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

/**
 * Casca das rotas dos Atalhos: limite por IP antes do banco → chave (Bearer) → limite por chave → consulta.
 * Sem chave, chave errada ou desligada: o mesmo 401. Nunca loga a chave nem nome de cliente.
 */
export async function handleAtalho(
  req: Request,
  answer: (tenantId: string, now: Date) => Promise<Record<string, unknown> & { fala: string }>,
): Promise<Response> {
  if (!allowIp(clientIp(req)))
    return respond(req, 429, { fala: "Muitas consultas seguidas. Tenta de novo daqui a um minuto." });
  const token = bearerToken(req.headers.get("authorization"));
  const off = () =>
    respond(req, 401, {
      fala: "Esse atalho não está mais ligado. Gere uma chave nova no Bubbly, em Ajustes, Siri e Atalhos.",
    });
  if (!token) return off();
  try {
    const t = await activeTokenByHash(hashApiToken(token));
    if (!t || t.scope !== "read") return off();
    if (!allowToken(t.id))
      return respond(req, 429, { fala: "Muitas consultas seguidas. Tenta de novo daqui a um minuto." });
    const [body] = await Promise.all([
      answer(t.tenantId, new Date()),
      markTokenUsed(t.id).catch((e) => log("warn", "api_token_mark_failed", errInfo(e))),
    ]);
    return respond(req, 200, body);
  } catch (e) {
    log("error", "atalho_failed", errInfo(e));
    return respond(req, 500, { fala: "Não consegui ler sua agenda agora. Tenta de novo em instantes." });
  }
}

/** Chaves ligadas do estúdio (para a tela). Nunca devolve hash. */
export async function listApiTokens(tenantId: string): Promise<TokenItem[]> {
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        last4: apiTokens.last4,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
      })
      .from(apiTokens)
      .where(and(isNull(apiTokens.revokedAt), isNull(apiTokens.pairingExpiresAt)))
      .orderBy(asc(apiTokens.createdAt)),
  );
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
  }));
}

/**
 * Troca o código de pareamento pela chave, numa única UPDATE: uso único e atômico (dois pedidos com o mesmo
 * código → só um ganha). Roda como dono do banco: o código é que diz o estúdio. Vencido ou usado: null.
 */
export async function redeemPairing(code: string): Promise<string | null> {
  const token = newApiToken();
  const done = await getDb()
    .update(apiTokens)
    .set({ tokenHash: hashApiToken(token), last4: tokenLast4(token), pairingExpiresAt: null })
    .where(
      and(
        eq(apiTokens.tokenHash, hashApiToken(code)),
        isNull(apiTokens.revokedAt),
        isNotNull(apiTokens.pairingExpiresAt),
        gt(apiTokens.pairingExpiresAt, sql`now()`),
      ),
    )
    .returning({ id: apiTokens.id });
  return done.length ? token : null;
}

/** Lê o código do corpo: JSON `{ "codigo": "bubpar_…" }` (padrão do app Atalhos) ou texto puro. Nunca da URL. */
async function pairingCodeOf(req: Request): Promise<string | null> {
  const raw = (await req.text().catch(() => "")).slice(0, 500).trim();
  let v = raw;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as { codigo?: unknown };
      v = typeof j.codigo === "string" ? j.codigo.trim() : "";
    } catch {
      v = "";
    }
  }
  return isPairingCodeShape(v) ? v : null;
}

/**
 * POST /api/v1/atalhos/parear: o Atalho "Bubbly" manda o código que o app copiou e recebe a chave (texto puro,
 * só ela, para salvar direto em arquivo). Falha: 400 com a frase para a Siri falar. Nunca loga código nem chave.
 */
export async function handlePairing(req: Request): Promise<Response> {
  if (!allowIp(clientIp(req)))
    return respond(req, 429, { fala: "Muitas tentativas seguidas. Tenta de novo daqui a um minuto." });
  const code = await pairingCodeOf(req);
  const expired = () =>
    respond(req, 400, {
      fala: "Esse código já venceu. Abra o Bubbly, em Ajustes, Siri e Atalhos, e toque em Adicionar à Siri de novo.",
    });
  if (!code) return expired();
  try {
    const token = await redeemPairing(code);
    if (!token) return expired();
    if (wantsJson(req)) return Response.json({ chave: token }, { headers: HEADERS });
    return new Response(token, { headers: { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    log("error", "atalho_pairing_failed", errInfo(e));
    return respond(req, 500, { fala: "Não consegui ligar a Siri agora. Tenta de novo em instantes." });
  }
}
