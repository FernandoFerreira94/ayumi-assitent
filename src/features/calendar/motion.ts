/**
 * Zoom contínuo entre as visões do Calendário (ano ↔ mês ↔ dia), como no iPhone.
 * A visão que sai vira uma cópia estática (fantasma) presa na tela; a que entra cresce a partir
 * do mês/dia tocado (ou a que sai encolhe até ele). Web Animations nativo, sem dependência.
 */

export const EASE = "cubic-bezier(0.2, 0.85, 0.25, 1)";
const ZOOM_MS = 440;

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type Ghost = { node: HTMLElement; rect: DOMRect; scrolls: [number, number, number][] };

/** Copia a visão atual (com a rolagem lateral dos filhos, ex. faixa da semana) para animar a saída. */
export function captureGhost(layer: HTMLElement): Ghost {
  const rect = layer.getBoundingClientRect();
  const node = layer.cloneNode(true) as HTMLElement;
  node.removeAttribute("id");
  node.setAttribute("aria-hidden", "true");
  node.inert = true;
  node.querySelectorAll(".cal-fab").forEach((n) => n.remove());
  const scrolls: [number, number, number][] = [];
  const src = layer.querySelectorAll<HTMLElement>("*");
  src.forEach((el, i) => {
    if (el.scrollLeft || el.scrollTop) scrolls.push([i, el.scrollLeft, el.scrollTop]);
  });
  return { node, rect, scrolls };
}

function mountGhost(host: HTMLElement, g: Ghost) {
  Object.assign(g.node.style, {
    position: "fixed",
    left: `${g.rect.left}px`,
    top: `${g.rect.top}px`,
    width: `${g.rect.width}px`,
    margin: "0",
    pointerEvents: "none",
    zIndex: "6",
    transformOrigin: "0 0",
  });
  host.appendChild(g.node);
  if (g.scrolls.length) {
    const all = g.node.querySelectorAll<HTMLElement>("*");
    for (const [i, left, top] of g.scrolls) {
      const el = all[i];
      if (!el) continue;
      el.scrollLeft = left;
      el.scrollTop = top;
    }
  }
}

const box = (r: DOMRect) => ({ x: r.left, y: r.top, w: r.width });

/**
 * `in`: a nova visão nasce do tamanho de `anchor` (o mês/dia tocado na visão antiga) e cresce até a tela.
 * `out`: a visão antiga encolhe até `anchor` (o mês/dia correspondente na visão nova), que surge por trás.
 * `fade`: troca simples (sem âncora, ex. "Hoje" para um mês distante).
 */
export function zoom({
  host,
  layer,
  ghost,
  anchor,
  dir,
}: {
  host: HTMLElement;
  layer: HTMLElement;
  ghost: Ghost;
  anchor: DOMRect | null;
  dir: "in" | "out" | "fade";
}) {
  mountGhost(host, ghost);
  const done = () => {
    ghost.node.remove();
    document.documentElement.classList.remove("cal-zooming");
  };
  document.documentElement.classList.add("cal-zooming");
  const to = layer.getBoundingClientRect();

  if (reducedMotion() || dir === "fade" || !anchor || anchor.width < 1) {
    const ms = reducedMotion() ? 160 : 260;
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: "ease-out" });
    ghost.node.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: ms,
      easing: "ease-out",
      fill: "forwards",
    }).onfinish = done;
    return;
  }

  const opts: KeyframeAnimationOptions = { duration: ZOOM_MS, easing: EASE, fill: "both" };
  const a = box(anchor);
  layer.style.transformOrigin = "0 0";

  if (dir === "in") {
    const T = box(to);
    const s = a.w / T.w;
    const k = 1 / s;
    // nova visão: do retângulo tocado até a tela
    layer.animate(
      [
        { transform: `translate(${a.x - T.x}px, ${a.y - T.y}px) scale(${s})`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: "none", opacity: 1 },
      ],
      opts,
    ).onfinish = (e) => (e.target as Animation).cancel();
    // antiga: amplia em volta do tocado até ele ocupar a tela, sumindo
    const G = box(ghost.rect);
    const ox = a.x - G.x;
    const oy = a.y - G.y;
    ghost.node.animate(
      [
        { transform: "none", opacity: 1 },
        { opacity: 0, offset: 0.55 },
        {
          transform: `translate(${T.x - a.x + ox - ox * k}px, ${T.y - a.y + oy - oy * k}px) scale(${k})`,
          opacity: 0,
        },
      ],
      opts,
    ).onfinish = done;
  } else {
    // antiga (tela cheia) encolhe até o retângulo de destino
    const G = box(ghost.rect);
    const s = a.w / G.w;
    const k = 1 / s;
    ghost.node.animate(
      [
        { transform: "none", opacity: 1 },
        { opacity: 1, offset: 0.35 },
        { transform: `translate(${a.x - G.x}px, ${a.y - G.y}px) scale(${s})`, opacity: 0 },
      ],
      opts,
    ).onfinish = done;
    // nova: começa ampliada em volta do destino e assenta
    const T = box(to);
    const ox = a.x - T.x;
    const oy = a.y - T.y;
    layer.animate(
      [
        {
          transform: `translate(${G.x - a.x + ox - ox * k}px, ${G.y - a.y + oy - oy * k}px) scale(${k})`,
          opacity: 0,
        },
        { opacity: 1, offset: 0.5 },
        { transform: "none", opacity: 1 },
      ],
      opts,
    ).onfinish = (e) => (e.target as Animation).cancel();
  }
}

/** Troca de dia pela faixa: o corpo do dia entra deslizando do lado certo. */
export function slideDay(layer: HTMLElement, dir: 1 | -1) {
  if (reducedMotion()) return;
  const body = layer.querySelector<HTMLElement>("[data-day-body]");
  body?.animate(
    [
      { transform: `translateX(${dir * 36}px)`, opacity: 0.2 },
      { transform: "none", opacity: 1 },
    ],
    { duration: 280, easing: EASE },
  );
}
