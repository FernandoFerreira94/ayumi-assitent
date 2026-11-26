import { Icon } from "@/components/ui/Icon";
import { LAUNCH_NOTICE } from "./launch";

/**
 * Aviso fixo do lançamento grátis. Mesma frase no login, no "Tudo pronto" e em Ajustes, para a dona
 * nunca ser pega de surpresa: enquanto não há data de cobrança, dizemos que não há nenhuma marcada.
 * Quando a cobrança tiver data, ela é anunciada por Admin › Avisos e este texto muda em `launch.ts`.
 */
export function LaunchNotice({ className = "" }: { className?: string }) {
  return (
    <p
      role="note"
      className={`glass flex items-start gap-2.5 rounded-2xl px-4 py-3 text-left text-sm text-muted ${className}`}
    >
      <span className="mt-0.5 shrink-0 text-primary-text" aria-hidden="true">
        <Icon name="sparkles" size={16} />
      </span>
      <span>
        <strong className="font-bold text-fg">{LAUNCH_NOTICE.title}.</strong> {LAUNCH_NOTICE.text}
      </span>
    </p>
  );
}
