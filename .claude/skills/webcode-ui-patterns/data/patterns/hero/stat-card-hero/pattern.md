---
id: stat-card-hero
title: Hero com número e CTA circular
category: hero
summary: Headline grande à esquerda, cartão com uma estatística de prova à direita e um CTA circular com seta. Prova social em um olhar, sem ilustração.
themes: [clean-saas, aurora, editorial, cinematografico, brutalista, playful]
products: [landing, saas, fintech, launch]
motion: low
tech: css
deps: []
a11y: A estatística é texto real (não imagem) e o CTA circular tem nome acessível por aria-label. Foco visível e alvo de 56px.
perf: Só CSS. O cartão não carrega imagem; a seta é SVG inline.
reference_name: Heros de fintech e portfólio com número de destaque
reference_url: https://stripe.com
react: Compor com `stat-card` (@webcode) e `Button` com `size="icon"`; o círculo é `rounded-full`.
status: stable
---

## Quando usar
- Quando existe um número honesto que vende por si (clientes, volume, prazo) e a página precisa de uma única ação.

## Evite
- Número sem fonte ou inventado. Se não houver dado real, use o hero editorial.
- Mais de um CTA circular: o círculo é a ação principal, não um menu.

## Implementação
- Grade `1.4fr 1fr` que vira coluna abaixo de 760px, com o cartão depois da headline.
- Estatística em `--wc-font-display` com `tabular-nums`; variação em `--wc-success`, nunca só pela cor (sinal + texto).
- Seta do CTA gira 45° no hover, desligada em movimento reduzido.
