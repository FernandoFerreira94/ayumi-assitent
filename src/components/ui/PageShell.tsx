import Link from "next/link";
import { HeaderMenu } from "@/components/nav/HeaderMenu";
import { NotificationBell } from "@/components/nav/NotificationBell";

/**
 * `home` marca a Agenda (o dashboard): o avatar à esquerda abre o menu.
 * Nas outras telas a seta de volta toma o lugar do avatar, como no iPhone. O sino fica sempre à direita.
 */
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
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 pb-3 pt-2">
        <div className="flex justify-start">
          {home ? (
            <HeaderMenu />
          ) : (
            // Link fixo e não history.back(): no PWA aberto direto numa tela não há histórico para voltar
            <Link
              href="/agenda"
              aria-label="Voltar para a agenda"
              className="btn-glass grid size-11 shrink-0 place-content-center rounded-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </Link>
          )}
        </div>
        <div className="flex min-w-0 flex-col text-center leading-tight">
          <h1 className="truncate text-[17px] font-bold">{title}</h1>
          {subtitle ? <p className="truncate text-xs font-semibold text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex justify-end">
          <div data-tour="bell">
            <NotificationBell />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
