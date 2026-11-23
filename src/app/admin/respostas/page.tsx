import type { Metadata } from "next";
import { TileTitle } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { fmtShort } from "@/features/admin/ui/format";
import { listUnclear } from "@/features/messaging/unclear-admin";
import { UnclearLabelButtons } from "@/features/messaging/ui/UnclearLabelButtons";

export const metadata: Metadata = { title: "Respostas" };

const DECISION_TEXT = {
  alerted: "Avisou a dona",
  silent: "Ficou em silêncio",
  guess: "Avisou a dona (palpite)",
  ambiguous: "Mais de um horário aberto",
} as const;

const INTENT_TEXT: Record<string, string> = {
  confirm: "confirmar",
  cancel: "cancelar",
  reschedule: "remarcar",
  late: "atraso",
  other: "outro",
};

/**
 * Respostas que o sistema não entendeu (até 12 h depois da pergunta, curtas). Só o texto e o salão: sem telefone
 * nem nome. O rótulo vira exemplo e caso de teste; nada treina modelo. Apaga sozinho em 90 dias.
 */
export default async function AdminUnclearPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_unclear" });
  const groups = await listUnclear();
  const total = groups.reduce((n, g) => n + g.count, 0);
  const open = groups.filter((g) => !g.label);

  return (
    <AdminShell
      title="Respostas"
      subtitle="O que as clientes responderam e o sistema não entendeu (últimos 90 dias)"
      icon="message"
      tint="teal"
    >
      <h2 className="sr-only">Resumo</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          icon="message"
          tint="teal"
          label="Mensagens"
          value={String(total)}
          note={`${groups.length} jeitos diferentes`}
        />
        <KpiCard
          icon="alert"
          tint="orange"
          tone={open.length ? "wait" : "ok"}
          label="Sem rótulo"
          value={String(open.length)}
          note="grupos para analisar"
        />
      </div>
      <TileTitle as="h2" icon="message" tint="teal" className="pb-3 text-lg">
        Agrupadas por texto parecido
      </TileTitle>
      {groups.length === 0 ? (
        <p className="rounded-2xl bg-surface p-4 font-semibold text-muted">
          Nenhuma resposta não entendida por enquanto.
        </p>
      ) : (
        <ul className="grid gap-3">
          {groups.map((g) => (
            <li key={g.pattern} className="grid gap-3 rounded-2xl bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="max-w-prose whitespace-pre-wrap break-words text-base font-semibold">“{g.example}”</p>
                <span className="rounded-full bg-primary/10 px-2.5 text-lg font-bold text-primary tabular-nums">
                  {g.count}×
                </span>
              </div>
              <p className="text-sm font-semibold text-muted">
                {DECISION_TEXT[g.decision]}
                {g.aiIntent ? ` · IA achou: ${INTENT_TEXT[g.aiIntent] ?? g.aiIntent}` : ""} · {g.salons.join(", ")} ·
                última em {fmtShort(g.last)}
              </p>
              <UnclearLabelButtons ids={g.ids} current={g.label} />
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
