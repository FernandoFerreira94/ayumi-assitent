/**
 * Cliente vizinha na lista para os atalhos j/k da ficha fixa.
 * Para nas pontas (não dá a volta); sem cliente aberta, ou se ela saiu da lista filtrada, começa pela ponta do sentido.
 */
export function neighborId(ids: readonly string[], current: string | null, delta: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const i = current ? ids.indexOf(current) : -1;
  if (i === -1) return delta === 1 ? ids[0] : ids[ids.length - 1];
  return ids[Math.min(ids.length - 1, Math.max(0, i + delta))];
}
