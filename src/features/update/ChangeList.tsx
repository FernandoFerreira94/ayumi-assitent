import { CHANGE_LABEL, type ChangeKind, type Release } from "./changelog";

const CHIP: Record<ChangeKind, string> = {
  new: "bg-soft text-primary-text",
  improved: "bg-soft text-primary-text",
  fix: "bg-soft text-primary-text",
  layout: "bg-soft text-primary-text",
  removed: "bg-white/70 text-fail",
};

/** Lista "etiqueta + frase" de uma versão. Usada no accordion de Ajustes e no diálogo de atualizado. */
export function ChangeList({ release }: { release: Release }) {
  return (
    <ul className="grid gap-2">
      {release.items.map((item) => (
        <li key={item.text} className="flex items-start gap-2 text-sm font-semibold leading-5">
          <span className={`mt-px shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[item.kind]}`}>
            {CHANGE_LABEL[item.kind]}
          </span>
          <span className="min-w-0">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
