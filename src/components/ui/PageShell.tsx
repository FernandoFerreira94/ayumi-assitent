import { BackButton } from "@/components/nav/BackButton";
import { HeaderMenu } from "@/components/nav/HeaderMenu";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { InstallHeaderButton } from "@/features/install/InstallGuide";
import { pageMainClass } from "./page-main";

/**
 * Telas do leque (Painel, Clientes, Vagas, Ajustes) e o Calendário são raiz: o avatar à esquerda abre o menu.
 * `back` marca as telas secundárias (abertas pelo menu ou por um atalho): a seta volta para onde a pessoa estava.
 * O sino fica sempre à direita.
 * Tablet e desktop: o menu lateral já mostra onde a pessoa está, então avatar e seta somem,
 * e o título vira 24 px alinhado à esquerda, com o subtítulo embaixo, como nas pranchas.
 * `wide` libera a largura toda para telas em duas colunas.
 */
export function PageShell({
  title,
  subtitle,
  back = false,
  backHref,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** Para onde a seta leva quando a tela foi aberta direto (sem histórico no app). Padrão: a agenda. */
  backHref?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={pageMainClass(wide)}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 pb-3 pt-2 md:flex md:gap-3 md:px-0 md:pb-5 md:pt-0">
        <div className="flex justify-start md:hidden">{back ? <BackButton fallback={backHref} /> : <HeaderMenu />}</div>
        <div className="flex min-w-0 flex-col text-center leading-tight md:flex-1 md:text-left">
          <h1 className="truncate text-[17px] font-bold md:text-2xl">{title}</h1>
          {subtitle ? <p className="truncate text-xs font-semibold text-muted md:text-sm">{subtitle}</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <div data-tour="bell">
            <NotificationBell />
          </div>
          <InstallHeaderButton />
        </div>
      </header>
      {children}
    </main>
  );
}
