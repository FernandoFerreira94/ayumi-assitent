"use client";

import { useEffect } from "react";

/**
 * Teclado do iPhone, num lugar só para o app todo.
 *
 * No iOS o teclado não encolhe a tela: ele cobre o fim dela. Este componente mede a área visível
 * (visualViewport) e publica no <html>:
 *   --kb      parte coberta pelo teclado (px)
 *   --vvh     altura visível (px)
 *   --vv-top  quanto o iOS deslocou a área visível para cima (px)
 *   data-kb        teclado aberto
 *   data-kb-anim   teclado aberto ou fechando (mantém a transição de saída)
 * O globals.css usa isso para subir sheets (vaul) e diálogos (.notif-dialog) com transição suave,
 * e aqui o campo focado é rolado para dentro da área visível do seu container.
 */
const OPEN_MIN = 80; // menos que isso é barra de sugestões/zoom, não teclado
const ANIM_MS = 340; // um pouco mais que a transição do CSS (--kb-dur)
const FIELD =
  'input:not([type="checkbox"],[type="radio"],[type="file"],[type="hidden"],[type="range"],[type="button"],[type="submit"]),textarea,[contenteditable="true"]';

function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

function reveal(el: HTMLElement) {
  const vv = window.visualViewport;
  if (!vv || document.activeElement !== el) return;
  const sc = scrollParent(el);
  // Fora de sheet/diálogo (tela comum) o próprio iOS rola a página até o campo
  if (!sc) return;
  const margin = 16;
  const box = sc.getBoundingClientRect();
  const top = Math.max(box.top, vv.offsetTop) + margin;
  const bottom = Math.min(box.bottom, vv.offsetTop + vv.height) - margin;
  const r = el.getBoundingClientRect();
  let delta = 0;
  if (r.height > bottom - top || r.top < top) delta = r.top - top;
  else if (r.bottom > bottom) delta = r.bottom - bottom;
  if (Math.abs(delta) < 2) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  sc.scrollBy({ top: delta, behavior: smooth ? "smooth" : "auto" });
}

export function KeyboardWatcher() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let frame = 0;
    let closeTimer = 0;
    let revealTimer = 0;
    let focused: HTMLElement | null = null;
    let last = "";
    /** Rolagem da página antes de o teclado abrir: o iOS rola a página até o campo e nem sempre devolve. */
    let pageY: number | null = null;

    // Teclado fechou: devolve a página para onde estava. Sem isso o iOS deixa a tela deslocada e a folha
    // (fixed no fim da tela) fica com o fim escondido, sem dar para rolar até o botão.
    const settlePage = () => {
      if ("kb" in root.dataset) return; // abriu de novo (troca de campo): espera o próximo fechar
      const y = pageY;
      pageY = null;
      if (y === null) return;
      if (Math.abs(window.scrollY - y) > 1 || vv.offsetTop > 1) window.scrollTo(window.scrollX, y);
    };

    const scheduleReveal = (wait = ANIM_MS) => {
      window.clearTimeout(revealTimer);
      if (focused) revealTimer = window.setTimeout(() => focused && reveal(focused), wait);
    };

    const apply = () => {
      frame = 0;
      // Com zoom de pinça a área visível encolhe sem teclado: não confunde
      const zoomed = vv.scale > 1.01;
      const kb = zoomed ? 0 : Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      const h = Math.round(vv.height);
      const top = Math.max(0, Math.round(vv.offsetTop));
      const key = `${kb}|${h}|${top}`;
      if (key === last) return;
      last = key;
      const open = kb > OPEN_MIN;
      if (open && !("kbAnim" in root.dataset)) {
        // Liga as regras de transição ainda com os valores antigos e força o estilo: assim a altura e a
        // posição partem do lugar atual e animam até o novo, em vez de pular
        root.dataset.kbAnim = "";
        void root.offsetHeight;
      }
      root.style.setProperty("--kb", `${kb}px`);
      root.style.setProperty("--vvh", `${h}px`);
      root.style.setProperty("--vv-top", `${top}px`);
      if (open) {
        window.clearTimeout(closeTimer);
        root.dataset.kb = "";
        scheduleReveal();
      } else if ("kb" in root.dataset) {
        delete root.dataset.kb;
        // A transição de saída precisa do data-kb-anim até o fim
        closeTimer = window.setTimeout(() => {
          delete root.dataset.kbAnim;
          settlePage();
        }, ANIM_MS + 120);
      }
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.matches(FIELD)) return;
      focused = el;
      if (!("kb" in root.dataset) && pageY === null) pageY = window.scrollY;
      // Teclado já aberto (troca de campo): só rola. Fechado: espera ele subir (o resize chama de novo)
      scheduleReveal("kb" in root.dataset ? 60 : 600);
    };
    const onFocusOut = () => {
      focused = null;
      // Saiu do campo sem o teclado ter aberto (teclado físico): nada a devolver
      if (!("kb" in root.dataset)) pageY = null;
      window.clearTimeout(revealTimer);
    };
    // Textarea que cresce enquanto digita: mantém a linha atual à vista
    const onInput = (e: Event) => {
      if (e.target === focused && focused instanceof HTMLTextAreaElement) scheduleReveal(30);
    };

    apply();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("input", onInput);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(closeTimer);
      window.clearTimeout(revealTimer);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("input", onInput);
    };
  }, []);

  return null;
}
