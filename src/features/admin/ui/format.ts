import { formatBRL } from "@/lib/dates";
import type { PaymentMethod, PaymentStatus, SubscriptionStatus } from "../types";

export { formatBRL };

const TZ = "America/Sao_Paulo";
const dayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "short" });
const monthLongFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });

export const fmtDate = (d: Date | null) => (d ? dayFmt.format(d) : "—");
export const fmtShort = (d: Date | null) => (d ? shortFmt.format(d).replace(".", "") : "—");
/** 'YYYY-MM' ou 'YYYY-MM-01' → "nov". */
export const fmtMonthShort = (m: string) => monthFmt.format(new Date(`${m.slice(0, 7)}-15T12:00:00Z`)).replace(".", "");
/** 'YYYY-MM' → "Novembro de 2026". */
export const fmtMonthLong = (m: string) => {
  const s = monthLongFmt.format(new Date(`${m.slice(0, 7)}-15T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtPct = (n: number) => new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(n);

export const METHOD_LABEL: Record<PaymentMethod, string> = { card: "Cartão", pix: "Pix" };

type Tone = "ok" | "wait" | "fail" | "info" | "off";
export const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  wait: "bg-wait-bg text-wait",
  fail: "bg-fail-bg text-fail",
  info: "bg-soft text-primary-text",
  off: "bg-line text-muted",
};

export const SUB_STATUS: Record<SubscriptionStatus, { label: string; tone: Tone }> = {
  trialing: { label: "Teste", tone: "info" },
  active: { label: "Ativa", tone: "ok" },
  past_due: { label: "Em atraso", tone: "fail" },
  read_only: { label: "Só leitura", tone: "wait" },
  canceled: { label: "Cancelada", tone: "off" },
  expired: { label: "Expirada", tone: "off" },
};

export const PAY_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  approved: { label: "Aprovado", tone: "ok" },
  pending: { label: "Pendente", tone: "wait" },
  rejected: { label: "Recusado", tone: "fail" },
  refunded: { label: "Estornado", tone: "off" },
  charged_back: { label: "Contestado", tone: "fail" },
  cancelled: { label: "Cancelado", tone: "off" },
  expired: { label: "Expirado", tone: "off" },
};
