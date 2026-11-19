"use client";

import { startTransition, useActionState, useState, type ReactNode } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import type { ActionResult } from "@/lib/errors";
import { saveWalletSettingsAction } from "./actions";
import type { WalletSettings } from "./core";

// 16px: abaixo disso o iPhone dá zoom ao tocar no campo
const sel = "min-h-11 rounded-full border border-line bg-white px-3 text-base font-semibold";
const DEPOSIT = [10, 20, 30, 40, 50, 100];
const NOTICE = [0, 2, 6, 12, 24, 48, 72];
const VALIDITY = [30, 60, 90, 120, 180, 365];

/** Mantém a opção salva na lista mesmo se não for uma das sugeridas. */
const withSaved = (list: number[], v: number) => (list.includes(v) ? list : [...list, v].sort((a, b) => a - b));
const hoursLabel = (h: number) => (h === 0 ? "qualquer antecedência" : h === 1 ? "1 hora" : `${h} horas`);

/**
 * Ajustes > Pagamentos. Uma decisão por linha, com a frase pronta do que acontece. Tudo já vem com o padrão
 * aprovado (sinal 30%, 24 h, sinal fica em falta e em cima da hora, pacote 90 dias); a dona só muda se quiser.
 */
export function WalletSettingsForm({ settings }: { settings: WalletSettings }) {
  const [lateKeeps, setLateKeeps] = useState(settings.lateCancelKeepsDeposit);
  const [noShowKeeps, setNoShowKeeps] = useState(settings.noShowKeepsDeposit);
  const [noShowSession, setNoShowSession] = useState(settings.noShowUsesSession);
  const [notice, setNotice] = useState(settings.cancelNoticeHours);
  const [state, action, pending] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveWalletSettingsAction(prev, fd);
    if (res.ok) notify.success("Pagamentos salvos");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const bad = state && !state.ok && state.code === "VALIDATION" ? state.field : null;

  return (
    <form
      // Sem <form action>: o React reseta o formulário depois da ação e os selects voltavam ao valor antigo
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => action(new FormData(e.currentTarget)));
      }}
      className="grid gap-3"
    >
      <Card icon="coins" tint="green" title="Sinal">
        <Row
          label="Sinal sugerido"
          hint="O sinal é opcional. Quando você escolher Sinal ao agendar, o app já preenche esse valor."
          control={
            <select
              name="depositPct"
              aria-label="Sinal sugerido"
              defaultValue={settings.depositPct}
              className={sel}
              aria-invalid={bad === "depositPct"}
            >
              {withSaved(DEPOSIT, settings.depositPct).map((p) => (
                <option key={p} value={p}>
                  {p === 100 ? "Valor todo" : `${p}%`}
                </option>
              ))}
            </select>
          }
        />
      </Card>

      <Card icon="reschedule" tint="orange" title="Cancelamento e falta">
        <Row
          label="Antecedência para virar crédito"
          hint={`Cancelou com ${hoursLabel(notice)} ou mais: o valor pago vira crédito da cliente para o próximo horário.`}
          control={
            <select
              name="cancelNoticeHours"
              aria-label="Antecedência para virar crédito"
              value={notice}
              onChange={(e) => setNotice(Number(e.target.value))}
              className={sel}
              aria-invalid={bad === "cancelNoticeHours"}
            >
              {withSaved(NOTICE, settings.cancelNoticeHours).map((h) => (
                <option key={h} value={h}>
                  {h === 0 ? "Sempre" : `${h}h`}
                </option>
              ))}
            </select>
          }
        />
        <Toggle
          name="lateCancelKeepsDeposit"
          checked={lateKeeps}
          onChange={setLateKeeps}
          label="Em cima da hora, o sinal fica para o salão"
          hint={
            lateKeeps ? "O resto do que foi pago vira crédito." : "Mesmo em cima da hora, tudo vira crédito da cliente."
          }
        />
        <Toggle
          name="noShowKeepsDeposit"
          checked={noShowKeeps}
          onChange={setNoShowKeeps}
          label="Faltou, o sinal fica para o salão"
          hint={noShowKeeps ? "O resto do que foi pago vira crédito." : "Tudo que foi pago vira crédito da cliente."}
        />
        <Toggle
          name="noShowUsesSession"
          checked={noShowSession}
          onChange={setNoShowSession}
          label="Faltou, a sessão do pacote conta como usada"
          hint={noShowSession ? "Quem tem pacote perde a sessão do horário." : "A sessão volta para o pacote da cliente."}
        />
        <p className="text-sm font-semibold text-muted">
          Remarcar nunca perde nada: o que foi pago acompanha o horário novo.
        </p>
      </Card>

      <Card icon="ticket" tint="lavender" title="Pacotes">
        <Row
          label="Validade padrão"
          hint="Vale para pacotes novos e aparece para a cliente na venda. Crédito em dinheiro não vence."
          control={
            <select
              name="packageValidDays"
              aria-label="Validade padrão dos pacotes"
              defaultValue={settings.packageValidDays}
              className={sel}
              aria-invalid={bad === "packageValidDays"}
            >
              {withSaved(VALIDITY, settings.packageValidDays).map((d) => (
                <option key={d} value={d}>
                  {d} dias
                </option>
              ))}
            </select>
          }
        />
      </Card>

      <Card icon="wallet" tint="teal" title="Pix">
        <label htmlFor="pix-key" className="grid gap-1.5">
          <span className="text-sm font-bold">Chave Pix do salão</span>
          <input
            id="pix-key"
            name="pixKey"
            defaultValue={settings.pixKey ?? ""}
            maxLength={140}
            autoComplete="off"
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            aria-invalid={bad === "pixKey"}
            className="min-h-12 rounded-2xl border border-line bg-white px-4 text-base"
          />
          <span className="text-sm font-semibold text-muted">
            Opcional. Com ela, a mensagem de agendamento pode pedir o sinal no Pix.
          </span>
        </label>
      </Card>

      {bad ? (
        <p role="alert" className="text-sm font-semibold text-primary-text">
          Confira o campo destacado.
        </p>
      ) : null}
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        Salvar pagamentos
      </SubmitButton>
    </form>
  );
}

function Card({
  icon,
  tint,
  title,
  children,
}: {
  icon: Parameters<typeof TileTitle>[0]["icon"];
  tint: Parameters<typeof TileTitle>[0]["tint"];
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="glass grid gap-4 rounded-[1.75rem] p-5">
      <TileTitle as="h2" icon={icon} tint={tint}>
        {title}
      </TileTitle>
      {children}
    </div>
  );
}

function Row({ label, hint, control }: { label: string; hint: string; control: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-bold">{label}</span>
        {control}
      </div>
      <p className="text-sm font-semibold text-muted">{hint}</p>
    </div>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="grid gap-1.5 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-bold">{label}</span>
        <Switch checked={checked} onChange={onChange} label={label} />
        {checked ? <input type="hidden" name={name} value="on" /> : null}
      </div>
      <p className="text-sm font-semibold text-muted">{hint}</p>
    </div>
  );
}
