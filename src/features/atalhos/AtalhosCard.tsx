"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { createApiToken, revokeApiToken } from "./actions";
import { MAX_ACTIVE_TOKENS, type TokenItem } from "./tokens-shared";

/** Os três Atalhos da fase 1 (só leitura). O nome é a frase que a pessoa fala para a Siri. */
const SHORTCUTS = [
  { phrase: "Agenda de hoje", path: "/api/v1/atalhos/agenda?dia=hoje" },
  { phrase: "Próxima cliente", path: "/api/v1/atalhos/proxima" },
  { phrase: "Resumo do dia", path: "/api/v1/atalhos/resumo?dia=hoje" },
] as const;

const usedLabel = (iso: string | null) => {
  if (!iso) return "Ainda não usada";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 15) return "Usada agora há pouco";
  if (min < 60 * 24) return `Usada há ${Math.round(min / 60) || 1}h`;
  return `Usada há ${Math.round(min / (60 * 24))} dias`;
};

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(`${what} copiado`);
  } catch {
    notify.error("CLIPBOARD");
  }
}

/** Ajustes > Siri e Atalhos: criar a chave só de leitura (mostrada uma vez), ver as ligadas e desligar. */
export function AtalhosCard({ initial, baseUrl }: { initial: TokenItem[]; baseUrl: string }) {
  const side = useSheetSide();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Meu iPhone");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const full = items.length >= MAX_ACTIVE_TOKENS;

  async function create() {
    setBusy(true);
    const res = await createApiToken(name).catch(() => null);
    setBusy(false);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", () => void create());
    setItems((l) => [...l, res.data.item]);
    setToken(res.data.token);
    notify.success("Chave criada", "Copie agora: ela não aparece de novo.");
  }

  async function revoke(id: string) {
    setRevoking(id);
    const res = await revokeApiToken(id).catch(() => null);
    setRevoking(null);
    setAsking(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK");
    setItems((l) => l.filter((t) => t.id !== id));
    notify.success("Chave desligada", "O Atalho que usava essa chave parou na hora.");
  }

  return (
    <div className="grid gap-3">
      <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
        <TileTitle icon="sparkles" tint="lavender">
          Siri e Atalhos do iPhone
        </TileTitle>
        <p className="text-sm font-semibold text-muted">
          Pergunte para a Siri &quot;Agenda de hoje&quot;, &quot;Próxima cliente&quot; ou &quot;Resumo do dia&quot; e
          ouça a resposta sem abrir o app. A Siri só consulta: ela não marca, muda nem cancela nada. Ela fala só o
          primeiro nome da cliente.
        </p>
        <button
          type="button"
          className="btn-tint min-h-12 rounded-2xl px-5 font-bold disabled:opacity-60"
          onClick={() => {
            setToken(null);
            setOpen(true);
          }}
          disabled={full}
        >
          {items.length ? "Criar outra chave" : "Ligar a Siri"}
        </button>
        {full ? (
          <p className="text-sm font-semibold text-muted">
            Limite de {MAX_ACTIVE_TOKENS} chaves. Desligue uma para criar outra.
          </p>
        ) : null}
      </div>

      {items.length ? (
        <ul className="glass divide-y divide-line overflow-hidden rounded-[1.4rem]" aria-label="Chaves ligadas">
          {items.map((t) => (
            <li key={t.id} className="grid gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{t.name}</span>
                  <span className="block truncate text-sm font-semibold text-muted">
                    •••• {t.last4} · {usedLabel(t.lastUsedAt)}
                  </span>
                </span>
                {asking === t.id ? null : (
                  <button
                    type="button"
                    className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                    onClick={() => setAsking(t.id)}
                  >
                    Desligar
                  </button>
                )}
              </div>
              {asking === t.id ? (
                <div className="grid gap-2" role="alertdialog" aria-label="Desligar a chave?">
                  <p className="text-sm font-semibold text-muted">
                    Desligar? Os Atalhos com essa chave param de responder na hora.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                      onClick={() => setAsking(null)}
                      disabled={revoking === t.id}
                      autoFocus
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
                      onClick={() => void revoke(t.id)}
                      disabled={revoking === t.id}
                      aria-busy={revoking === t.id}
                    >
                      {revoking === t.id ? "Desligando…" : "Desligar"}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Drawer.Content
            className={sheetClass(
              side,
              "fixed inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[520px] rounded-t-3xl pt-4 outline-none",
              "sheet z-50 flex flex-col",
            )}
          >
            <SidePanelClose />
            <div className={SHEET_SCROLL}>
              <Drawer.Title className="pt-2 text-center text-xl font-bold">Ligar a Siri</Drawer.Title>
              <Drawer.Description className="mt-1 text-center text-sm font-semibold text-muted">
                Uma chave só de leitura para os Atalhos do iPhone consultarem sua agenda.
              </Drawer.Description>

              {token ? (
                <div className="mt-4 grid gap-3">
                  <div className="glass grid gap-2 rounded-2xl px-4 py-3">
                    <p className="text-sm font-bold">Sua chave (aparece só agora)</p>
                    <code className="break-all rounded-xl bg-soft px-3 py-2 text-sm font-semibold">{token}</code>
                    <button
                      type="button"
                      className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-bold"
                      onClick={() => void copyText(token, "Chave")}
                    >
                      <Icon name="copy" size={18} /> Copiar chave
                    </button>
                  </div>
                  <ol className="grid list-decimal gap-1.5 pl-6 text-sm font-semibold">
                    <li>Abra o app Atalhos e crie um Atalho com o nome da frase (ex.: Agenda de hoje).</li>
                    <li>Ação &quot;Obter Conteúdo do URL&quot; com o endereço abaixo, método GET.</li>
                    <li>Em Cabeçalhos: Authorization = Bearer + espaço + a chave.</li>
                    <li>
                      Ação &quot;Obter Valor do Dicionário&quot;, chave fala. Depois &quot;Mostrar Resultado&quot;.
                    </li>
                  </ol>
                  <ul className="glass grid divide-y divide-line rounded-2xl">
                    {SHORTCUTS.map((s) => (
                      <li key={s.path} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold">{s.phrase}</span>
                          <span className="block truncate text-xs font-semibold text-muted">{baseUrl + s.path}</span>
                        </span>
                        <button
                          type="button"
                          className="btn-glass flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold"
                          onClick={() => void copyText(baseUrl + s.path, "Endereço")}
                          aria-label={`Copiar endereço de ${s.phrase}`}
                        >
                          <Icon name="copy" size={16} /> Copiar
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn-glass min-h-12 rounded-2xl px-5 font-bold"
                    onClick={() => setOpen(false)}
                  >
                    Pronto
                  </button>
                </div>
              ) : (
                <form
                  className="mt-4 grid gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!busy) void create();
                  }}
                >
                  <label htmlFor="tokenName" className="px-1 text-sm font-bold">
                    Nome do aparelho
                  </label>
                  <input
                    id="tokenName"
                    name="tokenName"
                    maxLength={40}
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-13 w-full rounded-2xl border px-4 text-base font-semibold"
                  />
                  <p className="px-1 text-sm font-semibold text-muted">
                    Quem tiver a chave consegue ouvir sua agenda. Não mande por mensagem nem poste print. Se vazar, é só
                    desligar.
                  </p>
                  <button
                    type="submit"
                    className="btn-tint min-h-12 rounded-2xl px-5 font-bold disabled:opacity-60"
                    disabled={busy || !name.trim()}
                    aria-busy={busy}
                  >
                    {busy ? "Criando…" : "Criar chave"}
                  </button>
                </form>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
