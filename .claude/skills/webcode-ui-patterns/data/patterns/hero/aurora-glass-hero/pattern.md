---
id: aurora-glass-hero
title: Hero Aurora com vidro
category: hero
summary: Gradiente vivo em movimento lento atrás de um título forte, com selo e cartão de vidro. A assinatura visual do tema Aurora.
themes: [aurora, clean-saas, cinematografico]
products: [landing, saas, ai-app, mobile-app, devtools, event, launch]
motion: medium
tech: css
deps: []
a11y: Animação de fundo para com prefers-reduced-motion. Texto nunca fica sobre o vidro com contraste abaixo de 4.5:1.
perf: Só transform e filter nos blobs, com will-change. Blur fixo em 3 camadas; não aumente o número de blobs.
reference_name: apple.com (páginas de produto) e Linear
reference_url: https://www.apple.com/apple-intelligence/
react: Componente server-side puro. Só o CTA precisa ser client.
status: stable
---

## Quando usar
- Primeira dobra de landing de produto tecnológico, app ou IA.
- Quando a marca quer parecer "futurista" sem 3D pesado.

## Evite
- Em páginas de conteúdo longo ou dashboards: o movimento compete com a leitura.
- Mais de um hero com aurora na mesma página.

## Implementação
- Os blobs usam `--wc-gradient-1..4`, então o hero muda de cor com o tema.
- O título usa `background-clip: text` apenas na palavra de destaque. O resto fica em `--wc-fg` para garantir contraste.
- Ajuste a altura pelo conteúdo, nunca com `100vh`.
