import type { Metadata } from "next";
import { TileTitle } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { KpiCard } from "@/features/admin/ui/KpiCard";
import { fmtShort } from "@/features/admin/ui/format";
import { FEEDBACK_QUESTIONS, summarizeFeedback } from "@/features/launch/feedback";
import { listLaunchFeedback } from "@/features/launch/feedback-admin";

export const metadata: Metadata = { title: "Feedback" };

/** Respostas do cartão de feedback do lançamento (Painel, depois de 7 dias de estúdio). Só o texto, a nota e o salão. */
export default async function AdminFeedbackPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_feedback" });
  const rows = await listLaunchFeedback();
  const s = summarizeFeedback(rows);
  const answers = rows.filter((r) => !r.skipped);

  return (
    <AdminShell title="Feedback" subtitle="O que os estúdios acham do Bubbly no lançamento" icon="sparkles" tint="lavender">
      <h2 className="sr-only">Resumo</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard icon="sparkles" label="Respostas" value={String(s.answered)} note={`${s.skipped} preferiram pular`} />
        <KpiCard
          icon="forecast"
          tint="teal"
          label="Nota média"
          value={s.average === null ? "—" : s.average.toLocaleString("pt-BR")}
          note="de 0 a 10"
        />
        <KpiCard
          icon="users"
          tint="orange"
          tone={s.nps === null ? undefined : s.nps >= 30 ? "ok" : "wait"}
          label="NPS"
          value={s.nps === null ? "—" : String(s.nps)}
          note="% de 9–10 menos % de 0–6"
        />
      </div>
      <TileTitle as="h2" icon="message" tint="teal" className="pb-3 text-lg">
        Respostas, das mais novas
      </TileTitle>
      {answers.length === 0 ? (
        <p className="rounded-2xl bg-surface p-4 font-semibold text-muted">Nenhuma resposta por enquanto.</p>
      ) : (
        <ul className="grid gap-3">
          {answers.map((r, i) => (
            <li key={`${r.createdAt.getTime()}-${i}`} className="grid gap-2 rounded-2xl bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-muted">
                  {r.salon} · {fmtShort(r.createdAt)}
                </p>
                <span className="rounded-full bg-primary/10 px-2.5 text-lg font-bold text-primary tabular-nums">
                  {r.score}
                  <span className="sr-only"> de 10</span>
                </span>
              </div>
              <dl className="grid gap-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">{FEEDBACK_QUESTIONS.helps}</dt>
                  <dd className="max-w-prose whitespace-pre-wrap break-words font-semibold">{r.helps ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">{FEEDBACK_QUESTIONS.missing}</dt>
                  <dd className="max-w-prose whitespace-pre-wrap break-words font-semibold">{r.missing ?? "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
