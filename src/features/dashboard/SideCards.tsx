import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NewBlockSheet } from "@/features/blocks/NewBlockSheet";
import { NewClientSheet } from "@/features/clients/NewClientSheet";
import { NewExpenseSheet } from "@/features/finance/NewExpenseSheet";
import { SlotButton } from "@/features/hours/SlotButton";
import { DueReturns } from "@/features/returns/DueReturns";
import { formatShortDate, formatTime, todayStr } from "@/lib/dates";
import type { Dashboard } from "./data";
import { NewBookingButton } from "./NewBookingButton";
import { BOX, BOX_LINK, BOX_TITLE } from "./ui";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Row({ icon, tone, title, sub }: { icon: React.ComponentProps<typeof Icon>["name"]; tone: string; title: string; sub?: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`} aria-hidden="true">
        <Icon name={icon} size={17} />
      </span>
      <p className="min-w-0 flex-1 text-sm font-bold leading-tight">
        {title}
        {sub ? <span className="block truncate text-xs font-semibold text-muted">{sub}</span> : null}
      </p>
    </li>
  );
}

/** Resumo das pendências; tudo se resolve na tela de Pendências. */
export function PendingCard({ pend }: { pend: Dashboard["pend"] }) {
  return (
    <section aria-label="Pendências" className={BOX}>
      <h2 className={BOX_TITLE}>
        Pendências
        {pend.total ? (
          <Link href="/pendencias" className={BOX_LINK}>
            Resolver ({pend.total})
            <Icon name="arrowRight" size={14} />
          </Link>
        ) : null}
      </h2>
      {pend.total === 0 ? (
        <p className="flex items-center gap-2 py-2 text-sm font-semibold text-muted">
          <Icon name="checkCircle" size={18} className="text-ok" />
          Tudo em dia.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {pend.toClose ? (
            <Row icon="clock" tone="bg-wait-bg text-wait" title={`${plural(pend.toClose, "atendimento", "atendimentos")} para fechar`} sub="Concluir ou marcar falta" />
          ) : null}
          {pend.toReschedule.map((r) => (
            <Row key={r.id} icon="reschedule" tone="bg-fail-bg text-fail" title={`${r.name.split(/\s+/)[0]} pediu para remarcar`} sub={`${formatShortDate(todayStr(r.startsAt))} às ${formatTime(r.startsAt)}`} />
          ))}
          {pend.toConfirm ? (
            <Row icon="chat" tone="bg-soft text-primary-text" title={`${plural(pend.toConfirm, "cliente", "clientes")} sem confirmar`} sub="Aguardando a resposta do lembrete" />
          ) : null}
          {pend.unsynced ? (
            <Row icon="google" tone="bg-soft text-primary-text" title={`${plural(pend.unsynced, "horário", "horários")} fora do Google`} sub="Tentar enviar de novo" />
          ) : null}
        </ul>
      )}
    </section>
  );
}

/** Vagas de hoje e amanhã para o primeiro serviço de Vagas; clicar agenda já preenchido. */
export function SlotsCard({ slots }: { slots: Dashboard["slots"] }) {
  if (!slots) return null;
  const label = (i: number) => (i === 0 ? "Hoje" : "Amanhã");
  return (
    <section aria-label="Vagas livres" className={BOX}>
      <h2 className={BOX_TITLE}>
        Vagas livres
        <Link href="/vagas" className={BOX_LINK}>
          Divulgar
          <Icon name="arrowRight" size={14} />
        </Link>
      </h2>
      <p className="-mt-1 pb-1 text-xs font-semibold text-muted">Para {slots.serviceName}</p>
      {slots.days.map((d, i) => (
        <div key={d.date} className="pt-2">
          <p className="pb-1.5 text-xs font-bold text-muted">{label(i)}</p>
          {d.times.length ? (
            <div className="flex flex-wrap gap-1.5">
              {d.times.map((t) => (
                <SlotButton key={t} date={d.date} time={t} serviceId={slots.serviceId} dayLabel={label(i).toLowerCase()} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted">Sem horário livre.</p>
          )}
        </div>
      ))}
    </section>
  );
}

/** Atalhos: as mesmas folhas de sempre, por cima da tela. */
export function ShortcutsCard({ today }: { today: string }) {
  return (
    <section aria-label="Atalhos" className={BOX}>
      <h2 className={BOX_TITLE}>Atalhos</h2>
      <div className="grid grid-cols-2 gap-2 [&>*]:w-full [&>*]:whitespace-nowrap [&>*]:!px-3">
        <NewBookingButton />
        <NewBlockSheet date={today} />
        <NewClientSheet />
        <NewExpenseSheet date={today} />
      </div>
    </section>
  );
}

export function ReturnsCard({ due }: { due: Dashboard["due"] }) {
  return <DueReturns items={due} />;
}
