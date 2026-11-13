---
id: skip-link-focus
title: Pular para o conteúdo e foco nunca encoberto
category: navigation
summary: Link "Pular para o conteúdo" que aparece no primeiro Tab, mais scroll-padding igual à altura do header sticky para que nenhum elemento focado fique escondido atrás dele (WCAG 2.4.1 e 2.4.11).
themes: [aurora, clean-saas, editorial, cinematografico, brutalista]
products: [landing, institutional, portfolio, editorial, ecommerce, saas, erp, devtools, event, health]
motion: low
tech: css-js
deps: []
a11y: Primeiro elemento focável da página; leva o foco para o main (tabindex="-1"); scroll-padding-top acompanha a altura real do header (ResizeObserver) para cumprir 2.4.11 Foco não encoberto.
perf: Só CSS mais um ResizeObserver que escreve uma variável; nada roda no scroll.
reference_name: Understanding WCAG 2.4.11 (Focus Not Obscured)
reference_url: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
react: Coloque o SkipLink no layout raiz do Next e use scroll-padding-top no html com a variável do header.
status: stable
---

## Quando usar
- Toda página com header e navegação antes do conteúdo (praticamente todas).

## Evite
- Skip link permanentemente escondido (display: none) ou que nunca aparece no foco.
- Header sticky sem `scroll-padding`: Tab para baixo esconde o elemento focado.
- Banner de cookies fixo que cobre o foco.

## Implementação
- `.skip` fica fora da tela e entra com `:focus-visible` (translate curto).
- `html { scroll-padding-top: calc(var(--header-h) + 8px) }`; a altura vem de um ResizeObserver no header.
- O destino é o `main` com `tabindex="-1"` e `id="conteudo"`.
