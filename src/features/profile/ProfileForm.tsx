"use client";

import { useActionState, useRef } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { saveProfile } from "./actions";
import { CATEGORIES, DEFAULT_CONFIRMATION, DEFAULT_REMINDER, MAX_TEMPLATE, VARIABLES } from "./templates";

export type Profile = {
  name: string;
  category: string | null;
  address: string | null;
  instagram: string | null;
  msgConfirmation: string | null;
  msgReminder: string | null;
};

const label = "grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted";
const field =
  "w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold normal-case tracking-normal text-fg outline-none focus:border-primary aria-invalid:border-fail";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await saveProfile(prev, fd);
    if (res.ok) notify.success("Perfil salvo");
    else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const badName = state && !state.ok && state.field === "name";
  const confirmRef = useRef<HTMLTextAreaElement>(null);
  const reminderRef = useRef<HTMLTextAreaElement>(null);
  const known = profile.category && !CATEGORIES.some((c) => c === profile.category);

  return (
    <form action={action} className="grid gap-4">
      <section className="glass grid gap-4 rounded-[1.75rem] p-5" aria-label="Dados do studio">
        <h2 className="font-bold">Seu studio</h2>
        <label className={label}>
          Nome do studio
          <input
            name="name"
            defaultValue={profile.name}
            required
            maxLength={80}
            aria-invalid={badName || undefined}
            className={`${field} min-h-12`}
          />
          {badName ? (
            <span role="alert" className="text-xs font-semibold normal-case tracking-normal text-fail">
              Informe o nome do studio.
            </span>
          ) : null}
        </label>
        <label className={label}>
          Tipo de serviço
          <select name="category" defaultValue={profile.category ?? ""} className={`${field} min-h-12`}>
            <option value="">Escolha…</option>
            {known ? <option>{profile.category}</option> : null}
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Endereço
          <input
            name="address"
            defaultValue={profile.address ?? ""}
            maxLength={200}
            autoComplete="street-address"
            className={`${field} min-h-12`}
          />
        </label>
        <label className={label}>
          Instagram
          <input
            name="instagram"
            defaultValue={profile.instagram ?? ""}
            maxLength={60}
            placeholder="@seustudio"
            className={`${field} min-h-12`}
          />
        </label>
      </section>

      <section className="glass grid gap-4 rounded-[1.75rem] p-5" aria-label="Mensagens para clientes">
        <div>
          <h2 className="font-bold">Mensagens para clientes</h2>
          <p className="mt-1 text-xs font-semibold text-muted">
            Toque numa variável para colocar no texto. Deixe vazio para usar o texto padrão.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-label={`Inserir ${v.label}`}
              className="min-h-9 rounded-full border border-line bg-surface px-3 text-sm font-bold"
              onClick={() => {
                // Insere na caixa que estiver com foco; sem foco, na de confirmação
                const el = document.activeElement === reminderRef.current ? reminderRef.current : confirmRef.current;
                if (!el) return;
                const at = el.selectionStart ?? el.value.length;
                el.setRangeText(v.key, at, el.selectionEnd ?? at, "end");
                el.focus();
              }}
            >
              {v.key}
            </button>
          ))}
        </div>
        <label className={label}>
          Ao confirmar o agendamento
          <textarea
            ref={confirmRef}
            name="msgConfirmation"
            rows={4}
            maxLength={MAX_TEMPLATE}
            defaultValue={profile.msgConfirmation ?? ""}
            placeholder={DEFAULT_CONFIRMATION}
            className={`${field} min-h-28 py-3`}
          />
        </label>
        <label className={label}>
          Lembrete (24h antes)
          <textarea
            ref={reminderRef}
            name="msgReminder"
            rows={4}
            maxLength={MAX_TEMPLATE}
            defaultValue={profile.msgReminder ?? ""}
            placeholder={DEFAULT_REMINDER}
            className={`${field} min-h-28 py-3`}
          />
        </label>
      </section>

      <SubmitButton pendingLabel="Salvando…" className="btn-primary min-h-12 rounded-full px-6 font-bold">
        Salvar perfil
      </SubmitButton>
    </form>
  );
}
