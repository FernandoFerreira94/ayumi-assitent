---
id: editorial-type-hero
title: Hero tipográfico editorial
category: hero
summary: Título enorme em serifa que sobe linha a linha por trás de uma máscara, com metadados em mono. Sem imagem, a tipografia é a peça.
themes: [editorial, aurora, cinematografico, brutalista]
products: [portfolio, institutional, editorial, event, launch, landing, realestate]
motion: low
tech: css
deps: []
a11y: O texto está completo no DOM desde o início; a máscara é só visual. Em reduced motion as linhas aparecem sem deslocamento.
perf: Uma animação de transform por linha, roda uma vez no carregamento. Custo praticamente zero.
reference_name: Pentagram e Collins (sites de agência)
reference_url: https://www.pentagram.com
react: Pode ser server component. Cada linha é um span com a custom property --i para o atraso.
status: stable
---

## Quando usar
- Agências, estúdios, portfolios e marcas com voz forte.
- Quando não existe uma imagem boa o bastante para abrir a página.

## Evite
- Títulos com mais de 3 linhas no desktop: a revelação fica lenta.
- Combinar com outro efeito de entrada no mesmo viewport.

## Implementação
- Cada linha fica num wrapper com `overflow: clip`; o span interno parte de `translateY(105%)`.
- O atraso de cada linha vem de `--i` multiplicado por `--wc-motion-duration-stagger` (aqui 3x, para ficar editorial).
- Para quebrar as linhas no lugar certo em qualquer largura, defina as linhas manualmente e use `text-wrap: balance` como fallback.
