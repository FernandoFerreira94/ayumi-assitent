"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { messageFor, type ActionResult } from "@/lib/errors";
import { maskMoney } from "@/lib/money";
import { createExpense } from "./actions";
import { EXPENSE_CATEGORIES } from "./expenses";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold";

/** Lança um gasto num sheet sobre a tela, sem trocar de página. */
export function NewExpenseSheet({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await createExpense(prev, fd);
    if (res.ok) {
      notify.success("Gasto lançado");
      setAmount("");
      setOpen(false);
    } else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok ? state : null;

  return (
    <Drawer.Root repositionInputs={false} open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="btn-tint min-h-12 w-full rounded-full px-4 text-sm font-bold">
        Lançar gasto
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
        >
          <Drawer.Title className="pb-1 text-xl font-bold">Lançar gasto</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Produtos, aluguel, contas… o que saiu do caixa do estúdio.
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">
              Valor (R$)
              <input
                name="amount"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(maskMoney(e.target.value))}
                placeholder="0,00"
                className={input}
                aria-invalid={err?.field === "amount"}
                autoComplete="off"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Categoria
              <select name="category" required defaultValue="produtos" className={input}>
                {EXPENSE_CATEGORIES.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Dia
              <input name="spentOn" type="date" required defaultValue={date} className={input} />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Observação (opcional)
              <input name="note" maxLength={80} placeholder="Ex.: Esmaltes" className={input} autoComplete="off" />
            </label>
            {err?.code === "VALIDATION" ? (
              <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                {err.field === "amount" ? "Informe um valor maior que zero." : messageFor("VALIDATION")}
              </p>
            ) : null}
            <SubmitButton pendingLabel="Lançando…">Lançar</SubmitButton>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
