"use client";

import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { IconTile } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { emitLocationChanged } from "@/features/settings/live-events";
import { clearLocation, saveDeviceLocation } from "./actions";
import { currentPosition, locationGranted, placeOf } from "./device-location";
import { enableDeviceLocation } from "./enable-location";

type Source = "device" | "manual" | null;

/**
 * Ajustes > Notificações: interruptor da localização do celular (previsão do tempo e feriados da cidade dos avisos do
 * dia). Com a permissão já dada, abrir Ajustes atualiza a posição sozinha.
 */
export function LocationToggle(props: { city: string | null; state: string | null; source: Source }) {
  const [where, setWhere] = useState({ city: props.city, state: props.state, source: props.source });
  const { city, state } = where;
  const [locating, startLocating] = useTransition();

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
        if (res?.ok) {
          setWhere({ city: null, state: null, source: null });
          emitLocationChanged(false);
        } else notify.error(res ? res.code : "NETWORK");
        return;
      }
      const res = await enableDeviceLocation();
      if (!res.ok) {
        if (res.reason === "denied")
          notify.warning(
            "Localização bloqueada",
            "Libere a localização nos Ajustes do iPhone (Privacidade > Serviços de Localização).",
          );
        else if (res.reason === "unavailable")
          notify.problem("Não deu para achar a localização", "Tente de novo perto de uma janela.");
        else notify.error(res.code);
        return;
      }
      setWhere({ city: res.city, state: res.state, source: "device" });
      emitLocationChanged(true);
      notify.success(
        "Localização ligada",
        res.city ? `${res.city} — ${res.state ?? ""}` : "A previsão do tempo já entra nos avisos.",
      );
    });
  }

  return (
    <div className="glass flex items-center justify-between gap-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconTile name="map" tint="lavender" />
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
      </div>
      <Switch
        checked={where.source === "device"}
        onChange={toggleLocation}
        busy={locating}
        label="Usar a localização do celular"
      />
    </div>
  );
}
