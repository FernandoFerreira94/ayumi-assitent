import { EmptyState } from "@/components/feedback/EmptyState";
import type { UsageRow } from "../usage-rules";
import { fmtDate } from "./format";

const DAY = 86_400_000;

function seen(d: Date | null, now: Date): { text: string; stale: boolean } {
  if (!d) return { text: "Nunca", stale: true };
  const days = Math.floor((now.getTime() - d.getTime()) / DAY);
  if (days <= 0) return { text: "Hoje", stale: false };
  if (days === 1) return { text: "Ontem", stale: false };
  return { text: `Há ${days} dias`, stale: days > 7 };
}

const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

/** Uso por salão (dados reais). Cartões no celular, tabela a partir de 1024 px. */
export function UsageTable({ rows, now }: { rows: UsageRow[]; now: Date }) {
  if (!rows.length) return <EmptyState icon="users" title="Nenhum salão cadastrado ainda" />;
  return (
    <>
      <ul className="grid gap-2 lg:hidden">
        {rows.map((r) => {
          const s = seen(r.lastSeenAt, now);
          return (
            <li key={r.tenantId} className="grid gap-1 rounded-2xl border border-line bg-surface p-4">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-bold">{r.salonName}</span>
                <span className={`shrink-0 text-xs font-bold ${s.stale ? "text-fail" : "text-ok"}`}>{s.text}</span>
              </span>
              <span className="text-sm font-semibold text-muted">
                {r.ownerName ?? "Sem nome"} · desde {fmtDate(r.createdAt)} · WhatsApp {r.whatsapp ? "conectado" : "desligado"}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {num(r.appts30)} agendamentos · {num(r.msgsOut30)} mensagens enviadas · {num(r.clients)} clientes
              </span>
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-hidden rounded-3xl border border-line bg-surface lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Uso por salão nos últimos 30 dias</caption>
          <thead className="border-b border-line bg-bg text-xs font-bold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Salão</th>
              <th scope="col" className="px-4 py-3">Último uso</th>
              <th scope="col" className="px-4 py-3">WhatsApp</th>
              <th scope="col" className="px-4 py-3 text-right">Clientes</th>
              <th scope="col" className="px-4 py-3 text-right">Agendamentos (30 dias)</th>
              <th scope="col" className="px-4 py-3 text-right">Enviadas (30 dias)</th>
              <th scope="col" className="px-4 py-3 text-right">Recebidas (30 dias)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = seen(r.lastSeenAt, now);
              return (
                <tr key={r.tenantId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="block font-bold">{r.salonName}</span>
                    <span className="text-xs font-semibold text-muted">
                      {r.ownerName ?? "Sem nome"} · desde {fmtDate(r.createdAt)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${s.stale ? "text-fail" : ""}`}>{s.text}</td>
                  <td className="px-4 py-3 font-semibold">{r.whatsapp ? "Conectado" : "Desligado"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{num(r.clients)}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{num(r.appts30)}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{num(r.msgsOut30)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{num(r.msgsIn30)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
