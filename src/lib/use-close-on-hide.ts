import { type RefObject, useLayoutEffect } from "react";

/**
 * Fecha o <dialog> quando a tela sai de cena.
 * Com `cacheComponents`, o Next guarda a tela anterior escondida (Activity) em vez de desmontar:
 * um <dialog> aberto com showModal() continuaria modal, invisível, e deixaria a página nova
 * inteira sem responder ao toque (ex.: sair da conta com o menu aberto travava o login).
 * O cleanup do layout effect roda tanto ao desmontar quanto ao esconder a tela.
 */
export function useCloseOnHide(ref: RefObject<HTMLDialogElement | null>) {
  useLayoutEffect(
    () => () => {
      // Lido na hora do cleanup: o <dialog> pode ter montado depois deste efeito (ex.: aviso que chega depois).
      // Ao esconder, o React roda este cleanup antes de soltar a ref do filho.
      const el = ref.current;
      if (el?.open) el.close();
    },
    [ref],
  );
}
