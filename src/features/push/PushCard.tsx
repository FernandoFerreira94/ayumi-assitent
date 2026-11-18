"use client";

import { TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";

/** Cartão de Ajustes > Notificação (mesmo visual no navegador e no app da loja). */
export function PushCard(p: {
  hint: string;
  showSwitch: boolean;
  checked: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <TileTitle as="h2" icon="phone" tint="pink">
            Notificação
          </TileTitle>
          <p className="text-sm font-semibold text-muted">{p.hint}</p>
        </div>
        {p.showSwitch && (
          <Switch
            checked={p.checked}
            onChange={p.onChange}
            busy={p.busy}
            disabled={p.disabled}
            label="Notificação neste aparelho"
          />
        )}
      </div>
    </div>
  );
}
