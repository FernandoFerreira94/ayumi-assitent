/**
 * Pix "copia e cola" estático (BR Code do Banco Central, padrão EMV), gerado aqui mesmo: sem PSP, sem custo e sem
 * dependência. A cliente cola no app do banco e já vem a chave, o valor e o nome do salão. O comprovante continua
 * sendo conferido pela dona. Arquivo puro (roda no navegador para a prévia em Ajustes).
 */

/** Chave como o Pix espera: e-mail minúsculo, telefone +55…, CPF/CNPJ só números, aleatória minúscula. null = não reconhecida. */
export function normalizePixKey(raw: string | null | undefined): string | null {
  const key = (raw ?? "").trim();
  if (!key) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return key.toLowerCase();
  if (/[^\d\s().+\-/]/.test(key)) return null;
  const d = key.replace(/\D/g, "");
  if (key.startsWith("+")) return d.length >= 12 && d.length <= 13 ? `+${d}` : null;
  // CPF com máscara (pontos) ou CPF válido; senão 11 números é celular com DDD
  if (d.length === 11) return /\./.test(key) || validCpf(d) ? (validCpf(d) ? d : null) : `+55${d}`;
  if (d.length === 14) return validCnpj(d) ? d : null;
  if (d.length === 10) return `+55${d}`;
  if (d.length === 13 && d.startsWith("55")) return `+${d}`;
  return null;
}

function validCpf(d: string): boolean {
  if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function validCnpj(d: string): boolean {
  if (!/^\d{14}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, x, i) => acc + Number(d[i]) * x, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

/** Texto aceito no nome/cidade do BR Code: sem acento, maiúsculo, só letras, números e espaço. */
const ascii = (s: string, max: number) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max)
    .trim();

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como pede o BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(payload)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Código "copia e cola" com valor fixo. null quando a chave não é reconhecida ou falta o nome do recebedor
 * (aí a mensagem leva só a chave em texto, como antes).
 */
export function pixCopyPaste(opts: { key: string | null | undefined; name: string | null | undefined; city?: string | null; cents: number }): string | null {
  const key = normalizePixKey(opts.key);
  const name = ascii(opts.name ?? "", 25);
  if (!key || !name || !(opts.cents > 0)) return null;
  const city = ascii(opts.city ?? "", 15) || "BRASIL";
  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", key)) +
    field("52", "0000") +
    field("53", "986") +
    field("54", (opts.cents / 100).toFixed(2)) +
    field("58", "BR") +
    field("59", name) +
    field("60", city) +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
}
