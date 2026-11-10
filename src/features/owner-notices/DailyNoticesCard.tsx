"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { TileTitle } from "@/components/ui/Icon";
import type { ActionResult } from "@/lib/errors";
import { saveLocation, sendTestNotice } from "./actions";
import { UF_NAMES } from "./weather";

/**
 * Ajustes > Avisos do dia: a cidade do salão (previsão do tempo e feriados locais) e o botão que manda agora um
 * aviso de teste para ver como ele chega na tela bloqueada.
 */
export function DailyNoticesCard({ city, state }: { city: string | null; state: string | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [testing, start] = useTransition();
  const [form, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveLocation(prev, fd);
    if (res.ok) {
      notify.success("Cidade salva", "A previsão do tempo e os feriados da cidade entram nos avisos.");
      ref.current?.close();
    } else if (res.code !== "VALIDATION" && res.code !== "CITY_NOT_FOUND") notify.error(res.code);
    return res;
  }, null);
  const cityError = form && !form.ok && (form.code === "CITY_NOT_FOUND" || form.field === "city");
  const ufError = form && !form.ok && form.field === "state";

  function test() {
    start(async () => {
      const res = await sendTestNotice().catch(() => null);
      if (res?.ok)
        notify.success(
          "Aviso de teste enviado",
          "Bloqueie a tela do iPhone: ele chega em alguns segundos, como os avisos de verdade.",
        );
      else notify.error(res ? res.code : "NETWORK", test);
    });
  }

  return (
    <div className="glass grid gap-4 rounded-[1.75rem] px-5 py-4">
      <div>
        <TileTitle as="h2" icon="bell" tint="lavender">
          Avisos do dia
        </TileTitle>
        <p className="text-sm font-semibold text-muted">
          Bom dia com as clientes do dia e a previsão do tempo, folga, fim do expediente, roteiro da semana no domingo à
          noite e datas comemorativas. Chegam com o app fechado, na tela bloqueada.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Cidade do salão</p>
          <p className="truncate font-bold">{city && state ? `${city} – ${state}` : "Não informada"}</p>
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setOpened(true);
            ref.current?.showModal();
          }}
          className="btn-glass min-h-11 shrink-0 rounded-full px-4 text-sm font-bold"
        >
          {city ? "Alterar" : "Informar"}
        </button>
      </div>
      <button
        type="button"
        onClick={test}
        disabled={testing}
        aria-busy={testing}
        className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
      >
        {testing ? <span className="spin" aria-hidden="true" /> : null}
        {testing ? "Enviando…" : "Enviar aviso de teste"}
      </button>

      <dialog
        ref={ref}
        aria-label="Cidade do salão"
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
        className="notif-dialog"
      >
        <div className="status-fill" aria-hidden="true" />
        {opened ? (
          <form action={action} className="notif-panel grid w-[min(92vw,400px)] gap-4 rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Cidade do salão</h2>
                <p className="text-sm font-semibold text-muted">Para a previsão do tempo e os feriados da cidade.</p>
              </div>
              <button
                type="button"
                onClick={() => ref.current?.close()}
                aria-label="Fechar"
                className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-[1fr_6.5rem] gap-3">
              <label className="grid gap-1 text-sm font-bold">
                Cidade
                <input
                  name="city"
                  defaultValue={city ?? ""}
                  autoComplete="address-level2"
                  maxLength={60}
                  aria-invalid={cityError || undefined}
                  className="min-h-12 w-full rounded-full border px-5 text-base font-semibold"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                UF
                <select
                  name="state"
                  defaultValue={state ?? ""}
                  aria-invalid={ufError || undefined}
                  className="min-h-12 w-full rounded-full border px-4 text-base font-semibold"
                >
                  <option value="" disabled>
                    UF
                  </option>
                  {Object.keys(UF_NAMES).map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {cityError || ufError ? (
              <p role="alert" className="text-sm font-semibold text-fail">
                {form?.ok === false && form.code === "CITY_NOT_FOUND"
                  ? "Não encontramos essa cidade. Confira o nome e a UF."
                  : "Informe a cidade e escolha a UF."}
              </p>
            ) : null}
            <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
