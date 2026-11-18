import { IconTile, type IconName, type Tint } from "@/components/ui/Icon";
import { unreadSupportCount } from "@/features/support/admin";
import { AdminNav } from "./AdminNav";

/** Casca das telas do painel (menu + título com o quadradinho da tela). Use só depois do requireAdmin, para não revelar o painel. */
export async function AdminShell({
  title,
  subtitle,
  icon,
  tint = "lavender",
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: IconName;
  tint?: Tint;
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex">
      <AdminNav supportUnread={await unreadSupportCount().catch(() => 0)} />
      <main className="mx-auto w-full min-w-0 max-w-[1200px] flex-1 px-4 pb-10 pt-4 md:px-8 md:pt-8">
        <header className="flex items-center gap-3 pb-5">
          {icon ? <IconTile name={icon} tint={tint} size="lg" /> : null}
          <div className="min-w-0">
            <h1 className="font-brand text-[28px] leading-tight tracking-[-0.01em] text-fg">{title}</h1>
            {subtitle ? <p className="text-sm font-semibold text-muted">{subtitle}</p> : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

/** Casca das telas de entrada (verificar, ativar): sem menu, cartão central. */
export function AdminGateShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-5 px-6 py-[max(env(safe-area-inset-top),24px)]">
      <header className="grid gap-1 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-text">Bubbly Admin</p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm font-semibold text-muted">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
