"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { deleteCategory, saveCategory } from "./actions";
import type { Category } from "./catalog";

/** Cria (sem `category`), renomeia ou exclui uma categoria. Excluir só vale para categoria vazia. */
export function CategoryForm({
  category,
  serviceCount,
  onDone,
}: {
  category?: Category;
  serviceCount: number;
  onDone: (result: { created?: Category; deleted?: string; renamed?: Category }) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return setError("Dê um nome à categoria.");
    setBusy(true);
    const res = await saveCategory(v, category?.id);
    setBusy(false);
    if (!res.ok) {
      if (res.code === "NAME_TAKEN") return setError(`Já existe a categoria "${v}".`);
      return notify.error(res.code);
    }
    if (category) {
      notify.success("Categoria renomeada", `${category.name} agora é ${res.data.name}`);
      onDone({ renamed: res.data });
    } else {
      notify.success("Categoria criada", "Agora crie o primeiro serviço dela");
      onDone({ created: res.data });
    }
  }

  async function remove(c: Category) {
    if (serviceCount > 0) {
      return setError(
        `Mova ou exclua ${serviceCount === 1 ? "o serviço" : `os ${serviceCount} serviços`} antes de excluir a categoria.`,
      );
    }
    const res = await deleteCategory(c.id);
    if (!res.ok) return notify.error(res.code);
    onDone({ deleted: c.id });
    // A categoria volta com o mesmo nome (e um id novo): nenhum serviço apontava para ela
    notify.undoable(`Categoria ${c.name} excluída`, async () => {
      const back = await saveCategory(c.name);
      if (!back.ok) notify.error(back.code);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        Nome da categoria
        <input
          autoFocus={!category}
          autoComplete="off"
          maxLength={30}
          placeholder="Ex.: Estética"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "cat-err" : undefined}
          className="min-h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base font-semibold normal-case tracking-normal text-fg outline-none focus:border-primary aria-invalid:border-fail"
        />
      </label>
      {category ? (
        <p className="text-sm font-semibold text-muted">
          {serviceCount} {serviceCount === 1 ? "serviço" : "serviços"} nesta categoria
        </p>
      ) : null}
      {error ? (
        <p id="cat-err" role="alert" className="text-sm font-semibold text-fail">
          {error}
        </p>
      ) : null}
      <SubmitButton pending={busy} pendingLabel="Salvando…" className="rounded-full">
        {category ? "Salvar" : "Criar categoria"}
      </SubmitButton>
      {category ? (
        <button
          type="button"
          onClick={() => remove(category)}
          className="btn-glass -mt-3 min-h-12 rounded-full text-sm font-bold text-fail"
        >
          Excluir categoria
        </button>
      ) : null}
    </form>
  );
}
