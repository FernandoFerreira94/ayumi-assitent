---
id: bento-grid
title: Bento grid de features
category: frame
summary: Grade assimétrica de cards de tamanhos diferentes que conta a história do produto por peso visual. Padrão das keynotes da Apple.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [landing, saas, launch, ai-app, mobile-app, devtools, event, institutional, subscription]
motion: low
tech: css
deps: []
a11y: Ordem do DOM igual à ordem de leitura; o grid não reordena conteúdo. Cada card tem título real (h3).
perf: Só CSS grid. Hover com transform. Imagens dentro dos cards devem ter dimensões fixas.
reference_name: Apple (páginas de produto, seções "bento")
reference_url: https://www.apple.com/iphone/
react: Server component. Cada célula é um componente com prop size.
status: stable
---

## Quando usar
- Resumo de 4 a 7 features com importâncias diferentes.

## Evite
- Todas as células do mesmo tamanho (vira uma grade comum) ou mais de 7 células.
- Texto longo dentro das células: título + uma frase.

## Implementação
- `grid-template-columns: repeat(6, 1fr)` e células com `span 2/3/4`. No mobile tudo vira uma coluna.
- A célula principal ganha o tratamento mais forte (gradiente do tema); as outras ficam em `--wc-surface`.
