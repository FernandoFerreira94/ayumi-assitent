import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { withTenant } from "@/db/client";
import { SUPPORT_EMAIL } from "@/features/legal/LegalPage";
import { markSupportRead, sendSupport } from "@/features/support/actions";
import { listSupportMessages, unreadSupportReplies } from "@/features/support/core";
import { FAQ } from "@/features/support/ui/faq";
import { MarkRead, SupportThread } from "@/features/support/ui/SupportThread";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Ajuda e suporte" };

const WHATSAPP = "https://wa.me/5512997041551?text=" + encodeURIComponent("Olá! Preciso de ajuda com o Bubbly.");

/** Ajustes > Ajuda e suporte: conversa com o suporte (resposta chega aqui e no celular), dúvidas comuns e contatos. */
export default async function SuportePage() {
  const { tenantId } = await requireTenant();
  const { messages, unread } = await withTenant(tenantId, async (tx) => ({
    messages: await listSupportMessages(tx),
    unread: await unreadSupportReplies(tx),
  }));

  return (
    <PageShell back backHref="/ajustes" title="Ajuda e suporte">
      {unread > 0 ? <MarkRead run={markSupportRead} /> : null}
      <section aria-labelledby="fale" className="grid gap-2">
        <h2 id="fale" className="px-3 text-xs font-bold uppercase tracking-wide text-muted">
          Fale com a gente
        </h2>
        <SupportThread
          me="salon"
          label="Mensagem para o suporte"
          send={sendSupport}
          empty="Conte o que aconteceu ou o que você precisa. A resposta chega aqui e no seu celular."
          messages={messages.map((m) => ({ id: m.id, author: m.author, body: m.body, createdAt: m.createdAt.toISOString() }))}
          className="glass max-h-[60dvh]"
        />
      </section>

      <section aria-labelledby="duvidas" className="mt-7 grid gap-2">
        <h2 id="duvidas" className="px-3 text-xs font-bold uppercase tracking-wide text-muted">
          Dúvidas comuns
        </h2>
        <div className="glass divide-y divide-line overflow-hidden rounded-[1.4rem]">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-4">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{f.q}</span>
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </summary>
              <p className="pb-3 text-sm font-semibold text-muted">
                {f.a}{" "}
                {f.href ? (
                  <Link href={f.href} className="inline-flex min-h-11 items-center font-bold text-primary-text underline">
                    {f.link}
                  </Link>
                ) : null}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="contato" className="mt-7 grid gap-2">
        <h2 id="contato" className="px-3 text-xs font-bold uppercase tracking-wide text-muted">
          Outros contatos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-bold">
            WhatsApp do suporte
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-bold">
            Mandar e-mail
          </a>
        </div>
      </section>
    </PageShell>
  );
}
