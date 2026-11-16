import type { Metadata } from "next";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { fmtDate } from "@/features/admin/ui/format";
import { listNotices, noticeDismissCounts } from "@/features/support/admin";
import { isNoticeLive } from "@/features/support/rules";
import { EndNoticeButton, NoticeComposer } from "@/features/support/ui/NoticeComposer";

export const metadata: Metadata = { title: "Avisos" };

const closedLabel = (n: number) => (n === 0 ? "Ninguém fechou ainda" : n === 1 ? "1 pessoa fechou" : `${n} pessoas fecharam`);

/** Avisos: o que aparece como cartão no Painel de todos os salões. */
export default async function AdminNoticesPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_notices" });
  const [notices, dismissed] = await Promise.all([listNotices(), noticeDismissCounts()]);
  const now = new Date();
  const live = notices.filter((n) => isNoticeLive(n, now));
  const past = notices.filter((n) => !isNoticeLive(n, now));

  return (
    <AdminShell title="Avisos" subtitle="Cartão no Painel de todos os salões, até a pessoa fechar">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-labelledby="novo" className="grid content-start gap-3 rounded-2xl bg-surface p-4">
          <h2 id="novo" className="text-lg font-bold">Novo aviso</h2>
          <NoticeComposer />
        </section>
        <div className="grid content-start gap-6">
          <section aria-labelledby="no-ar" className="grid gap-2">
            <h2 id="no-ar" className="text-lg font-bold">No ar</h2>
            {live.length === 0 ? <p className="rounded-2xl bg-surface p-4 font-semibold text-muted">Nenhum aviso no ar.</p> : null}
            {live.map((n) => (
              <article key={n.id} className="grid gap-1 rounded-2xl bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-text">
                  {n.tone === "important" ? "Importante" : "Aviso"} · desde {fmtDate(n.createdAt)}
                  {n.endsAt ? ` · sai em ${fmtDate(n.endsAt)}` : " · até encerrar"}
                </p>
                <h3 className="font-bold">{n.title}</h3>
                <p className="whitespace-pre-line text-sm font-semibold text-muted">{n.body}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted">
                    {closedLabel(dismissed[n.id] ?? 0)}
                  </span>
                  <EndNoticeButton id={n.id} title={n.title} />
                </div>
              </article>
            ))}
          </section>
          {past.length ? (
            <section aria-labelledby="antigos" className="grid gap-2">
              <h2 id="antigos" className="text-lg font-bold">Encerrados</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
                {past.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="font-bold">{n.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      {fmtDate(n.createdAt)} até {fmtDate(n.endedAt ?? n.endsAt)} · {closedLabel(dismissed[n.id] ?? 0)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
