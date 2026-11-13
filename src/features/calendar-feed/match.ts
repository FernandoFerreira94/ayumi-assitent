/**
 * Evento de fora (iPhone/Google) parece um atendimento? Compara o título com as clientes e os serviços
 * cadastrados. Regra pura e conservadora: sem cliente reconhecida, não é atendimento (fica "outro evento").
 */

export type MatchClient = { id: string; name: string };
export type MatchService = { id: string; name: string };
export type EventGuess = { clientId: string; clientName: string; serviceIds: string[]; serviceNames: string[] };

/** minúsculas, sem acento, só letras/números separados por um espaço */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** `needle` aparece em `hay` como palavras inteiras (nunca "ana" dentro de "mariana"). */
function hasWords(hay: string, needle: string): boolean {
  if (!needle) return false;
  return ` ${hay} `.includes(` ${needle} `);
}

export function guessAppointment(title: string, clients: MatchClient[], services: MatchService[]): EventGuess | null {
  const t = norm(title);
  if (!t) return null;

  // 1) nome completo (ou nome + sobrenome) no título; 2) só o primeiro nome, se for único entre as clientes
  const full = clients.filter((c) => {
    const n = norm(c.name).split(" ");
    return n.length > 1 && hasWords(t, n.slice(0, 2).join(" "));
  });
  let client: MatchClient | undefined = full.length === 1 ? full[0] : undefined;
  if (!client && full.length === 0) {
    const firstCount = new Map<string, number>();
    for (const c of clients) {
      const f = norm(c.name).split(" ")[0];
      if (f) firstCount.set(f, (firstCount.get(f) ?? 0) + 1);
    }
    const byFirst = clients.filter((c) => {
      const f = norm(c.name).split(" ")[0];
      return f.length >= 3 && firstCount.get(f) === 1 && hasWords(t, f);
    });
    if (byFirst.length === 1) client = byFirst[0];
  }
  if (!client) return null;

  // Serviços: o nome mais longo primeiro, sem reaproveitar as mesmas palavras ("Corte e escova" antes de "Corte")
  let rest = t;
  const found: MatchService[] = [];
  for (const s of [...services].sort((a, b) => norm(b.name).length - norm(a.name).length)) {
    const n = norm(s.name);
    if (n.length >= 3 && hasWords(rest, n)) {
      found.push(s);
      rest = ` ${rest} `.replace(` ${n} `, " ").trim();
    }
  }
  return {
    clientId: client.id,
    clientName: client.name,
    serviceIds: found.map((s) => s.id),
    serviceNames: found.map((s) => s.name),
  };
}
