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
      <header className="px-1 pb-3 pt-2">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm font-semibold text-muted">{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}
