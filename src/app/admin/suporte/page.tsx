import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { logAdminAccess } from "@/features/admin/audit";
import { requireAdmin } from "@/features/admin/guard";
import { AdminShell } from "@/features/admin/ui/AdminShell";
import { fmtDate } from "@/features/admin/ui/format";
import { getConversation, listConversations } from "@/features/support/admin";
import { preview, sortConversations } from "@/features/support/rules";
import { SupportSheet } from "@/features/support/ui/SupportSheet";

export const metadata: Metadata = { title: "Suporte" };

/** Suporte: conversas dos salões (sem resposta primeiro). ?salao=<id> abre a conversa ao lado. */
export default async function AdminSupportPage({ searchParams }: PageProps<"/admin/suporte">) {
  const { userId } = await requireAdmin();
  const sp = await searchParams;
  const salao = typeof sp.salao === "string" && /^[0-9a-f-]{36}$/i.test(sp.salao) ? sp.salao : null;
  const [rows, open] = await Promise.all([listConversations(), salao ? getConversation(salao) : null]);
  await logAdminAccess({ userId, action: "view_support", target: open ? salao! : undefined });
  const list = sortConversations(rows);
  const waiting = list.filter((c) => c.lastAuthor === "salon").length;

  return (
    <AdminShell
      title="Suporte"
      icon="chat"
      tint="green"
      subtitle={
        waiting ? (
          <>
            <strong className="font-brand text-base text-wait">{waiting}</strong> {waiting === 1 ? "conversa espera" : "conversas esperam"} resposta
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-ok">
            <Icon name="checkCircle" size={15} /> Tudo respondido
          </span>
        )
      }
    >
      {list.length === 0 ? (
        <p className="grid justify-items-center gap-2 rounded-2xl bg-surface p-6 text-center font-semibold text-muted">
          <Icon name="chat" size={28} className="text-primary-text" />
          Nenhuma mensagem ainda. Quando um salão escrever em Ajustes &gt; Ajuda e suporte, aparece aqui e no seu celular.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
          {list.map((c) => (
            <li key={c.tenantId}>
              <Link
                href={`/admin/suporte?salao=${c.tenantId}`}
                scroll={false}
                className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-soft"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-10 shrink-0 place-content-center rounded-full font-bold ${c.unread || c.lastAuthor === "salon" ? "bg-soft text-primary-text" : "bg-bg text-muted"}`}
                >
                  {c.salonName.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-bold">{c.salonName}</span>
                    <span className="ml-auto shrink-0 text-xs font-semibold text-muted">{fmtDate(c.lastAt)}</span>
                  </span>
                  <span className="block truncate text-sm font-semibold text-muted">
                    {c.lastAuthor === "admin" ? <strong className="text-primary-text">Você: </strong> : ""}
                    {preview(c.lastBody)}
                  </span>
                </span>
                {c.unread ? (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    {c.unread}
                    <span className="sr-only"> sem ler</span>
                  </span>
                ) : c.lastAuthor === "salon" ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-wait-bg px-2 py-0.5 text-xs font-bold text-wait">
                    <Icon name="clock" size={12} /> Sem resposta
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SupportSheet
        tenantId={open ? salao : null}
        salonName={open?.salonName ?? ""}
        messages={(open?.messages ?? []).map((m) => ({ id: m.id, author: m.author, body: m.body, createdAt: m.createdAt.toISOString() }))}
        hasUnread={!!open?.messages.some((m) => m.author === "salon" && !m.readAt)}
      />
    </AdminShell>
  );
}
