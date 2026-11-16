/** Contatos da agenda do celular (plugin @capacitor-community/contacts) → linhas cruas para o import de clientes. */
export type DeviceRaw = { name: string; phone: string; email?: string };

type Name = { display?: string | null; given?: string | null; middle?: string | null; family?: string | null };
export type DeviceContact = {
  name?: Name | null;
  phones?: { number?: string | null }[] | null;
  emails?: { address?: string | null }[] | null;
};

export const MAX_DEVICE_ROWS = 5000;

export function contactName(n: Name | null | undefined): string {
  if (!n) return "";
  const display = n.display?.trim();
  if (display) return display;
  return [n.given, n.middle, n.family]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ");
}

/** Um contato com vários telefones vira uma linha por telefone (igual ao .vcf). Sem telefone fica de fora. */
export function flattenContacts(list: DeviceContact[]): DeviceRaw[] {
  const out: DeviceRaw[] = [];
  for (const c of list) {
    const name = contactName(c.name);
    const email = c.emails?.find((e) => e.address?.trim())?.address?.trim();
    for (const p of c.phones ?? []) {
      const phone = p.number?.trim();
      if (!phone) continue;
      out.push({ name, phone, ...(email ? { email } : {}) });
      if (out.length >= MAX_DEVICE_ROWS) return out;
    }
  }
  return out;
}
