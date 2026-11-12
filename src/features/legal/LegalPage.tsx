import Link from "next/link";
import type { ReactNode } from "react";
import { MascotSync } from "@/components/brand/MascotSync";
import { Wordmark } from "@/components/brand/Wordmark";

export const SUPPORT_EMAIL = "webcode.ff@gmail.com";
export const LEGAL_UPDATED = "12 de novembro de 2026";

/** Casca das páginas públicas (privacidade e termos): sem login, sempre com as cores da Bolha. */
export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main
      data-mascot="bolha"
      className="mx-auto min-h-dvh max-w-[640px] px-4 pb-[max(env(safe-area-inset-bottom),32px)] pt-[max(env(safe-area-inset-top),24px)]"
    >
      <MascotSync value="bolha" persist={false} />
      <header className="grid gap-4 pb-6 pt-2">
        <Link href="/login" aria-label="Ir para o bubbly" className="self-start">
          <Wordmark className="text-[34px]" />
        </Link>
        <div className="grid gap-1.5">
          <h1 className="text-[28px] font-bold leading-tight text-fg">{title}</h1>
          <p className="text-sm font-semibold text-muted">Atualizada em {LEGAL_UPDATED}</p>
        </div>
        <div className="text-[15px] leading-relaxed text-fg">{intro}</div>
      </header>
      <div className="grid gap-3">{children}</div>
      <footer className="grid gap-3 pt-8 text-center text-sm font-semibold text-muted">
        <nav className="flex justify-center gap-5">
          <Link href="/privacidade" className="min-h-11 content-center text-primary-text underline-offset-4 hover:underline">
            Privacidade
          </Link>
          <Link href="/termos" className="min-h-11 content-center text-primary-text underline-offset-4 hover:underline">
            Termos de uso
          </Link>
          <Link href="/login" className="min-h-11 content-center text-primary-text underline-offset-4 hover:underline">
            Entrar
          </Link>
        </nav>
        <p>
          Dúvidas? <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-primary-text">{SUPPORT_EMAIL}</a>
        </p>
      </footer>
    </main>
  );
}

/** Um bloco da página: cartão de vidro com título numerado. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5" aria-labelledby={`s${n}`}>
      <h2 id={`s${n}`} className="flex items-baseline gap-2.5 pb-2 text-lg font-bold leading-snug text-fg">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-soft text-sm text-primary-text">{n}</span>
        {title}
      </h2>
      <div className="grid gap-2.5 text-[15px] leading-relaxed text-fg [&_a]:font-bold [&_a]:text-primary-text [&_li]:pl-1 [&_strong]:font-bold [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
