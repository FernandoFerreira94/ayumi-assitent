import { Icon, IconTile, type IconName, type Tint } from "@/components/ui/Icon";
import { HIGHLIGHT, type Highlight } from "./styles";

/**
 * Número principal do painel: quadradinho colorido, rótulo, valor grande na fonte da marca e uma linha de apoio.
 * `tone` pinta o valor (o que precisa de atenção salta antes de ler); `alert` deixa a linha de apoio vermelha.
 */
export function KpiCard({
  icon,
  tint = "lavender",
  label,
  value,
  note,
  alert,
  tone = "fg",
}: {
  icon: IconName;
  tint?: Tint;
  label: string;
  value: string;
  note?: string;
  alert?: boolean;
  tone?: Highlight;
}) {
  return (
    <div className="grid min-w-0 content-start gap-2 rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_-16px_rgba(23,20,43,0.25)]">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <IconTile name={icon} tint={tint} /> <span className="min-w-0 truncate">{label}</span>
      </p>
      <p className={`font-brand text-[22px] leading-tight tracking-[-0.01em] tabular-nums sm:text-[28px] xl:text-2xl ${HIGHLIGHT[tone]}`}>{value}</p>
      {note ? (
        <p className={`text-xs font-semibold ${alert ? "font-bold text-fail" : "text-muted"}`}>
          {alert ? <Icon name="alert" size={12} className="mr-1 inline align-[-1px]" /> : null}
          {note}
        </p>
      ) : null}
    </div>
  );
}
