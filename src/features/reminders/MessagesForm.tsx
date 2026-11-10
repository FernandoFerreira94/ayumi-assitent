"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import type { ActionResult } from "@/lib/errors";
import { saveMessages } from "./actions";
import type { MessageSettings } from "./core";
import {
  bookingText,
  DEFAULT_BOOKING,
  DEFAULT_REMINDER,
  DEFAULT_SECOND,
  reminderText,
  secondReminderText,
  TEMPLATE_MAX,
  type MessageData,
  type SalonMessageOpts,
} from "./text";

const CHIPS = [
  ["{nome}", "nome da cliente"],
  ["{servico}", "serviço"],
  ["{dia}", "hoje, amanhã ou a data"],
  ["{hora}", "horário"],
  ["{valor}", "valor do atendimento"],
  ["{salao}", "nome do salão"],
] as const;

const hoursInput = "min-h-11 w-20 rounded-xl border border-line px-3 text-center text-base font-bold tabular-nums";

// Prévia com um horário de exemplo: amanhã às 14:30, com um contato salvo do jeito que costuma vir no celular
const sampleNow = new Date();
const sampleStart = new Date(sampleNow.getTime() + 24 * 3600_000);
sampleStart.setUTCHours(17, 30, 0, 0);
const SAMPLE: MessageData = {
  client: "Maria Zona Norte",
  service: "Alongamento",
  startsAt: sampleStart,
  priceCents: 12000,
};

/**
 * Tudo o que o Mimo manda pelo WhatsApp num cartão só, porque uma mensagem puxa a outra: a de agendamento
 * confirmado, o 1º aviso (pede a confirmação) e o 2º aviso (só para quem não respondeu). O valor entra pela
 * chave {valor}: estando no texto, aparece; fora dele, não.
 */
export function MessagesForm({ settings, salonName }: { settings: MessageSettings; salonName: string }) {
  const [fullName, setFullName] = useState(settings.fullName);
  const [hours, setHours] = useState(String(settings.hours));
  const [second, setSecond] = useState(settings.secondHours !== null);
  const [secondHours, setSecondHours] = useState(String(settings.secondHours ?? 3));
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveMessages(prev, fd);
    if (res.ok) notify.success("Mensagens salvas");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok && state.code === "VALIDATION" ? state.field : undefined;
  const salon: SalonMessageOpts = { name: salonName, fullName };

  return (
    <form action={action} className="glass grid gap-5 rounded-[1.75rem] px-5 py-4">
      <div className="grid gap-1">
        <TileTitle as="h2" icon="chat" tint="green">
          Mensagens no WhatsApp
        </TileTitle>
        <p className="text-sm font-semibold text-muted">
          O Mimo manda a confirmação do agendamento e os avisos para a cliente confirmar o horário. Cancelar ou remarcar
          fica com você.
        </p>
      </div>
      <input type="hidden" name="fullName" value={fullName ? "1" : ""} />
      <input type="hidden" name="second" value={second ? "1" : ""} />

      <fieldset className="grid gap-2">
        <legend className="pb-2 font-bold">Como chamar a cliente</legend>
        <div
          className="grid grid-cols-2 gap-1 rounded-full bg-soft p-1"
          role="radiogroup"
          aria-label="Nome nas mensagens"
        >
          {(
            [
              [false, "Só o primeiro nome"],
              [true, "Nome do contato"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={fullName === value}
              onClick={() => setFullName(value)}
              className="min-h-11 rounded-full px-3 text-sm font-bold text-muted transition-colors aria-checked:bg-surface aria-checked:text-fg aria-checked:shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-muted">
          Contato salvo como “Maria Zona Norte”: a mensagem diz “Oi, {fullName ? "Maria Zona Norte" : "Maria"}!”.
        </p>
      </fieldset>

      <Step title="Ao agendar" hint="Sai assim que você cria o agendamento. Não pede resposta.">
        <TemplateField
          name="bookingTemplate"
          label="Texto do agendamento confirmado"
          initial={settings.bookingTemplate}
          fallback={DEFAULT_BOOKING}
          invalid={err === "bookingTemplate"}
          preview={(template) => bookingText(SAMPLE, sampleNow, { ...salon, template })}
        />
      </Step>

      <Step title="1º aviso" hint="Pede para a cliente confirmar o horário.">
        <HoursRow
          id="msg-hours"
          label="Horas antes do horário"
          value={hours}
          onChange={setHours}
          invalid={err === "hours"}
          name="hours"
        />
        <TemplateField
          name="reminderTemplate"
          label="Texto do 1º aviso"
          initial={settings.reminderTemplate}
          fallback={DEFAULT_REMINDER}
          invalid={err === "reminderTemplate"}
          preview={(template) => reminderText(SAMPLE, sampleNow, { ...salon, template })}
          note="As opções 1, 2 e 3 vão sempre no fim: é por elas que o app entende a resposta."
        />
      </Step>

      <Step
        title="2º aviso"
        hint="Só para quem não respondeu ao primeiro."
        aside={<Switch checked={second} onChange={setSecond} label="Enviar um segundo aviso" />}
      >
        {second ? (
          <HoursRow
            id="msg-second"
            label="Horas antes do horário"
            value={secondHours}
            onChange={setSecondHours}
            invalid={err === "secondHours"}
            name="secondHours"
          />
        ) : null}
        {/* Desligado, o texto continua guardado para quando ela ligar de novo */}
        <div hidden={!second}>
          <TemplateField
            name="secondTemplate"
            label="Texto do 2º aviso"
            initial={settings.secondTemplate}
            fallback={DEFAULT_SECOND}
            invalid={err === "secondTemplate"}
            preview={(template) => secondReminderText(SAMPLE, sampleNow, { ...salon, template })}
          />
        </div>
      </Step>

      {err ? (
        <p role="alert" className="text-sm font-semibold text-fail">
          {err === "secondHours"
            ? "O 2º aviso precisa ser mais perto do horário que o 1º (menos horas, entre 1 e 72)."
            : err === "hours"
              ? "Escolha entre 1 e 72 horas."
              : `Cada texto pode ter até ${TEMPLATE_MAX} caracteres.`}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Salvando…">Salvar mensagens</SubmitButton>
    </form>
  );
}

function Step({
  title,
  hint,
  aside,
  children,
}: {
  title: string;
  hint: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="grid gap-3 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm font-semibold text-muted">{hint}</p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function HoursRow(props: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={props.id} className="min-w-0 text-sm font-bold">
        {props.label}
      </label>
      <input
        id={props.id}
        name={props.name}
        type="number"
        inputMode="numeric"
        min={1}
        max={72}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={props.invalid}
        className={hoursInput}
      />
    </div>
  );
}

/** Campo de texto com as {chaves} em botões (entram onde está o cursor) e a prévia de como a cliente recebe. */
function TemplateField({
  name,
  label,
  initial,
  fallback,
  invalid,
  preview,
  note,
}: {
  name: string;
  label: string;
  initial: string | null;
  fallback: string;
  invalid: boolean;
  preview: (template: string) => string;
  note?: string;
}) {
  const [template, setTemplate] = useState(initial ?? fallback);
  const area = useRef<HTMLTextAreaElement>(null);

  function insert(token: string) {
    const el = area.current;
    if (!el) return setTemplate((t) => t + token);
    const { selectionStart: s, selectionEnd: e } = el;
    setTemplate(template.slice(0, s) + token + template.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  }

  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm font-bold">
        {label}
        <textarea
          ref={area}
          name={name}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
          maxLength={TEMPLATE_MAX}
          className="min-h-28 w-full resize-y rounded-3xl border px-5 py-3 text-base font-semibold leading-6"
          aria-invalid={invalid}
        />
      </label>
      <div className="flex flex-wrap gap-1.5" aria-label={`Inserir dados do horário em ${label.toLowerCase()}`}>
        {CHIPS.map(([token, hint]) => (
          <button
            key={token}
            type="button"
            onClick={() => insert(token)}
            title={hint}
            aria-label={`Inserir ${hint}`}
            className="min-h-11 rounded-full bg-soft px-3 text-xs font-bold text-primary-text"
          >
            {token}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTemplate(fallback)}
          className="min-h-11 rounded-full px-3 text-xs font-bold text-muted underline"
        >
          Voltar ao padrão
        </button>
      </div>
      <div className="grid gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Como a cliente recebe</p>
        <p
          className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-chat-out px-4 py-3 text-sm font-semibold leading-5"
          aria-live="polite"
        >
          {preview(template)}
        </p>
        {note ? <p className="text-xs font-semibold text-muted">{note}</p> : null}
      </div>
    </div>
  );
}
