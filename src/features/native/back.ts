/** Botão voltar do Android no app da loja: fecha a folha aberta, senão volta a página, senão sai para o fundo. */
export type BackAction = "close" | "back" | "exit";

export function backAction(sheetOpen: boolean, canGoBack: boolean): BackAction {
  if (sheetOpen) return "close";
  return canGoBack ? "back" : "exit";
}

/** Folhas (vaul) e diálogos (Radix) abertos marcam data-state="open". */
export const OPEN_LAYER =
  '[data-vaul-drawer][data-state="open"], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';
