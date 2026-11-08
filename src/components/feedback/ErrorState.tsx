"use client";

import Link from "next/link";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
};

export function ErrorState({
  title = "Não foi possível carregar",
  message = "Tivemos um problema do nosso lado. Seus dados estão salvos.",
  onRetry,
  homeHref = "/agenda",
}: Props) {
  return (
    <div role="alert" className="mx-auto grid max-w-xs justify-items-center gap-2 px-4 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-fail-bg text-fail" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-3 grid w-full gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="btn-tint min-h-12 rounded-2xl px-5 font-bold"
          >
            Tentar de novo
          </button>
        ) : null}
        <Link href={homeHref} className="grid min-h-11 place-items-center font-bold text-primary-text">
          Voltar para a agenda
        </Link>
      </div>
    </div>
  );
}
