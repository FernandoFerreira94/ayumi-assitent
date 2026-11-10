"use client";

import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { clearLocation, saveDeviceLocation, scheduleTestNotice, sendTestNotice } from "./actions";
import { currentPosition, locationGranted, placeOf } from "./device-location";

type Source = "device" | "manual" | null;

/**
 * Ajustes > Avisos do dia: a localização do celular (previsão do tempo e feriados da cidade) e os botões de
 * teste: um que manda agora e outro que agenda para daqui 2 minutos, dando tempo de bloquear a tela do iPhone.
 */
export function DailyNoticesCard(props: { city: string | null; state: string | null; source: Source }) {
  const [where, setWhere] = useState({ city: props.city, state: props.state, source: props.source });
  const { city, state } = where;
  const [locating, startLocating] = useTransition();
  const [testing, start] = useTransition();
  const [scheduling, startScheduling] = useTransition();
  // Hora (ms) em que o aviso agendado sai; null = nada agendado
  const [dueAt, setDueAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);

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

  // Contagem regressiva do aviso agendado
  useEffect(() => {
    if (dueAt === null) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((dueAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        setDueAt(null);
        notify.success("Aviso de teste enviado", "Deve estar na tela do iPhone agora.");
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [dueAt]);

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
            "Libere a localização nos Ajustes do iPhone (Privacidade > Serviços de Localização).",
          );
        else notify.problem("Não deu para achar a localização", "Tente de novo perto de uma janela.");
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
        res.data.city ? `${res.data.city} — ${res.data.state ?? ""}` : "A previsão do tempo já entra nos avisos.",
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

  function schedule() {
    startScheduling(async () => {
      const res = await scheduleTestNotice().catch(() => null);
      if (res?.ok) {
        setDueAt(res.data.at);
        notify.success("Aviso agendado", "Bloqueie a tela do iPhone: o aviso chega em 2 minutos.");
      } else notify.error(res ? res.code : "NETWORK", schedule);
    });
  }

  const mm = String(Math.floor(left / 60));
  const ss = String(left % 60).padStart(2, "0");
  const waiting = dueAt !== null;

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
          <p className="font-bold">Usar a localização do celular</p>
          <p className="text-sm font-semibold text-muted">
            {where.source === "device"
              ? city
                ? `${city}${state ? ` — ${state}` : ""} · atualiza sozinha`
                : "Ligada · atualiza sozinha"
              : where.source === "manual" && city
                ? `Cidade antiga: ${city} — ${state}. Ligue para usar a do celular`
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
      <div className="grid gap-2">
        <button
          type="button"
          onClick={schedule}
          disabled={scheduling || waiting}
          aria-busy={scheduling}
          className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
        >
          {scheduling ? <span className="spin" aria-hidden="true" /> : <Icon name="bell" />}
          {scheduling ? "Agendando…" : waiting ? `Chega em ${mm}:${ss}` : "Enviar aviso de teste em 2 minutos"}
        </button>
        {waiting ? (
          <p role="status" className="text-center text-sm font-semibold text-muted">
            Pode bloquear a tela do iPhone. O aviso sai do servidor, mesmo com o app fechado.
          </p>
        ) : null}
        <button
          type="button"
          onClick={test}
          disabled={testing}
          aria-busy={testing}
          className="justify-self-center text-sm font-bold text-[var(--color-accent,#7A5CFF)] underline-offset-2 hover:underline disabled:opacity-60"
        >
          {testing ? "Enviando…" : "Enviar agora"}
        </button>
      </div>
    </div>
  );
}
