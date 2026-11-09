"use client";

/**
 * Interruptor no estilo do iPhone: verde e com a bolinha à direita quando ligado, cinza e à esquerda quando desligado.
 * É um botão `role="switch"`, então leitor de tela e teclado funcionam sem nada a mais.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  busy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Nome acessível (o texto visível fica ao lado, fora do botão). */
  label: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 ${
        checked ? "bg-[#34c759]" : "bg-[#d4d1de]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 grid size-7 place-content-center rounded-full bg-white shadow-[0_2px_5px_rgba(23,20,43,0.3)] transition-transform duration-200 ease-[var(--spring,ease)] ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {busy ? <span className="spin" aria-hidden="true" /> : null}
      </span>
    </button>
  );
}
