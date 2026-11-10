"use client";

import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { groupByLetter } from "@/lib/groupByLetter";
import { useKeyboardInset } from "@/lib/useKeyboardInset";

export type PickerOption = { id: string; label: string; hint?: string };

/**
 * Campo que abre uma folha alta com a lista em seções A, B, C… e o índice de letras ao lado,
 * como os contatos do iPhone. O valor vai num input oculto para o <form> receber.
 */
export function LetterPicker({
  name,
  label,
  placeholder,
  options,
  defaultId,
  inputName,
  onChange,
  aside,
}: {
  /** Identifica o seletor na tela (rótulo, âncoras das letras). */
  name: string;
  label: string;
  placeholder: string;
  options: PickerOption[];
  /** Opção já escolhida ao abrir. */
  defaultId?: string;
  /** Nome do campo no formulário, quando difere de `name` (vários seletores no mesmo campo). */
  inputName?: string;
  onChange?: (id: string) => void;
  /** Ação ao lado do rótulo (ex.: tirar este serviço). */
  aside?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<PickerOption | null>(() => options.find((o) => o.id === defaultId) ?? null);

  // A busca abre o teclado: a folha encolhe acima dele para a lista filtrada continuar à vista
  const keyboard = useKeyboardInset(open);
  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return groupByLetter(q ? options.filter((o) => o.label.toLocaleLowerCase("pt-BR").includes(q)) : options);
  }, [options, query]);
  const anchor = (letter: string) => `${name}-${letter === "#" ? "num" : letter}`;

  return (
    <div className="grid gap-1 text-sm font-bold">
      {aside ? (
        <span className="flex items-center justify-between gap-2">
          <span id={`${name}-label`}>{label}</span>
          {aside}
        </span>
      ) : (
        <span id={`${name}-label`}>{label}</span>
      )}
      {/* Oculto mas validável: sem readOnly, que tiraria o campo da validação e o "required" não barraria o envio */}
      <input
        name={inputName ?? name}
        value={value?.id ?? ""}
        onChange={() => {}}
        required
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
      />
      <Drawer.NestedRoot open={open} onOpenChange={setOpen} repositionInputs={false}>
        <Drawer.Trigger
          aria-labelledby={`${name}-label`}
          className="glass flex min-h-13 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-base font-semibold"
        >
          <span className={value ? "truncate" : "truncate text-muted"}>
            {value ? value.label : placeholder}
            {value?.hint ? <span className="text-sm font-semibold text-muted"> · {value.hint}</span> : null}
          </span>
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30" />
          <Drawer.Content
            className="sheet fixed inset-x-0 bottom-0 z-60 mx-auto flex h-[88dvh] max-w-[520px] flex-col rounded-t-3xl outline-none"
            style={{ bottom: keyboard.bottom, maxHeight: keyboard.maxHeight }}
          >
            <div className="px-5 pt-4">
              <Drawer.Title className="pb-3 text-xl font-bold">{label}</Drawer.Title>
              <Drawer.Description className="sr-only">Busque pelo nome ou toque numa letra.</Drawer.Description>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar pelo nome"
                aria-label={`Buscar ${label.toLowerCase()}`}
                className="mb-2 min-h-12 w-full rounded-2xl border px-4 text-base font-semibold"
              />
            </div>
            <div className="relative min-h-0 flex-1">
              <div className="h-full overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pr-9">
                {groups.length === 0 ? (
                  <p className="py-8 text-center text-sm font-semibold text-muted">Nada encontrado para “{query}”.</p>
                ) : (
                  groups.map((g) => (
                    <section key={g.letter} id={anchor(g.letter)} aria-label={g.letter}>
                      <h3 className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] py-1 text-xs font-bold text-primary-text backdrop-blur">
                        {g.letter}
                      </h3>
                      <ul className="divide-y divide-line">
                        {g.items.map((o) => (
                          <li key={o.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setValue(o);
                                onChange?.(o.id);
                                setOpen(false);
                              }}
                              aria-pressed={value?.id === o.id}
                              className="flex min-h-13 w-full items-center justify-between gap-3 py-2 text-left"
                            >
                              <span className="grid">
                                <span className="text-base font-semibold">{o.label}</span>
                                {o.hint ? <span className="text-sm font-semibold text-muted">{o.hint}</span> : null}
                              </span>
                              {value?.id === o.id ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="size-5 text-primary-text"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                                </svg>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))
                )}
              </div>
              {groups.length > 1 ? (
                <nav aria-label="Índice de letras" className="absolute inset-y-0 right-1 flex flex-col justify-center">
                  {groups.map((g) => (
                    <a
                      key={g.letter}
                      href={`#${anchor(g.letter)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(anchor(g.letter))?.scrollIntoView({ block: "start" });
                      }}
                      className="grid min-h-5 w-7 place-items-center text-xs font-bold text-primary-text"
                    >
                      {g.letter}
                    </a>
                  ))}
                </nav>
              ) : null}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.NestedRoot>
    </div>
  );
}
