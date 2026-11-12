"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { sendTestNotice, setGoodMorning } from "./actions";

/** Ajustes > Avisos do dia: o que chega e o botão de teste. A localização fica em Conexões (LocationToggle). */
export function DailyNoticesCard(props: { goodMorning: boolean }) {
  const [testing, start] = useTransition();
  const [morning, setMorning] = useState(props.goodMorning);
  const [saving, startSaving] = useTransition();
  function toggleMorning(next: boolean) {
    startSaving(async () => {
      const res = await setGoodMorning(next).catch(() => null);
      if (res?.ok) {
        setMorning(next);
        notify.success(next ? "Bom dia das 8h ligado" : "Bom dia das 8h desligado");
      } else notify.error(res ? res.code : "NETWORK", () => toggleMorning(next));
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
          Bom dia motivacional às 8h, resumo das clientes do dia com a previsão do tempo, folga, fim do expediente, roteiro da semana no domingo à
          noite e datas comemorativas. Chegam com o app fechado, na tela bloqueada.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">Bom dia às 8h</p>
          <p className="text-sm font-semibold text-muted">Uma mensagem motivacional todo dia, sem repetir.</p>
        </div>
        <Switch checked={morning} onChange={toggleMorning} busy={saving} label="Bom dia às 8h" />
      </div>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={test}
          disabled={testing}
          aria-busy={testing}
          className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold disabled:opacity-60"
        >
          {testing ? <span className="spin" aria-hidden="true" /> : <Icon name="bell" />}
          {testing ? "Enviando…" : "Enviar aviso de teste"}
        </button>
      </div>
    </div>
  );
}
