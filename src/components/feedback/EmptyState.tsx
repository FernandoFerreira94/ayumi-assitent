import type { ReactNode } from "react";

type Props = { title: string; description?: string; action?: ReactNode; icon?: ReactNode };

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="mx-auto grid max-w-xs justify-items-center gap-2 px-4 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-soft text-primary-text" aria-hidden="true">
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="3.5" y="5" width="17" height="15" rx="4.5" />
            <path d="M8 3v3.5M16 3v3.5M3.5 10h17" />
          </svg>
        )}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
