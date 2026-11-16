import { Icon, type IconName } from "@/components/ui/Icon";

/** Número principal do painel: rótulo, valor grande e uma linha de apoio (opcional, pode ter tom de alerta). */
export function KpiCard({
  icon,
  label,
  value,
  note,
  alert,
}: {
  icon: IconName;
  label: string;
  value: string;
  note?: string;
  alert?: boolean;
}) {
  return (
    <div className="grid min-w-0 content-start gap-1 rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_-16px_rgba(23,20,43,0.25)]">
      <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
        <Icon name={icon} size={16} /> {label}
      </p>
      <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {note ? (
        <p className={`text-xs font-semibold ${alert ? "text-fail" : "text-muted"}`}>
          {alert ? <Icon name="alert" size={12} className="mr-1 inline align-[-1px]" /> : null}
          {note}
        </p>
      ) : null}
    </div>
  );
}
