/** Máscara brasileira: (11) 98765-4321 ou (11) 3456-7890. */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  const rest = d.slice(2);
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${rest}`;
  return `(${d.slice(0, 2)}) ${d.length <= 10 ? rest.slice(0, 4) + "-" + rest.slice(4) : rest.slice(0, 5) + "-" + rest.slice(5)}`;
}

/** Telefone BR em E.164 (+55...). Retorna null se incompleto. */
export function toE164(value: string): string | null {
  // Aceita +55, 0 inicial e prefixo de operadora (015...), comuns em contatos antigos.
  let d = value.replace(/\D/g, "");
  if (d.startsWith("0")) {
    d = d.replace(/^0+/, "");
    if (d.length === 12 || d.length === 13) d = d.slice(2);
  }
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? `+55${d}` : null;
}
