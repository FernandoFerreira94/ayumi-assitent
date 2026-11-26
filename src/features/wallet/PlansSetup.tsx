import { TileTitle } from "@/components/ui/Icon";
import { NewClientSheet } from "@/features/clients/NewClientSheet";
import { NewServiceSheet } from "@/features/services/NewServiceSheet";

/**
 * Planos sem base: pacote e promoção são montados em cima de um serviço, e pacote só se vende para uma cliente.
 * Mostra o que falta cadastrar com o botão que abre a mesma folha de Serviços/Clientes, sem sair de Planos;
 * ao salvar, a action revalida /planos e este aviso some sozinho.
 */
export function PlansSetup({ missing }: { missing: "service" | "client" }) {
  const service = missing === "service";
  return (
    <section
      aria-label={service ? "Cadastre um serviço primeiro" : "Cadastre uma cliente"}
      className="glass mb-3 grid gap-3 rounded-[1.75rem] p-5 md:grid-cols-[1fr_auto] md:items-center"
    >
      <div className="grid gap-1">
        <TileTitle as="h2" icon={service ? "scissors" : "users"} tint="lavender">
          {service ? "Cadastre um serviço primeiro" : "Cadastre uma cliente"}
        </TileTitle>
        <p className="text-sm font-semibold text-muted">
          {service
            ? "Pacotes e promoções são montados em cima dos seus serviços. Cadastre ao menos um para começar."
            : "Para vender um pacote, cadastre ao menos uma cliente."}
        </p>
      </div>
      <div className="grid md:justify-items-end">
        {service ? (
          <NewServiceSheet services={[]} label="Cadastrar serviço" />
        ) : (
          <NewClientSheet label="Cadastrar cliente" />
        )}
      </div>
    </section>
  );
}
