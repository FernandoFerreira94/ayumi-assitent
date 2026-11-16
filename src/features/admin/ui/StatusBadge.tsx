import type { PaymentStatus, SubscriptionStatus } from "../types";
import { PAY_STATUS, SUB_STATUS, TONE_CLASS } from "./format";

const base = "inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold";

/** Situação da assinatura: sempre com texto (cor nunca sozinha). */
export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const s = SUB_STATUS[status];
  return <span className={`${base} ${TONE_CLASS[s.tone]}`}>{s.label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAY_STATUS[status];
  return <span className={`${base} ${TONE_CLASS[s.tone]}`}>{s.label}</span>;
}
