import Link from "next/link";
import { withTenant } from "@/db/client";
import { FeedbackCard } from "@/features/launch/FeedbackCard";
import { needsFeedback } from "@/features/launch/feedback-core";
import { errCode, log } from "@/lib/log";
import { liveNoticesFor, unreadSupportReplies } from "../core";
import type { PlatformNotice } from "../rules";
import { NoticeCard } from "./NoticeCard";

/**
 * Topo do Painel: avisos do dono (manutenção, novidade), "o suporte respondeu" e o cartão de feedback do lançamento. Falha aqui nunca derruba o
 * Painel: sem dados, não mostra nada.
 */
export async function PlatformNotices({ tenantId, userId }: { tenantId: string; userId: string }) {
  let notices: PlatformNotice[] = [];
  let replies = 0;
  let askFeedback = false;
  try {
    ({ notices, replies, askFeedback } = await withTenant(tenantId, async (tx) => ({
      notices: await liveNoticesFor(tx, userId),
      replies: await unreadSupportReplies(tx),
      askFeedback: await needsFeedback(tx, tenantId, userId),
    })));
  } catch (e) {
    log("warn", "platform_notices_failed", errCode(e));
  }
  if (!notices.length && !replies && !askFeedback) return null;
  return (
    <div className="mb-4 grid gap-2">
      {replies ? (
        <Link href="/ajustes/suporte" className="glass flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-tight">O suporte respondeu</span>
            <span className="block text-sm font-semibold text-muted">Toque para ler a resposta.</span>
          </span>
        </Link>
      ) : null}
      {notices.map((n) => (
        <NoticeCard key={n.id} id={n.id} title={n.title} body={n.body} tone={n.tone} />
      ))}
      {askFeedback ? <FeedbackCard /> : null}
    </div>
  );
}
