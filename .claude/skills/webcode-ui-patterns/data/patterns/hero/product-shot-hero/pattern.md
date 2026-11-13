---
id: product-shot-hero
title: Hero com produto em perspectiva
category: hero
summary: Título e CTA acima de uma janela do produto inclinada em 3D que se endireita conforme o usuário rola. Padrão de lançamento de SaaS.
themes: [clean-saas, aurora, cinematografico]
products: [saas, devtools, ai-app, landing, erp, crm, launch, subscription]
motion: medium
tech: css
deps: []
a11y: A imagem do produto tem texto alternativo. Em reduced motion a janela já aparece reta.
perf: Usa animation-timeline do CSS (scroll-driven), sem JS e fora da main thread. Navegadores sem suporte mostram a janela reta.
reference_name: Linear (home) e Vercel
reference_url: https://linear.app
react: Server component. Troque o mock por next/image com priority, é o elemento LCP.
status: stable
---

## Quando usar
- Lançamento de produto digital, quando a interface é o principal argumento de venda.

## Evite
- Screenshot ilegível ou com dados falsos óbvios. Use dados realistas.
- Inclinação acima de 25°: distorce o texto do produto.

## Implementação
- `@supports (animation-timeline: view())` protege o efeito. Fora dele, nada inclina.
- `animation-range: entry 0% cover 40%` define em que trecho do scroll a janela endireita.
- A janela usa `--wc-shadow-lg` e borda fina para destacar do fundo em qualquer tema.
