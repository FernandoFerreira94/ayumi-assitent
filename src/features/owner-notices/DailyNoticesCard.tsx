"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import type { ActionResult } from "@/lib/errors";
import { clearLocation, saveDeviceLocation, saveLocation, sendTestNotice } from "./actions";
import { currentPosition, locationGranted, placeOf } from "./device-location";
import { UF_NAMES } from "./weather";

type Source = "device" | "manual" | null;

/**
 * Ajustes > Avisos do dia: a localização do celular (previsão do tempo e feriados da cidade), com a cidade
 * digitada como alternativa, e o botão que manda agora um aviso de teste para ver na tela bloqueada.
 */
export function DailyNoticesCard(props: { city: string | null; state: string | null; source: Source }) {
  const [where, setWhere] = useState({ city: props.city, state: props.state, source: props.source });
  const { city, state } = where;
  const [locating, startLocating] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [testing, start] = useTransition();
  const [form, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveLocation(prev, fd);
    if (res.ok) {
      setWhere({ city: String(fd.get("city") ?? ""), state: String(fd.get("state") ?? ""), source: "manual" });
      notify.success("Cidade salva", "A previsão do tempo e os feriados da cidade entram nos avisos.");
      ref.current?.close();
    } else if (res.code !== "VALIDATION" && res.code !== "CITY_NOT_FOUND") notify.error(res.code);
    return res;
  }, null);
  const cityError = form && !form.ok && (form.code === "CITY_NOT_FOUND" || form.field === "city");
  const ufError = form && !form.ok && form.field === "state";

  // Com a localização ligada, abrir Ajustes atualiza a posição sem perguntar de novo (o salão pode ter mudado)
  useEffect(() => {
    if (props.source !== "device") return;
    let alive = true;
    void (async () => {
      if (!(await locationGranted())) return;
      const pos = await currentPosition().catch(() => null);
      if (!pos || !alive) return;
      const place = await placeOf(pos.coords.latitude, pos.coords.longitude);
      const res = await saveDeviceLocation(place).catch(() => null);
      if (alive && res?.ok) setWhere({ ...res.data, source: "device" });
    })();
    return () => {
      alive = false;
    };
  }, [props.source]);

  function toggleLocation(on: boolean) {
    startLocating(async () => {
      if (!on) {
        const res = await clearLocation().catch(() => null);
        if (res?.ok) setWhere({ city: null, state: null, source: null });
        else notify.error(res ? res.code : "NETWORK");
        return;
      }
      const pos = await currentPosition().catch((e: GeolocationPositionError | Error) => e);
      if (!("coords" in pos)) {
        if ("code" in pos && pos.code === 1)
          notify.problem(
            "Localização bloqueada",
            "Libere a localização nos Ajustes do iPhone (Privacidade > Serviços de Localização) ou digite a cidade.",
          );
        else
          notify.problem("Não deu para achar a localização", "Tente de novo perto de uma janela ou digite a cidade.");
        return;
      }
      const place = await placeOf(pos.coords.latitude, pos.coords.longitude);
      const res = await saveDeviceLocation(place).catch(() => null);
      if (!res?.ok) {
        notify.error(res ? res.code : "NETWORK");
        return;
      }
      setWhere({ ...res.data, source: "device" });
      notify.success(
        "Localização ligada",
        res.data.city ? `${res.data.city} – ${res.data.state ?? ""}` : "A previsão do tempo já entra nos avisos.",
      );
    });
  }

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
      <div className="grid gap-2 rounded-2xl bg-white/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">Usar a localização do celular</p>
            <p className="text-sm font-semibold text-muted">
              {where.source === "device"
                ? city
                  ? `${city}${state ? ` – ${state}` : ""} · atualiza sozinha`
                  : "Ligada · atualiza sozinha"
                : where.source === "manual" && city
                  ? `Cidade digitada: ${city} – ${state}`
                  : "Para a previsão do tempo e os feriados da cidade"}
            </p>
          </div>
          <Switch
            checked={where.source === "device"}
            onChange={toggleLocation}
            busy={locating}
            label="Usar a localização do celular"
          />
        </div>
        {where.source !== "device" ? (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              setOpened(true);
              ref.current?.showModal();
            }}
            className="justify-self-start text-sm font-bold text-[var(--color-accent,#7A5CFF)] underline-offset-2 hover:underline"
          >
            {where.source === "manual" ? "Alterar a cidade" : "Prefiro digitar a cidade"}
          </button>
        ) : null}
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
