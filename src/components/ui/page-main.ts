const MAIN = "mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)] md:px-6 md:pb-10 md:pt-7";

/** Classe do <main> das telas e dos loading.tsx: a tela carregando tem a mesma largura da pronta. */
export function pageMainClass(wide = false): string {
  return wide ? `${MAIN} md:max-w-none lg:px-8` : `${MAIN} md:max-w-[720px]`;
}
