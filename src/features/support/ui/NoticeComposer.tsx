"use client";

import { useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { createPlatformNotice, endPlatformNotice, reopenPlatformNotice } from "../admin-actions";

const FIELD = "min-h-12 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-base font-semibold";

/** Formulário do aviso, com prévia de como fica no Painel. Publica para todos os salões de uma vez. */
export function NoticeComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<"info" | "important">("info");
  const [days, setDays] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createPlatformNotice({ title, body, tone, days }).catch(() => null);
      if (res?.ok) {
        notify.success("Aviso publicado", "Já aparece no Painel dos salões.");
        setTitle("");
        setBody("");
        setDays("");
        setTone("info");
        setError(null);
      } else {
        setError(res && !res.ok && res.field ? res.field : null);
        notify.error(res && !res.ok ? res.code : "NETWORK");
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1 text-sm font-bold">
        Título
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          aria-invalid={error === "title"}
          className={FIELD}
          placeholder="Ex.: Manutenção hoje às 23h"
        />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Texto
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={400}
          required
          rows={4}
          aria-invalid={error === "body"}
          className={`${FIELD} resize-y`}
          placeholder="O que muda para o salão e o que ele precisa fazer (se precisar)."
        />
      </label>
      <span aria-live="polite" className="-mt-2 text-right text-xs font-semibold text-muted">
        {body.length}/400
      </span>
      <fieldset className="grid gap-2">
        <legend className="pb-1 text-sm font-bold">Tipo</legend>
        <div className="flex gap-2">
          {(["info", "important"] as const).map((t) => (
            <label
              key={t}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-line px-3 text-sm font-bold has-[:checked]:border-primary has-[:checked]:bg-soft has-[:checked]:text-primary-text"
            >
              <input type="radio" name="tone" value={t} checked={tone === t} onChange={() => setTone(t)} className="sr-only" />
              {t === "info" ? "Aviso" : "Importante"}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1 text-sm font-bold">
        Sai sozinho depois de
        <select value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={error === "days"} className={FIELD}>
          <option value="">Só quando eu encerrar</option>
          <option value="1">1 dia</option>
          <option value="3">3 dias</option>
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
        </select>
      </label>
      {title || body ? (
        <div aria-label="Prévia" className="rounded-2xl border border-dashed border-line p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-text">
            {tone === "important" ? "Importante" : "Aviso do Bubbly"}
          </p>
          <p className="font-bold">{title || "Título"}</p>
          <p className="whitespace-pre-line text-sm font-semibold text-muted">{body || "Texto"}</p>
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="btn-tint min-h-12 rounded-2xl px-4 font-bold disabled:opacity-60">
        {pending ? "Publicando…" : "Publicar para todos"}
      </button>
    </form>
  );
}

export function EndNoticeButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  function end() {
    start(async () => {
      const res = await endPlatformNotice(id).catch(() => null);
      if (res?.ok)
        notify.undoable("Aviso encerrado", () => {
          void reopenPlatformNotice(id).then((r) => (r.ok ? notify.success("Aviso de volta ao ar") : notify.error(r.code)));
        }, "Saiu do Painel dos salões.");
      else notify.error(res && !res.ok ? res.code : "NETWORK", end);
    });
  }
  return (
    <button
      type="button"
      onClick={end}
      disabled={pending}
      aria-label={`Encerrar aviso: ${title}`}
      className="btn-glass min-h-11 rounded-xl px-3 text-sm font-bold disabled:opacity-60"
    >
      {pending ? "Encerrando…" : "Encerrar"}
    </button>
  );
}
