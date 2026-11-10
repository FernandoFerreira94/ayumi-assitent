import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Desenho que resume a tela vazia (cada tela tem o seu). */
  icon?: IconName;
};

export function EmptyState({ title, description, action, icon = "calendar" }: Props) {
  return (
    <div className="mx-auto grid max-w-xs justify-items-center gap-2 px-4 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-soft text-primary-text" aria-hidden="true">
        <Icon name={icon} size={30} />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
