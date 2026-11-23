"use client";

import { useActionState, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, SHEET_SCROLL, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { messageFor, type ActionResult } from "@/lib/errors";
import { cepDigits, formatAddress, mapsUrl, maskCep, UFS, type StudioAddress } from "./address";
import { lookupCep, saveAddress } from "./address-actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";

const FIELD_ERRORS: Record<string, string> = {
  cep: "Digite o CEP com 8 números.",
  street: "Informe a rua.",
  number: "Informe o número (ou s/n).",
  district: "Informe o bairro.",
  city: "Informe a cidade.",
  state: "Escolha a UF.",
};

/**
 * Ajustes > Endereço: mostra o endereço do estúdio e abre um sheet para cadastrar/editar com busca de CEP.
 * Vai no convite que a cliente salva na agenda, no evento do Google e nas mensagens ({endereco} e {mapa}).
 */
export function AddressCard({ initial }: { initial: StudioAddress }) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(initial);
  const [f, setF] = useState(initial);
  const [cepState, setCepState] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [cepError, setCepError] = useState("");
  const numberRef = useRef<HTMLInputElement>(null);
  const lastCep = useRef(cepDigits(initial.cep));
  const line = formatAddress(saved);

  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveAddress(prev, fd);
    if (res.ok) {
      notify.success("Endereço salvo");
      setSaved(f);
      setOpen(false);
    } else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok && state.code === "VALIDATION" ? state.field : undefined;

  const set = (k: keyof StudioAddress, v: string) => setF((cur) => ({ ...cur, [k]: v }));

  async function onCep(value: string) {
    const masked = maskCep(value);
    set("cep", masked);
    const d = cepDigits(masked);
    if (d.length !== 8 || d === lastCep.current) return;
    lastCep.current = d;
    setCepState("loading");
    setCepError("");
    const res = await lookupCep(d);
    if (cepDigits(masked) !== lastCep.current) return;
    if (!res.ok) {
      setCepState("error");
      setCepError(messageFor(res.code));
      return;
    }
    setCepState("found");
    setF((cur) => ({
      ...cur,
      cep: maskCep(res.data.cep),
      street: res.data.street || cur.street,
      district: res.data.district || cur.district,
      city: res.data.city || cur.city,
      state: res.data.state || cur.state,
    }));
    // CEP de cidade pequena vem sem rua: aí o foco fica na rua
    if (res.data.street) requestAnimationFrame(() => numberRef.current?.focus());
  }

  function openSheet(v: boolean) {
    if (v) {
      setF(saved);
      lastCep.current = cepDigits(saved.cep);
      setCepState("idle");
      setCepError("");
    }
    setOpen(v);
  }

  return (
    <div className="glass grid gap-4 rounded-[1.75rem] px-5 py-4">
      <div className="grid gap-1">
        <TileTitle as="h2" icon="map" tint="pink">
          Endereço do estúdio
        </TileTitle>
        <p className="text-sm font-semibold text-muted">
          Vai no horário que a cliente salva na agenda dela (iPhone e Google) e pode entrar nas mensagens do WhatsApp
          com {"{endereco}"} e {"{mapa}"}.
        </p>
      </div>

      {line ? (
        <div className="grid gap-2 rounded-2xl bg-soft px-4 py-3">
          <p className="text-base font-bold leading-6">{line}</p>
          <a
            href={mapsUrl(line)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary-text"
          >
            <Icon name="external" size={16} />
            Ver no mapa
          </a>
        </div>
      ) : (
        <p className="rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait">
          Nenhum endereço cadastrado ainda. Sem ele, a cliente não vê onde fica o estúdio no convite.
        </p>
      )}

      <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={openSheet}>
        <Drawer.Trigger className="btn-tint min-h-12 w-full rounded-full px-4 text-base font-bold">
          {line ? "Editar endereço" : "Cadastrar endereço"}
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Drawer.Content
            className={sheetClass(
              side,
              "fixed inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-[520px] flex-col rounded-t-3xl pt-4 outline-none",
              "sheet z-50 flex flex-col",
            )}
          >
            <SidePanelClose />
            <div className="px-5 md:px-0">
              <Drawer.Title className="pb-1 text-xl font-bold">Endereço do estúdio</Drawer.Title>
              <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
                Digite o CEP que o resto vem sozinho. Depois é só pôr o número.
              </Drawer.Description>
            </div>
            <form action={action} className={SHEET_SCROLL} noValidate>
              <div className="grid gap-3">
                <label className="grid gap-1 text-sm font-bold">
                  CEP
                  <input
                    name="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={f.cep}
                    onChange={(e) => onCep(e.target.value)}
                    maxLength={9}
                    className={input}
                    aria-invalid={err === "cep" || cepState === "error"}
                    aria-describedby="cep-status"
                  />
                </label>
                <p id="cep-status" aria-live="polite" className="min-h-5 text-sm font-semibold text-muted">
                  {cepState === "loading"
                    ? "Buscando o CEP…"
                    : cepState === "found"
                      ? "Endereço encontrado. Confira e ponha o número."
                      : cepState === "error"
                        ? cepError
                        : ""}
                </p>
                <label className="grid gap-1 text-sm font-bold">
                  Rua
                  <input
                    name="street"
                    autoComplete="address-line1"
                    value={f.street}
                    onChange={(e) => set("street", e.target.value)}
                    maxLength={120}
                    className={input}
                    aria-invalid={err === "street"}
                  />
                </label>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
                  <label className="grid gap-1 text-sm font-bold">
                    Número
                    <input
                      ref={numberRef}
                      name="number"
                      inputMode="text"
                      placeholder="430 ou s/n"
                      value={f.number}
                      onChange={(e) => set("number", e.target.value)}
                      maxLength={10}
                      className={input}
                      aria-invalid={err === "number"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold">
                    Complemento
                    <input
                      name="complement"
                      autoComplete="address-line2"
                      placeholder="Sala 2 (opcional)"
                      value={f.complement}
                      onChange={(e) => set("complement", e.target.value)}
                      maxLength={60}
                      className={input}
                    />
                  </label>
                </div>
                <label className="grid gap-1 text-sm font-bold">
                  Bairro
                  <input
                    name="district"
                    value={f.district}
                    onChange={(e) => set("district", e.target.value)}
                    maxLength={80}
                    className={input}
                    aria-invalid={err === "district"}
                  />
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
                  <label className="grid gap-1 text-sm font-bold">
                    Cidade
                    <input
                      name="city"
                      autoComplete="address-level2"
                      value={f.city}
                      onChange={(e) => set("city", e.target.value)}
                      maxLength={80}
                      className={input}
                      aria-invalid={err === "city"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold">
                    UF
                    <select
                      name="state"
                      value={f.state}
                      onChange={(e) => set("state", e.target.value)}
                      className={input}
                      aria-invalid={err === "state"}
                    >
                      <option value="">–</option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {err ? (
                  <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                    {FIELD_ERRORS[err] ?? messageFor("VALIDATION")}
                  </p>
                ) : null}
                <SubmitButton pendingLabel="Salvando…">Salvar endereço</SubmitButton>
              </div>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
