"use client";

import { Icon } from "@/components/ui/Icon";

/** Confirmação no rodapé quando o horário pega a pausa: escolher outro horário ou salvar mesmo assim. */
export function PauseConfirm({
  pause,
  confirmLabel = "Agendar mesmo assim",
  onConfirm,
  onPickAnother,
}: {
  /** Faixa da pausa, "12:00 às 13:00". */
  pause: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onPickAnother: () => void;
}) {
  return (
    <div role="alertdialog" aria-labelledby="pausa-titulo" aria-describedby="pausa-texto" className="grid gap-3">
      <div className="flex items-start gap-3 rounded-2xl bg-wait-bg px-4 py-3 text-wait">
        <Icon name="alert" size={20} />
        <div className="grid gap-0.5">
          <p id="pausa-titulo" className="font-bold">
            Vai pegar sua pausa
          </p>
          <p id="pausa-texto" className="text-sm font-semibold">
            Sua pausa é das {pause}. Quer manter mesmo assim?
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="btn-tint flex min-h-13 items-center justify-center rounded-full px-5 font-bold"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          // Foco no "outro horário": um toque sem querer não salva dentro da pausa
          autoFocus
          onClick={onPickAnother}
          className="btn-glass flex min-h-13 items-center justify-center rounded-full px-5 font-bold"
        >
          Escolher outro horário
        </button>
      </div>
    </div>
  );
}
