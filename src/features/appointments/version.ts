/**
 * Impressão digital da agenda de um dia: muda quando qualquer coisa que a tela mostra muda
 * (atendimento novo, cancelado, status, horário, valor, nome; bloqueio novo ou removido).
 * Serve para avisar "tem novidade" sem precisar de coluna updated_at no banco.
 */
type Row = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  status: string;
  clientName: string;
  serviceName: string;
};
type Block = { id: string; startsAt: Date; endsAt: Date; reason: string | null };

export function dayVersion(rows: Row[], blocks: Block[]): string {
  const parts = [
    ...rows.map(
      (r) =>
        `a|${r.id}|${r.startsAt.getTime()}|${r.endsAt.getTime()}|${r.priceCents}|${r.status}|${r.clientName}|${r.serviceName}`,
    ),
    ...blocks.map((b) => `b|${b.id}|${b.startsAt.getTime()}|${b.endsAt.getTime()}|${b.reason ?? ""}`),
  ].sort();
  // FNV-1a de 32 bits: curto para trafegar a cada consulta e igual no servidor e no teste
  let h = 0x811c9dc5;
  for (const ch of parts.join("\n")) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${parts.length}-${h.toString(36)}`;
}
