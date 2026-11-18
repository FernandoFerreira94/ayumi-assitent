import Link from "next/link";
import { IconTile } from "@/components/ui/Icon";
import { withTenant } from "@/db/client";
import { errCode, log } from "@/lib/log";
import { liveNoticesFor, unreadSupportReplies } from "../core";
import type { PlatformNotice } from "../rules";
import { NoticeCard } from "./NoticeCard";

/**
 * Topo do Painel: avisos do dono (manutenção, novidade) e "o suporte respondeu". Falha aqui nunca derruba o
 * Painel: sem dados, não mostra nada.
 */
export async function PlatformNotices({ tenantId, userId }: { tenantId: string; userId: string }) {
  let notices: PlatformNotice[] = [];
  let replies = 0;
  try {
    ({ notices, replies } = await withTenant(tenantId, async (tx) => ({
      notices: await liveNoticesFor(tx, userId),
      replies: await unreadSupportReplies(tx),
    })));
  } catch (e) {
    log("warn", "platform_notices_failed", errCode(e));
  }
  if (!notices.length && !replies) return null;
  return (
    <div className="mb-4 grid gap-2">
      {replies ? (
        <Link href="/ajustes/suporte" className="glass flex min-h-16 items-center gap-3 rounded-[1.4rem] px-4 py-3 active:bg-soft">
          <IconTile name="chat" tint="teal" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-tight">O suporte respondeu</span>
            <span className="block text-sm font-semibold text-muted">
              {replies === 1 ? "Toque para ler a resposta." : `${replies} respostas novas. Toque para ler.`}
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : null}
      {notices.map((n) => (
        <NoticeCard key={n.id} id={n.id} title={n.title} body={n.body} tone={n.tone} />
      ))}
    </div>
  );
}
