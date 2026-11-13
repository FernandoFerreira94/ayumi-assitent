---
id: editorial
title: Blog e editorial
family: Marketing e presença
summary: Blog, revista ou newsletter com arquivo. Leitura longa confortável, descoberta do próximo texto e assinatura.
kpi: Tempo de leitura por artigo e conversão em assinante da newsletter
themes: [editorial]
patterns: [glass-sticky-header, editorial-type-hero, top-progress-bar, scroll-reveal-stagger, copy-feedback, empty-state, view-transition-morph, skip-link-focus, hide-on-scroll-header, priority-plus-nav, footer-newsletter, load-more-infinite, pagination-numbered]
density: spacious
radius: 3
components: [button, card, field, input, badge, separator, sheet, sonner, pagination]
status: stable
---

## Objetivo
Ler sem distração, confiar em quem escreve e querer o próximo texto.

## Mapa
| Página | Conteúdo | Padrões |
| --- | --- | --- |
| Home | destaque, mais recentes, editorias, assinatura | editorial-type-hero |
| Artigo | título, subtítulo, autor e data, tempo de leitura, corpo, sumário em textos longos, compartilhar, relacionados | top-progress-bar, copy-feedback |
| Editoria / tag | lista com resumo e imagem, paginação | — |
| Autor | bio, foto, textos | — |
| Newsletter | promessa, frequência, exemplo, campo de e-mail | — |

## Regras
- Corpo 18–21px, 60–75 caracteres por linha, entrelinha 1.6, `text-wrap: pretty`.
- Títulos com `text-wrap: balance`; intertítulos a cada 3–5 parágrafos.
- Links com sublinhado, código e citações com estilo próprio.
- Âncoras copiáveis nos intertítulos; sumário fixo no desktop em textos com 5+ seções.
- Data de publicação e de atualização visíveis.
- Anúncios e pop-ups não interrompem a leitura antes de 50% do texto.

## Recomendações
- **Tema:** Editorial.
- **Densidade:** espaçosa.
- **Componentes-chave:** tipografia (prose), Field de newsletter, Pagination, Sheet de menu.

## Estados críticos
- Busca sem resultado: sugere editorias e mais lidos.
- Inscrição feita: confirma e diz quando chega a primeira edição.

## Anti-padrões
- Barra lateral cheia de widgets.
- Texto cinza claro de baixo contraste "porque é elegante".
- Pop-up de newsletter ao abrir.

## Referências
- Refactoring UI: https://www.refactoringui.com/
- Apple HIG, Layout (largura de leitura): https://developer.apple.com/design/human-interface-guidelines/layout
