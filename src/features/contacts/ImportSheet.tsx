"use client";

import { useRef, useState, useTransition } from "react";
import { Drawer } from "vaul";
import { useKeyboardInset } from "@/lib/useKeyboardInset";
import { notify } from "@/components/feedback/toast";
import type { ActionResult } from "@/lib/errors";
import { maskPhone } from "@/lib/phone";
import { importSelected, previewFromFile, previewFromGoogle } from "./actions";
import type { Preview } from "./core";

type PreviewRes = ActionResult<{ list: Preview; ignored: number }>;

const btn =
  "glass min-h-12 w-full rounded-2xl px-4 py-2 text-left font-bold transition-transform active:scale-[0.99] disabled:opacity-60";

export function ImportSheet() {
  const [open, setOpen] = useState(false);
  const keyboard = useKeyboardInset(open);
  const [list, setList] = useState<Preview | null>(null);
  const [ignored, setIgnored] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setList(null);
    setIgnored(0);
    setPicked(new Set());
  }

  function receive(res: PreviewRes, retry: () => void) {
    if (!res.ok) {
      notify.error(res.code, retry);
      return;
    }
    const { list: l, ignored: ig } = res.data;
    setList(l);
    setIgnored(ig);
    setPicked(new Set(l.filter((c) => !c.exists).map((c) => c.phone)));
  }

  function fromGoogle() {
    start(async () => receive(await previewFromGoogle(), fromGoogle));
  }

  function fromFile(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    start(async () => receive(await previewFromFile(fd), () => fromFile(file)));
  }

  function doImport() {
    const chosen = (list ?? [])
      .filter((c) => picked.has(c.phone))
      .map(({ name, phone, email }) => ({ name, phone, email }));
    start(async () => {
      const res = await importSelected(chosen);
      if (!res.ok) return void notify.error(res.code, doImport);
      notify.success(res.data.created === 1 ? "1 cliente importada" : `${res.data.created} clientes importadas`);
      setOpen(false);
      reset();
    });
  }

  const fresh = (list ?? []).filter((c) => !c.exists);
  const allOn = fresh.length > 0 && fresh.every((c) => picked.has(c.phone));

  return (
    <Drawer.Root
      repositionInputs={false}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Drawer.Trigger className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v10M8 10l4 4 4-4M5 17v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V17" />
        </svg>
        Importar
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-[520px] flex-col rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
          style={keyboard}
        >
          <Drawer.Title className="pb-1 text-xl font-bold">Importar clientes</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {list ? "Escolha quem entra na sua lista." : "Traga seus contatos sem digitar um por um."}
          </Drawer.Description>

          {!list ? (
            <div className="grid gap-2" aria-busy={pending}>
              <button type="button" className={btn} onClick={fromGoogle} disabled={pending}>
                {pending ? "Buscando…" : "Do Google Contatos"}
                <span className="block text-sm font-semibold text-muted">Usa a conta Google conectada</span>
              </button>
              <button type="button" className={btn} onClick={() => fileRef.current?.click()} disabled={pending}>
                De um arquivo (.vcf ou .csv)
                <span className="block text-sm font-semibold text-muted">Exportado do celular ou de planilha</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".vcf,.csv,text/vcard,text/csv"
                className="hidden"
                aria-label="Arquivo de contatos"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) fromFile(f);
                }}
              />
            </div>
          ) : list.length === 0 ? (
            <div className="grid gap-3">
              <p className="font-semibold">Nenhum contato com nome e telefone válido foi encontrado.</p>
              <button type="button" className={btn} onClick={reset}>
                Voltar
              </button>
            </div>
          ) : (
            <>
              <label className="flex min-h-11 items-center gap-3 pb-2 font-bold">
                <input
                  type="checkbox"
                  checked={allOn}
                  onChange={() => setPicked(allOn ? new Set() : new Set(fresh.map((c) => c.phone)))}
                  className="size-5 accent-[var(--color-primary)]"
                />
                Selecionar todas ({fresh.length})
              </label>
              <ul className="-mx-1 grid flex-1 gap-1 overflow-y-auto px-1">
                {list.map((c) => (
                  <li key={c.phone}>
                    <label className="glass flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2">
                      <input
                        type="checkbox"
                        disabled={c.exists}
                        checked={picked.has(c.phone)}
                        onChange={(e) =>
                          setPicked((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(c.phone);
                            else n.delete(c.phone);
                            return n;
                          })
                        }
                        className="size-5 accent-[var(--color-primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{c.name}</span>
                        <span className="block text-sm font-semibold text-muted">
                          {maskPhone(c.phone.replace(/^\+55/, ""))}
                          {c.exists ? " · já cadastrada" : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {ignored > 0 && (
                <p className="pt-2 text-sm font-semibold text-muted">
                  {ignored} contato(s) sem nome ou com telefone inválido foram ignorados.
                </p>
              )}
              <button
                type="button"
                onClick={doImport}
                disabled={pending || picked.size === 0}
                aria-busy={pending}
                className="btn-tint mt-3 min-h-13 w-full rounded-2xl px-4 font-bold disabled:opacity-60"
              >
                {pending ? "Importando…" : `Importar ${picked.size}`}
              </button>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
