/**
 * Total de clientes do salão no topo de /clientes (celular e desktop).
 * `shown` = quantas a lista mostra quando há busca/filtro (ou a lista foi cortada): vira "X de Y".
 */
export function ClientCount({ total, shown }: { total: number; shown: number | null }) {
  const word = (n: number) => (n === 1 ? "cliente" : "clientes");
  return (
    <p aria-live="polite" className="flex items-baseline gap-2 px-1 pb-3" data-testid="client-count">
      {shown === null ? (
        <>
          <span className="text-3xl font-bold tabular-nums text-primary-text">{total}</span>{" "}
          <span className="text-sm font-semibold text-muted">{word(total)} no total</span>
        </>
      ) : (
        <>
          <span className="text-3xl font-bold tabular-nums text-primary-text">{shown}</span>{" "}
          <span className="text-sm font-semibold text-muted">
            de {total} {word(total)}
          </span>
        </>
      )}
    </p>
  );
}
