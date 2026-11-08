import { NotificationBell } from "@/components/nav/NotificationBell";
import { SignOutButton } from "@/components/nav/SignOutButton";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">
      <header className="flex items-center justify-between gap-3 px-1 pb-3 pt-2">
        <div className="min-w-0">
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
