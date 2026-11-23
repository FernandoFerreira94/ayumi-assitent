import Link from "next/link";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { adminCard } from "./styles";

/**
 * Estado vazio honesto enquanto a cobrança não está no ar: diz o que vai aparecer aqui e não inventa número.
 * `what` completa a frase ("MRR, recebido, atraso e churn").
 */
export function BillingPending({ what, headingId = "billing-pending" }: { what: string; headingId?: string }) {
  return (
    <section className={adminCard} aria-labelledby={headingId}>
      <TileTitle as="h2" id={headingId} icon="wallet" tint="gray" className="text-lg">
        Cobrança ainda não está no ar
      </TileTitle>
      <p className="text-sm font-semibold text-muted">
        {what} aparecem aqui quando o Mercado Pago for ligado. Até lá não mostramos número nenhum para não enganar.
      </p>
      <Link
        href="/admin/uso"
        className="btn-glass flex min-h-11 w-fit items-center gap-2 rounded-2xl px-4 text-sm font-bold"
      >
        Ver o uso real dos salões <Icon name="arrowRight" size={16} />
      </Link>
    </section>
  );
}
