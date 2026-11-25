"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { TypeToConfirmSheet } from "@/components/ui/TypeToConfirmSheet";
import { deleteOfferAction, promotionControlAction } from "./actions";
import { DELETE_WORD, type PromoStatus } from "./rules";

/**
 * Peças comuns dos cartões de Planos (pacotes e promoções): selo de situação, Desativar/Reativar e Excluir com
 * a palavra digitada. Desativar nunca exclui; Excluir mora à parte.
 */

type Target = "promotion" | "package";
/** "a" = promoção (Ativa, Vencida…), "o" = pacote (Ativo, Vencido…) */
type Gender = "a" | "o";

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold";

const LOOK: Record<PromoStatus, { label: (g: Gender) => string; cls: string; dot: string }> = {
  running: { label: (g) => `Ativ${g}`, cls: "bg-ok-bg text-ok", dot: "bg-ok" },
  scheduled: { label: (g) => `Agendad${g}`, cls: "bg-soft text-primary-text", dot: "bg-primary" },
  paused: { label: (g) => `Desativad${g}`, cls: "border border-line bg-surface text-muted", dot: "bg-muted" },
  sold_out: { label: (g) => `Esgotad${g}`, cls: "bg-wait-bg text-wait", dot: "bg-wait" },
  ended: { label: (g) => `Vencid${g}`, cls: "bg-fail-bg text-fail", dot: "bg-fail" },
};

/** Ativo/agendado em cima; o que está fora do ar embaixo. */
export const isLive = (s: PromoStatus) => s === "running" || s === "scheduled";

export function statusLabel(status: PromoStatus, g: Gender) {
  return LOOK[status].label(g);
}

/** Selo colorido com ponto e texto (a cor nunca é a única pista). */
export function StatusBadge({ status, g }: { status: PromoStatus; g: Gender }) {
  const l = LOOK[status];
  return (
    <span className={`${pill} w-fit ${l.cls}`}>
      <span className={`size-2 rounded-full ${l.dot}`} aria-hidden="true" />
      {l.label(g)}
    </span>
  );
}

/** Divide em "funcionando" e "fora do ar", mantendo a ordem de criação dentro de cada grupo. */
export function splitByLive<T extends { status: PromoStatus }>(items: T[]) {
  return { live: items.filter((x) => isLive(x.status)), off: items.filter((x) => !isLive(x.status)) };
}

/** Desativar (para de valer, continua na lista) ou Reativar. */
export function ToggleOffer({
  target,
  id,
  title,
  paused,
  g,
}: {
  target: Target;
  id: string;
  title: string;
  paused: boolean;
  g: Gender;
}) {
  const [pending, start] = useTransition();
  const word = target === "package" ? "Pacote" : "Promoção";
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${paused ? "Reativar" : "Desativar"} ${title}`}
      onClick={() =>
        start(async () => {
          const r = await promotionControlAction({ target, id, action: paused ? "resume" : "pause" }).catch(() => null);
          if (r?.ok) notify.success(paused ? `${word} reativad${g}` : `${word} desativad${g}`);
          else notify.error(r && !r.ok ? r.code : "NETWORK");
        })
      }
      className="btn-glass flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold disabled:opacity-60"
    >
      {pending ? (
        <span className="spin" aria-hidden="true" />
      ) : (
        <Icon name={paused ? "play" : "pause"} size={16} className="text-primary-text" />
      )}
      {paused ? "Reativar" : "Desativar"}
    </button>
  );
}

/**
 * Excluir, separado do Desativar: folha que só libera ao digitar "excluir". Nunca usado = apaga de vez; já usado
 * = sai da lista e para de valer, e quem comprou/usou continua com o que tem.
 */
export function DeleteOffer({
  target,
  id,
  title,
  used,
}: {
  target: Target;
  id: string;
  title: string;
  /** clientes que compraram (pacote) ou usaram (promoção) */
  used: number;
}) {
  const [open, setOpen] = useState(false);
  const isPkg = target === "package";
  const what = isPkg ? "pacote" : "promoção";
  const who =
    used === 1
      ? isPkg
        ? "1 cliente comprou"
        : "1 cliente usou"
      : isPkg
        ? `${used} clientes compraram`
        : `${used} clientes usaram`;
  return (
    <>
      <button
        type="button"
        aria-label={`Excluir ${title}`}
        onClick={() => setOpen(true)}
        className="ml-auto flex min-h-11 items-center gap-1 px-2 text-sm font-bold text-fail"
      >
        <Icon name="trash" size={15} />
        Excluir
      </button>
      <TypeToConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={`Excluir ${title}?`}
        description={
          used > 0
            ? `${who}. ${isPkg ? "O pacote" : "A promoção"} sai da lista e para de valer, mas ${
                isPkg ? "as sessões de quem comprou continuam valendo" : "quem já agendou mantém o desconto"
              } e o histórico fica. Não dá para desfazer.`
            : `Ninguém ${isPkg ? "comprou" : "usou"} ainda, então ${isPkg ? "o pacote" : "a promoção"} é apagad${
                isPkg ? "o" : "a"
              } de vez. Não dá para desfazer.`
        }
        word={DELETE_WORD}
        confirmLabel={`Excluir ${what}`}
        onConfirm={async (typed) => {
          const r = await deleteOfferAction({ target, id, confirm: typed }).catch(() => null);
          if (!r?.ok) {
            notify.error(r && !r.ok ? r.code : "NETWORK");
            return false;
          }
          notify.success(
            r.data.outcome === "deleted"
              ? `${isPkg ? "Pacote excluído" : "Promoção excluída"}`
              : `${isPkg ? "Pacote excluído. Quem comprou continua com as sessões" : "Promoção excluída. O histórico fica"}`,
          );
          return true;
        }}
      >
        <p className="mb-4 rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
          Só quer parar por um tempo? Use <b>Desativar</b>: {isPkg ? "ele" : "ela"} fica na lista e dá para reativar.
        </p>
      </TypeToConfirmSheet>
    </>
  );
}
