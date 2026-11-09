import { BackButton } from "@/components/nav/BackButton";
import { NotificationBell } from "@/components/nav/NotificationBell";

/**
 * Telas com aba (Painel, Calendário, Clientes) não têm nada à esquerda: o menu fica no avatar da barra.
 * `back` marca as telas secundárias (abertas pelo menu ou por um atalho): a seta volta para onde a pessoa estava.
 * O sino fica sempre à direita.
 */
export function PageShell({
  title,
  subtitle,
  back = false,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 pb-3 pt-2">
        <div className="flex justify-start">
          {back ? <BackButton /> : null}
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
