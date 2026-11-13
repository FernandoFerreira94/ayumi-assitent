---
id: apple-expand-menu
title: Navegação global que expande o header (estilo Apple)
category: navigation
summary: Barra fina cujo próprio fundo cresce para baixo revelando o submenu, com links entrando em cascata curta e a página atrás desfocada. No mobile o mesmo header cresce até a tela inteira.
themes: [aurora, clean-saas, editorial, cinematografico]
products: [institutional, ecommerce, landing, launch, subscription, b2b]
motion: medium
tech: css-js
deps: []
a11y: Padrão disclosure (botões com aria-expanded/aria-controls, não role=menu). Abre por clique, Enter ou Espaço; hover só com mouse e atraso. Esc fecha e devolve o foco. Scrim fecha ao clicar. Reduced motion remove cascata e crescimento.
perf: Altura anima com grid-template-rows 0fr→1fr (sem medir). Blur da página só existe com o menu aberto. Cascata usa transition-delay por índice.
reference_name: apple.com (globalnav)
reference_url: https://www.apple.com
react: NavigationMenu do shadcn (Radix) com viewport full-width; troque a animação pelo crescimento do fundo e aplique a cascata nos links.
status: stable
---

## Quando usar
- Sites de marca com 4 a 8 seções, cada uma com subpáginas e atalhos ("Comprar", "Suporte").

## Evite
- Abrir no hover sem atraso: dispara ao atravessar a barra.
- Submenus com mais de 3 colunas: aí o certo é o `mega-menu`.

## Implementação
- O painel fica dentro do `<header>`; o header tem `--wc-glass-bg` e o painel herda o mesmo fundo, então visualmente "o header cresce".
- `transition-delay: calc(var(--i) * 25ms)` nos links do painel, só na entrada.
- Scrim: `backdrop-filter: blur(...)` sobre a página, opacidade 0→1.
- Mobile (< 760px): o botão de menu expande o header a `100dvh` com a lista principal em cascata; ícone vira X.
