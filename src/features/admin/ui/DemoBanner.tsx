import { Icon } from "@/components/ui/Icon";

/** Aviso fixo enquanto o painel mostra dados inventados (a cobrança ainda não está no ar). */
export function DemoBanner() {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait">
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      <span>
        <strong>Dados de exemplo.</strong> Os números são inventados para ver o painel funcionando. Os reais entram
        quando a cobrança estiver no ar.
      </span>
    </p>
  );
}
