import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ADMIN_ACTION_LABEL, logAdminAccess, recentAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { countOtherSessions } from "@/features/admin/step-up";
import { EndSessions } from "@/features/admin/ui/EndSessions";
import { RegenerateCodes } from "@/features/admin/ui/RegenerateCodes";
import { adminCard } from "@/features/admin/ui/styles";

export const metadata: Metadata = { title: "Segurança" };

// Data e hora sempre no fuso do Brasil (UTC-3), como o resto do app
const when = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminSecurityPage() {
  const { userId, sessionId } = await requireAdmin();
  await logAdminAccess({ userId, action: "view_security" });
  const [rows, others] = await Promise.all([recentAdminAccess(50), countOtherSessions(userId, sessionId)]);
  return (
    <AdminShell title="Segurança" subtitle="2FA e quem entrou no painel">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
        <div className="grid gap-5">
        <section className={adminCard} aria-labelledby="sec-2fa">
          <h2 id="sec-2fa" className="flex items-center gap-2 text-lg font-bold">
            <Icon name="shield" /> 2FA
          </h2>
          <p className="flex items-center gap-2 text-sm font-semibold text-ok">
            <Icon name="checkCircle" size={18} /> Ativo no app autenticador
          </p>
          <RegenerateCodes />
        </section>
        <section className={adminCard} aria-labelledby="sec-sessions">
          <h2 id="sec-sessions" className="text-lg font-bold">
            Aparelhos conectados
          </h2>
          <EndSessions others={others} />
        </section>
        </div>
        <section className={adminCard} aria-labelledby="sec-log">
          <h2 id="sec-log" className="text-lg font-bold">
            Últimos acessos
          </h2>
          {rows.length === 0 ? (
            <EmptyState icon="shield" title="Nenhum acesso registrado" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-bold text-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Quando</th>
                    <th scope="col" className="py-2 pr-4">O que</th>
                    <th scope="col" className="py-2">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="whitespace-nowrap py-2 pr-4 font-semibold">{when.format(r.createdAt)}</td>
                      <td className={`py-2 pr-4 ${r.action === "step_up_failed" ? "font-bold text-fail" : ""}`}>
                        {ADMIN_ACTION_LABEL[r.action] ?? r.action}
                      </td>
                      <td className="py-2 font-mono text-xs text-muted">{r.ip ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
