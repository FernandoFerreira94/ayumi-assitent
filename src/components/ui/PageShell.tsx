import Link from "next/link";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { SignOutButton } from "@/components/nav/SignOutButton";

/** `home` marca a Agenda (o dashboard); as outras telas ganham a seta de volta para ela. */
export function PageShell({
  title,
  subtitle,
  home = false,
  children,
}: {
  title: string;
  subtitle?: string;
  home?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <header className="flex items-center justify-between gap-3 px-1 pb-3 pt-2">
        {home ? null : (
          // Link fixo e não history.back(): no PWA aberto direto numa tela não há histórico para voltar
          <Link
            href="/agenda"
            aria-label="Voltar para a agenda"
            className="btn-glass -ml-1 grid size-11 shrink-0 place-content-center rounded-full"
          >
            <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm font-semibold text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div data-tour="bell">
            <NotificationBell />
          </div>
          <SignOutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
