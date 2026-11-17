"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Drawer } from "vaul";
import { notify } from "@/components/feedback/toast";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";
import { ERROR_MESSAGES, type ErrorCode } from "@/lib/errors";
import {
  addProfessional,
  cancelInvite,
  inviteMember,
  reactivateProfessional,
  removeProfessional,
  renameProfessional,
  type InviteLink,
} from "./actions";

export type TeamMember = {
  id: string;
  name: string;
  active: boolean;
  /** owner = a dona; login = já entra no app; null = ainda sem acesso */
  access: "owner" | "login" | null;
  invitedUntil: string | null;
  inviteId: string | null;
};

type Sheet = { kind: "new" } | { kind: "pro"; id: string } | { kind: "admin" };

const field =
  "min-h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold text-fg outline-none focus:border-primary aria-invalid:border-fail";
const primary = "btn-tint flex min-h-12 w-full items-center justify-center gap-2 rounded-full font-bold disabled:opacity-60";
const quiet = "flex min-h-11 w-full items-center justify-center rounded-full bg-soft px-4 font-bold text-primary-text disabled:opacity-60";

const day = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** Lista da equipe: criar, renomear, convidar para o app, desativar e reativar. */
export function TeamList({
  team,
  adminInvites,
  admins,
  canInviteAdmin,
}: {
  team: TeamMember[];
  adminInvites: { id: string; expiresAt: string }[];
  admins: number;
  canInviteAdmin: boolean;
}) {
  const router = useRouter();
  const side = useSheetSide();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  const show = (s: Sheet) => {
    setSheet(s);
    setKey((k) => k + 1);
    setOpen(true);
  };
  const done = () => {
    setOpen(false);
    router.refresh();
  };

  const current = sheet?.kind === "pro" ? team.find((t) => t.id === sheet.id) : undefined;
  const actives = team.filter((t) => t.active);
  const title = sheet?.kind === "new" ? "Nova profissional" : sheet?.kind === "admin" ? "Convidar gerente" : (current?.name ?? "Profissional");

  return (
    <>
      <div className="grid gap-3">
        <button type="button" onClick={() => show({ kind: "new" })} className={primary}>
          <Icon name="plus" size={18} />
          Adicionar profissional
        </button>
        <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
          {team.map((t) => (
            <li key={t.id} className="border-t border-line first:border-t-0">
              <button
                type="button"
                onClick={() => show({ kind: "pro", id: t.id })}
                className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left ${t.active ? "" : "opacity-55"}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft font-bold text-primary-text" aria-hidden="true">
                  {t.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{t.name}</b>
                  <span className="block truncate text-sm font-semibold text-muted">
                    {!t.active
                      ? "Desativada"
                      : t.access === "owner"
                        ? "Dona do salão"
                        : t.access === "login"
                          ? "Entra no app"
                          : t.invitedUntil
                            ? `Convite até ${day(t.invitedUntil)}`
                            : "Sem acesso ao app"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {canInviteAdmin ? (
          <section className="grid gap-2 rounded-2xl border border-line bg-surface p-4" aria-label="Gerentes">
            <p className="font-bold">Gerentes</p>
            <p className="text-sm font-semibold text-muted">
              {admins === 0 ? "Nenhuma gerente ainda." : admins === 1 ? "1 gerente com acesso." : `${admins} gerentes com acesso.`}{" "}
              A gerente vê e edita a agenda de todas, mas não mexe em plano nem exclui o salão.
            </p>
            {adminInvites.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 text-sm font-semibold">
                <span>Convite pendente até {day(i.expiresAt)}</span>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-3 font-bold text-fail"
                  onClick={async () => {
                    const res = await cancelInvite(i.id);
                    if (!res.ok) return notify.error(res.code);
                    router.refresh();
                  }}
                >
                  Cancelar
                </button>
              </div>
            ))}
            <button type="button" onClick={() => show({ kind: "admin" })} className={quiet}>
              Convidar gerente
            </button>
          </section>
        ) : null}
      </div>

      <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Drawer.Content
            className={sheetClass(
              side,
              "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none",
              "sheet z-50",
            )}
          >
            <SidePanelClose />
            <Drawer.Handle className="mb-3 md:hidden" />
            <Drawer.Title className="pb-1 text-xl font-bold">{title}</Drawer.Title>
            <Drawer.Description className="sr-only">Equipe do salão</Drawer.Description>
            {sheet?.kind === "new" ? <NewForm key={key} onDone={done} /> : null}
            {sheet?.kind === "admin" ? <InvitePanel key={key} target={{ role: "admin" }} onChanged={() => router.refresh()} /> : null}
            {sheet?.kind === "pro" && current ? (
              <ProSheet key={key} pro={current} others={actives.filter((a) => a.id !== current.id)} onDone={done} onChanged={() => router.refresh()} />
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

function NameForm({ initial, label, onSubmit }: { initial: string; label: string; onSubmit: (name: string) => Promise<ErrorCode | null> }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-3 pb-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setError("Informe o nome.");
        setBusy(true);
        const code = await onSubmit(name);
        setBusy(false);
        setError(code ? (code === "VALIDATION" ? "Informe o nome." : ERROR_MESSAGES[code]) : null);
      }}
    >
      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        Nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          className={`${field} normal-case tracking-normal`}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-fail">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className={primary}>
        {busy ? "Salvando…" : label}
      </button>
    </form>
  );
}

function NewForm({ onDone }: { onDone: () => void }) {
  return (
    <NameForm
      initial=""
      label="Adicionar"
      onSubmit={async (name) => {
        const res = await addProfessional({ name });
        if (!res.ok) return res.code;
        notify.success("Profissional adicionada", "Agora você pode convidá-la para o app");
        onDone();
        return null;
      }}
    />
  );
}

type Plan = { kind: "none" } | { kind: "cancel" } | { kind: "reassign"; toProfessionalId: string };

function ProSheet({
  pro,
  others,
  onDone,
  onChanged,
}: {
  pro: TeamMember;
  others: TeamMember[];
  onDone: () => void;
  onChanged: () => void;
}) {
  const [needsPlan, setNeedsPlan] = useState(false);
  const [target, setTarget] = useState(others[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  async function deactivate(plan: Plan) {
    setBusy(true);
    const res = await removeProfessional(pro.id, plan);
    setBusy(false);
    if (!res.ok) {
      if (res.code === "HAS_FUTURE_APPOINTMENTS") return setNeedsPlan(true);
      return notify.error(res.code);
    }
    notify.success(`${pro.name} desativada`, "O histórico dela continua na agenda");
    onDone();
  }

  async function reactivate() {
    setBusy(true);
    const res = await reactivateProfessional(pro.id);
    setBusy(false);
    if (!res.ok) return notify.error(res.code);
    notify.success(`${pro.name} reativada`);
    onDone();
  }

  return (
    <div className="grid gap-5 pb-2">
      <NameForm
        initial={pro.name}
        label="Salvar nome"
        onSubmit={async (name) => {
          const res = await renameProfessional(pro.id, { name });
          if (!res.ok) return res.code;
          notify.success("Nome salvo");
          onDone();
          return null;
        }}
      />

      {pro.active && pro.access === null ? (
        <section className="grid gap-2" aria-label="Acesso ao app">
          <p className="font-bold">Acesso ao app</p>
          <p className="text-sm font-semibold text-muted">
            Ela entra com o Google e vê só a própria agenda. Sem acesso, a agenda dela fica com você.
          </p>
          {pro.invitedUntil ? (
            <p className="text-sm font-semibold text-muted">Convite pendente até {day(pro.invitedUntil)}. Gerar outro troca o link.</p>
          ) : null}
          <InvitePanel target={{ role: "professional", professionalId: pro.id }} name={pro.name} onChanged={onChanged} />
          {pro.inviteId ? (
            <button
              type="button"
              className="min-h-11 rounded-full font-bold text-fail"
              onClick={async () => {
                const res = await cancelInvite(pro.inviteId!);
                if (!res.ok) return notify.error(res.code);
                notify.success("Convite cancelado");
                onDone();
              }}
            >
              Cancelar convite
            </button>
          ) : null}
        </section>
      ) : pro.access ? (
        <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
          {pro.access === "owner" ? "É a dona do salão e entra no app." : "Já entra no app com o próprio login."}
        </p>
      ) : null}

      {pro.active ? (
        needsPlan ? (
          <section className="grid gap-3 rounded-2xl border border-line p-4" aria-label="Atendimentos futuros">
            <p className="font-bold">{ERROR_MESSAGES.HAS_FUTURE_APPOINTMENTS}</p>
            {others.length > 0 ? (
              <>
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                  Passar para
                  <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${field} normal-case tracking-normal`}>
                    {others.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" disabled={busy || !target} className={primary} onClick={() => deactivate({ kind: "reassign", toProfessionalId: target })}>
                  Passar e desativar
                </button>
              </>
            ) : null}
            <button type="button" disabled={busy} className="min-h-11 rounded-full font-bold text-fail" onClick={() => deactivate({ kind: "cancel" })}>
              Cancelar os atendimentos e desativar
            </button>
          </section>
        ) : (
          <button type="button" disabled={busy} className="min-h-11 rounded-full font-bold text-fail" onClick={() => deactivate({ kind: "none" })}>
            Desativar profissional
          </button>
        )
      ) : (
        <button type="button" disabled={busy} className={quiet} onClick={reactivate}>
          Reativar profissional
        </button>
      )}
    </div>
  );
}

/** Gera o link (aparece uma vez) e oferece copiar ou mandar pelo WhatsApp. */
function InvitePanel({
  target,
  name,
  onChanged,
}: {
  target: { role: "admin" } | { role: "professional"; professionalId: string };
  name?: string;
  onChanged: () => void;
}) {
  const [link, setLink] = useState<InviteLink | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    const res = await inviteMember(target, name);
    setBusy(false);
    if (!res.ok) return notify.error(res.code);
    setLink(res.data);
    onChanged();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link!.url);
      notify.success("Link copiado");
    } catch {
      notify.error("CLIPBOARD");
    }
  }

  if (!link) {
    return (
      <button type="button" disabled={busy} onClick={generate} className={quiet}>
        {busy ? "Gerando…" : target.role === "admin" ? "Gerar link de convite" : "Convidar para o app"}
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      <p className="break-all rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">{link.url}</p>
      <p className="text-xs font-semibold text-muted">Vale 7 dias e só funciona uma vez. Mande só para ela.</p>
      <a href={link.whatsappUrl} target="_blank" rel="noopener noreferrer" className={primary}>
        Mandar pelo WhatsApp
      </a>
      <button type="button" onClick={copy} className={quiet}>
        Copiar link
      </button>
    </div>
  );
}
