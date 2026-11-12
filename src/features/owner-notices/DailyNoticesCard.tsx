"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { sendTestNotice } from "./actions";

/** Ajustes > Avisos do dia: o que chega e o botão de teste. A localização fica em Conexões (LocationToggle). */
export function DailyNoticesCard() {
  const [testing, start] = useTransition();
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
          Bom dia 2 horas antes da primeira cliente, com quantas clientes você tem, o primeiro horário e a previsão do tempo.
          No fim do expediente, o resumo de hoje e de amanhã. Também o roteiro da semana no domingo à noite e as datas comemorativas. Chegam com o app fechado, na tela bloqueada.
        </p>
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
