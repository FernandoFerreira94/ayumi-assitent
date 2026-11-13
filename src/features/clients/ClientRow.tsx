"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { ChatGlyph, ChatSheet } from "@/features/messaging/ChatSheet";
import { messageFor, type ActionResult } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { deleteClient, loadClientCard, updateClient, type ClientCard } from "./actions";
import { formatBRL } from "@/lib/dates";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";
/** Largura de cada botão revelado. */
const BTN = 76;
const LEFT_W = BTN; // Agendar
const RIGHT_W = BTN * 2; // Editar + Excluir
/** Quanto precisa arrastar para a linha ficar aberta ao soltar. */
const SNAP = 36;
const CLOSE_EVENT = "ayumi:swipe-close";

type Client = { id: string; name: string; phone: string; email: string | null; optedOut?: boolean };

const icon = {
  viewBox: "0 0 24 24",
  className: "size-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/**
 * Linha de cliente que desliza como no iPhone: para a esquerda revela Editar e Excluir,
 * para a direita revela Agendar. Tocar no nome abre o cartão dela; o balão ao lado abre a conversa.
 * Com a linha aberta, o toque só fecha.
 */
export function ClientRow({ client }: { client: Client }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [card, setCard] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; base: number; live: boolean } | null>(null);
  const moved = useRef(false);
  const xRef = useRef(0);
  const self = useRef<HTMLLIElement>(null);

  const move = (v: number) => {
    xRef.current = v;
    setX(v);
  };

  // Abrir uma linha fecha as outras
  useEffect(() => {
    const onClose = (e: Event) => {
      if ((e as CustomEvent<Element | null>).detail !== self.current) move(0);
    };
    window.addEventListener(CLOSE_EVENT, onClose);
    return () => window.removeEventListener(CLOSE_EVENT, onClose);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, base: xRef.current, live: false };
    moved.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.live) {
      // Só vira gesto horizontal quando é claramente horizontal: não briga com a rolagem
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.live = true;
      moved.current = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      window.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: self.current }));
    }
    // Resistência além do limite, como a borda elástica do iOS
    const raw = d.base + dx;
    const lim = raw > 0 ? LEFT_W : RIGHT_W;
    const over = Math.abs(raw) - lim;
    const v = over > 0 ? Math.sign(raw) * (lim + over * 0.25) : raw;
    move(v);
  }

  function end(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.live) return;
    setDragging(false);
    const v = xRef.current;
    // Abre se passou do ponto; senão volta. Se já estava aberta, fecha ao puxar de volta.
    move(v > SNAP ? LEFT_W : v < -SNAP ? -RIGHT_W : 0);
  }

  const close = () => move(0);
  const ease = dragging ? "none" : "transform 0.32s var(--spring), width 0.32s var(--spring)";

  return (
    <li ref={self} className="relative overflow-hidden rounded-2xl">
      {/* Agendar (revelado ao arrastar para a direita) */}
      <div
        className="absolute inset-y-0 left-0 flex overflow-hidden rounded-l-2xl"
        style={{ width: Math.max(x, 0), transition: dragging ? "none" : "width 0.32s var(--spring)" }}
      >
        <button
          type="button"
          tabIndex={x > 0 ? 0 : -1}
          onClick={() => {
            close();
            openNewAppointment({ clientId: client.id });
          }}
          className="btn-tint grid shrink-0 place-content-center justify-items-center gap-0.5 text-xs font-bold"
          style={{ width: LEFT_W, minWidth: Math.max(x, LEFT_W) }}
        >
          <svg {...icon}>
            <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
            <path d="M8 3v3.5M16 3v3.5M12 10.5v6M9 13.5h6" />
          </svg>
          Agendar
        </button>
      </div>

      {/* Editar e Excluir (revelados ao arrastar para a esquerda) */}
      <div
        className="absolute inset-y-0 right-0 flex justify-end overflow-hidden rounded-r-2xl"
        style={{ width: Math.max(-x, 0), transition: dragging ? "none" : "width 0.32s var(--spring)" }}
      >
        <button
          type="button"
          tabIndex={x < 0 ? 0 : -1}
          onClick={() => {
            close();
            setEditing(true);
          }}
          className="grid shrink-0 place-content-center justify-items-center gap-0.5 bg-soft text-xs font-bold text-primary-text"
          style={{ width: BTN }}
        >
          <svg {...icon}>
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
          Editar
        </button>
        <button
          type="button"
          tabIndex={x < 0 ? 0 : -1}
          onClick={() => {
            close();
            setDeleting(true);
          }}
          className="grid shrink-0 place-content-center justify-items-center gap-0.5 bg-fail text-xs font-bold text-white"
          style={{ width: BTN }}
        >
          <svg {...icon}>
            <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5M14 11v5" />
          </svg>
          Excluir
        </button>
      </div>

      {/* Linha: o nome abre o cartão da cliente; o balão, a conversa no WhatsApp do salão */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onClickCapture={(e) => {
          // Depois de arrastar, ou com a linha aberta, o toque não abre nada
          if (moved.current || xRef.current !== 0) {
            e.preventDefault();
            e.stopPropagation();
            if (!moved.current) close();
            moved.current = false;
          }
        }}
        style={{ transform: `translateX(${x}px)`, transition: ease, touchAction: "pan-y" }}
        className="glass relative flex items-center gap-2 rounded-2xl pr-2"
      >
        <button
          type="button"
          onClick={() => setCard(true)}
          className="min-w-0 flex-1 rounded-2xl py-3 pl-4 text-left transition-transform active:scale-[0.99]"
        >
          <span className="block truncate font-bold">{client.name}</span>
          <span className="block text-sm font-semibold text-muted">{client.phone}</span>
        </button>
        <ChatSheet
          clientId={client.id}
          clientName={client.name}
          phone={client.phone}
          triggerClassName="grid size-11 shrink-0 place-content-center rounded-full bg-soft/70 active:scale-95"
          triggerLabel={`Conversa com ${client.name}`}
        >
          <ChatGlyph />
        </ChatSheet>
      </div>

      <CardSheet
        client={client}
        open={card}
        onOpenChange={setCard}
        onEdit={() => {
          setCard(false);
          setEditing(true);
        }}
        onDelete={() => {
          setCard(false);
          setDeleting(true);
        }}
      />
      <EditSheet client={client} open={editing} onOpenChange={setEditing} />
      <DeleteSheet client={client} open={deleting} onOpenChange={setDeleting} />
    </li>
  );
}

function EditSheet({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const side = useSheetSide();
  const [phone, setPhone] = useState(client.phone);
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await updateClient(client.id, prev, fd);
    if (res.ok) {
      notify.success("Cliente atualizada");
      onOpenChange(false);
    } else if (res.code !== "VALIDATION" && res.code !== "PHONE_EXISTS") {
      notify.error(res.code);
    }
    return res;
  }, null);
  const err = state && !state.ok ? state : null;

  return (
    <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none", "sheet z-50")}>
<SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">Editar cliente</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Os agendamentos dela continuam como estão.
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              Nome
              <input
                name="name"
                required
                autoComplete="off"
                defaultValue={client.name}
                className={input}
                aria-invalid={err?.field === "name"}
              />
              {err?.field === "name" ? (
                <span role="alert" className="text-xs text-primary-text">
                  Informe o nome
                </span>
              ) : null}
            </label>
            <label className="grid gap-1 text-sm font-bold">
              WhatsApp
              <input
                name="phone"
                inputMode="tel"
                autoComplete="off"
                required
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                className={input}
                aria-invalid={err?.field === "phone"}
              />
              {err?.field === "phone" ? (
                <span role="alert" className="text-xs text-primary-text">
                  {err.code === "PHONE_EXISTS" ? messageFor("PHONE_EXISTS") : "Telefone inválido"}
                </span>
              ) : null}
            </label>
            <label className="grid gap-1 text-sm font-bold">
              E-mail (opcional)
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                defaultValue={client.email ?? ""}
                placeholder="maria@email.com"
                className={input}
                aria-invalid={err?.field === "email"}
              />
              {err?.field === "email" ? (
                <span role="alert" className="text-xs text-primary-text">
                  E-mail inválido
                </span>
              ) : null}
            </label>
            <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function DeleteSheet({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const side = useSheetSide();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await deleteClient(client.id).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      onOpenChange(false);
      notify.success("Cliente excluída");
    } else {
      notify.error(res && !res.ok ? res.code : "NETWORK", () => void confirm());
    }
  }

  return (
    <Drawer.Root direction={side}
      open={open}
      dismissible={!busy}
      onOpenChange={(v) => {
        if (busy) return;
        onOpenChange(v);
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none", "sheet z-50")}>
<SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">Excluir {client.name}?</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Nome, telefone e conversa dela saem do app. Se ela já foi atendida, os horários antigos ficam como
            &quot;Cliente removida&quot; no financeiro. Não dá para desfazer.
          </Drawer.Description>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy}
              aria-busy={busy}
              className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-fail px-5 font-bold text-white disabled:opacity-70"
            >
              {busy ? <span className="spin" aria-hidden="true" /> : null}
              {busy ? "Excluindo…" : "Excluir cliente"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="btn-glass flex min-h-13 items-center justify-center rounded-2xl px-5 font-bold"
            >
              Cancelar
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Cartão da cliente: o que importa antes de agendar ou conversar, e as ações num lugar só. */
function CardSheet({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const side = useSheetSide();
  const [data, setData] = useState<ClientCard | null>(null);
  const [failed, setFailed] = useState(false);
  /** Muda a cada abertura ou "Tentar de novo" e dispara a busca. */
  const [attempt, setAttempt] = useState(0);

  // A cada abertura busca de novo: um agendamento novo já aparece no cartão.
  // (A folha abre pelo estado do pai; o onOpenChange do vaul só avisa o que ela mesma muda.)
  useEffect(() => {
    if (!open) return;
    let alive = true;
    loadClientCard(client.id)
      .catch(() => null)
      .then((res) => {
        if (!alive) return;
        setFailed(!res?.ok);
        if (res?.ok) setData(res.data);
      });
    return () => {
      alive = false;
    };
  }, [open, attempt, client.id]);

  const load = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const action = "flex min-h-13 items-center justify-center gap-2 rounded-2xl px-4 font-bold";
  return (
    <Drawer.Root direction={side}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className={sheetClass(side, "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none", "sheet z-50")}>
<SidePanelClose />
          <Drawer.Title className="text-xl font-bold">{client.name}</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {client.phone}
            {client.email ? ` · ${client.email}` : ""}
          </Drawer.Description>
          {client.optedOut ? (
            <p className="-mt-2 mb-4 text-sm font-semibold text-muted">
              Não recebe lembretes automáticos (respondeu SAIR; volta se responder VOLTAR).
            </p>
          ) : null}

          {failed ? (
            <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
              Não deu para carregar o histórico.
              <button type="button" onClick={load} className="min-h-11 px-2 font-bold underline">
                Tentar de novo
              </button>
            </div>
          ) : data === null ? (
            <div className="mb-3 grid gap-2" aria-busy="true" aria-label="Carregando histórico">
              <div className="skel h-16 rounded-2xl" />
              <div className="skel h-16 rounded-2xl" />
            </div>
          ) : (
            <div className="mb-4 grid gap-2">
              <p className="glass rounded-2xl px-4 py-3">
                <span className="block text-xs font-bold uppercase tracking-wide text-muted">Próximo horário</span>
                {data.next ? (
                  <span className="block font-bold first-letter:uppercase">
                    {data.next.when} <span className="font-semibold text-muted">· {data.next.service}</span>
                  </span>
                ) : (
                  <span className="block font-semibold text-muted">Nenhum marcado</span>
                )}
              </p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    [String(data.visits), data.visits === 1 ? "visita" : "visitas"],
                    [formatBRL(data.spentCents), "gastou"],
                    [String(data.noShows), data.noShows === 1 ? "falta" : "faltas"],
                  ] as const
                ).map(([value, label]) => (
                  // dt antes do dd (ordem do HTML); o valor aparece em cima pelo flex invertido
                  <div key={label} className="glass flex flex-col-reverse rounded-2xl px-2 py-3">
                    <dt className="text-xs font-semibold text-muted">{label}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              {data.last ? (
                <p className="px-1 text-xs font-semibold text-muted first-letter:uppercase">Última visita: {data.last}</p>
              ) : null}
            </div>
          )}

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                openNewAppointment({ clientId: client.id });
              }}
              className={`btn-tint ${action}`}
            >
              Agendar
            </button>
            <ChatSheet
              clientId={client.id}
              clientName={client.name}
              phone={client.phone}
              nested
              triggerClassName={`btn-glass w-full ${action}`}
            >
              <ChatGlyph />
              Conversar
            </ChatSheet>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onEdit} className={`btn-glass ${action}`}>
                Editar
              </button>
              <button type="button" onClick={onDelete} className={`btn-glass ${action} text-fail`}>
                Excluir
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
