---
id: lightbox-zoom
title: Visualizador de imagens com zoom e gestos
category: media
summary: Lightbox em tela cheia que abre a partir de uma grade, com zoom no ponto (duplo toque, roda, pinça), arrastar a imagem ampliada, deslizar para trocar e puxar para baixo para fechar. Fundo segue o tema, como o Fotos do iOS.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [portfolio, editorial, ecommerce, marketplace, realestate, booking, institutional, event]
motion: medium
tech: css-js
deps: []
a11y: Dialog modal com título, foco preso e devolvido à miniatura; contador "Imagem 3 de 8" anunciado; setas, Home/End, + − 0 e Esc no teclado; botões de zoom e navegação como alternativa a todo gesto (WCAG 2.5.1 e 2.5.7).
perf: Transform aplicado direto no estilo (sem render por quadro), listener de roda não passivo só no palco, vizinhas pré-carregadas, miniaturas com loading="lazy".
reference_name: Fotos do iOS e PhotoSwipe
reference_url: https://photoswipe.com/
react: "`npx shadcn add @webcode/image-viewer`: ImageGallery (grade + viewer) ou ImageViewer controlado."
status: stable
---

## Quando usar
- Portfólio, imóvel, produto, cobertura de evento: a imagem é o conteúdo e o usuário quer detalhe.

## Evite
- Zoom só por hover (não existe no toque) ou só por pinça (sem alternativa).
- Fechar ao tocar na imagem: o toque simples é reservado para o duplo toque de zoom.
- Fundo preto fixo no tema claro quando o resto do produto é claro: siga o modo.

## Implementação
- Escala 1–4×, zoom mantendo o ponto sob o dedo: `t' = p − (p − t) · s'/s`; limite o arraste à borda da imagem ampliada.
- Sem zoom: arraste horizontal troca (20% da largura ou gesto rápido), vertical para baixo fecha (120px), com elástico nas pontas.
- `touch-action: none` só no palco; ctrl+roda com `preventDefault` para não ampliar a página.
