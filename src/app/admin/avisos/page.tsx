import type { Metadata } from "next";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { fmtDate } from "@/features/admin/ui/format";
import { listNotices, noticeDismissCounts } from "@/features/support/admin";
import { isNoticeLive } from "@/features/support/rules";
import { EndNoticeButton, NoticeComposer } from "@/features/support/ui/NoticeComposer";

export const metadata: Metadata = { title: "Avisos" };

/** Avisos: o que aparece como cartão no Painel de todos os salões. */
export default async function AdminNoticesPage() {
  const { userId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_notices" });
  const [notices, dismissed] = await Promise.all([listNotices(), noticeDismissCounts()]);
  const now = new Date();
  const live = notices.filter((n) => isNoticeLive(n, now));
  const past = notices.filter((n) => !isNoticeLive(n, now));

  return (
    <AdminShell title="Avisos" subtitle="Cartão no Painel de todos os salões, até a pessoa fechar" icon="bell" tint="orange">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-labelledby="novo" className="grid content-start gap-3 rounded-2xl bg-surface p-4">
          <TileTitle as="h2" id="novo" icon="plus" tint="lavender" className="text-lg">
            Novo aviso
          </TileTitle>
          <NoticeComposer />
        </section>
        <div className="grid content-start gap-6">
          <section aria-labelledby="no-ar" className="grid gap-2">
            <TileTitle as="h2" id="no-ar" icon="bell" tint="green" className="text-lg">
              No ar{live.length ? <span className="rounded-full bg-ok-bg px-2 text-sm text-ok tabular-nums">{live.length}</span> : null}
            </TileTitle>
            {live.length === 0 ? <p className="rounded-2xl bg-surface p-4 font-semibold text-muted">Nenhum aviso no ar.</p> : null}
            {live.map((n) => (
              <article
                key={n.id}
                className={`grid gap-1 rounded-2xl border-l-4 bg-surface p-4 ${n.tone === "important" ? "border-fail" : "border-primary"}`}
              >
                <p
                  className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${n.tone === "important" ? "text-fail" : "text-primary-text"}`}
                >
                  <Icon name={n.tone === "important" ? "alert" : "bell"} size={13} />
                  {n.tone === "important" ? "Importante" : "Aviso"} · desde {fmtDate(n.createdAt)}
                  {n.endsAt ? ` · sai em ${fmtDate(n.endsAt)}` : " · até encerrar"}
                </p>
                <h3 className="text-lg font-bold">{n.title}</h3>
                <p className="whitespace-pre-line text-sm font-semibold text-muted">{n.body}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                    <Icon name="eye" size={14} />
                    <strong className="font-brand text-sm text-fg">{dismissed[n.id] ?? 0}</strong>{" "}
                    {(dismissed[n.id] ?? 0) === 1 ? "pessoa fechou" : "pessoas fecharam"}
                  </span>
                  <EndNoticeButton id={n.id} title={n.title} />
                </div>
              </article>
            ))}
          </section>
          {past.length ? (
            <section aria-labelledby="antigos" className="grid gap-2">
              <TileTitle as="h2" id="antigos" icon="clock" tint="gray" className="text-lg">
                Encerrados
              </TileTitle>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
                {past.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="font-bold">{n.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      {fmtDate(n.createdAt)} até {fmtDate(n.endedAt ?? n.endsAt)} · {dismissed[n.id] ?? 0} fecharam
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
