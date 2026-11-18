"use client";

import { notify } from "@/components/feedback/toast";
import { ERROR_MESSAGES } from "@/lib/errors";

/** Lista dos códigos de recuperação, mostrada uma única vez, com botão de copiar. */
export function BackupCodes({ codes }: { codes: string[] }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      notify.success("Códigos copiados", "Guarde num lugar seguro, como o gerenciador de senhas.");
    } catch {
      notify.problem(ERROR_MESSAGES.CLIPBOARD);
    }
  }
  return (
    <div className="grid gap-3">
      <p className="rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait">
        Estes códigos aparecem só agora. Cada um vale uma vez, se você perder o celular.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-base font-semibold" aria-label="Códigos de recuperação">
        {codes.map((c) => (
          <li key={c} className="rounded-xl bg-soft px-3 py-2 text-center">
            {c}
          </li>
        ))}
      </ul>
      <button type="button" onClick={copy} className="btn-tint min-h-12 rounded-2xl px-5 font-bold">
        Copiar códigos
      </button>
    </div>
  );
}
