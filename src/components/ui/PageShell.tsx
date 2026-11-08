import Link from "next/link";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { SignOutButton } from "@/components/nav/SignOutButton";

export function PageShell({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Rota do botão de voltar, à esquerda do título (páginas abertas a partir de outra) */
  back?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <header className="flex items-center justify-between gap-3 px-1 pb-3 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label}
              className="btn-glass grid h-11 w-11 shrink-0 place-items-center rounded-full"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </Link>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm font-semibold text-muted">{subtitle}</p> : null}
          </div>
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
