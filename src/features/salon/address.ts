import { z } from "zod";

/**
 * Endereço do estúdio (Ajustes > Endereço). Arquivo puro: a tela, a action e os textos do WhatsApp usam as mesmas
 * regras. A linha pronta (`formatAddress`) fica salva em `tenants.address` e vai no convite da cliente (.ics), no
 * evento do Google e nas chaves {endereco}/{mapa} das mensagens.
 */

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export type Uf = (typeof UFS)[number];

export type StudioAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export const EMPTY_ADDRESS: StudioAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

/** Só os 8 dígitos do CEP. */
export const cepDigits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

/** "12345678" → "12345-678" enquanto digita. */
export function maskCep(v: string): string {
  const d = cepDigits(v);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const text = (max: number) => z.string().trim().max(max);

export const addressInput = z.object({
  cep: z
    .string()
    .transform(cepDigits)
    .refine((d) => d.length === 8, "CEP com 8 números"),
  street: text(120).min(2, "Informe a rua"),
  number: text(10).min(1, "Informe o número (ou s/n)"),
  complement: text(60),
  district: text(80).min(1, "Informe o bairro"),
  city: text(80).min(2, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((s): s is Uf => (UFS as readonly string[]).includes(s), "Escolha a UF"),
});
export type AddressInput = z.infer<typeof addressInput>;

/** "Rua X, 430, Sala 2 - Centro, São José dos Campos - SP, 12245-000" (vazio se não há rua). */
export function formatAddress(a: Partial<StudioAddress>): string {
  const street = a.street?.trim();
  if (!street) return "";
  const first = [street, a.number?.trim(), a.complement?.trim()].filter(Boolean).join(", ");
  const cityUf = [a.city?.trim(), a.state?.trim()].filter(Boolean).join(" - ");
  const cep = a.cep ? maskCep(a.cep) : "";
  return [[first, a.district?.trim()].filter(Boolean).join(" - "), cityUf, cep.length === 9 ? cep : ""]
    .filter(Boolean)
    .join(", ");
}

/** Link do mapa (abre o Google Maps no app ou no navegador, em iPhone e Android). */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/** Resposta do ViaCEP (https://viacep.com.br) → campos do formulário. null = CEP inexistente ou resposta estranha. */
export function fromViaCep(json: unknown): Omit<StudioAddress, "number" | "complement"> | null {
  if (!json || typeof json !== "object") return null;
  const r = json as Record<string, unknown>;
  if (r.erro) return null;
  const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string).trim() : "");
  const cep = cepDigits(s("cep"));
  const state = s("uf").toUpperCase();
  if (cep.length !== 8 || !(UFS as readonly string[]).includes(state)) return null;
  return { cep, street: s("logradouro"), district: s("bairro"), city: s("localidade"), state };
}
