---
id: plan-comparison-table
title: Tabela de comparação de planos
category: section
summary: Comparação recurso a recurso entre planos, com cabeçalho grudado, grupos recolhíveis e, no celular, um seletor que mostra um plano por vez ao lado da coluna de recursos.
themes: [aurora, clean-saas, editorial, brutalista]
products: [saas, subscription, devtools, automation, ai-app, b2b, landing, edtech]
motion: low
tech: css-js
deps: []
a11y: Tabela real (table, th scope col/row, caption). Sim/Não têm texto para leitor de tela, o ícone é aria-hidden. Grupos usam linha de cabeçalho com botão aria-expanded. No celular o seletor é um grupo de botões aria-pressed e as colunas escondidas saem da árvore de acessibilidade (display: none).
perf: position sticky no thead; nenhuma biblioteca de tabela. Até ~40 linhas sem virtualização.
reference_name: GOV.UK Design System (Table) e páginas de preço de Linear e Notion
reference_url: https://design-system.service.gov.uk/components/table/
react: Dados num array de grupos → recursos → valores por plano. Server component para a tabela; o seletor de plano no mobile é client.
status: stable
---

## Quando usar
- Abaixo dos cards de planos (`pricing-tiers`), para quem precisa conferir um recurso específico.
- Produtos B2B em que limites (usuários, lojas, chamadas de API) decidem o plano.

## Evite
- Substituir os cards de planos pela tabela: a tabela é para conferir, não para decidir.
- Ícones sem texto ("✓" e "—" sem significado para leitor de tela).
- Linhas com o mesmo valor em todos os planos: tire ou junte em "Todos os planos incluem".

## Implementação
- `thead th { position: sticky; top: 0 }` com fundo sólido; a primeira coluna também pode grudar no eixo X.
- Cada grupo é um `<tbody>` com uma linha de cabeçalho e um botão que alterna `hidden` nas linhas do grupo.
- Mobile (< 640px): mostra a coluna de recursos + um plano; o seletor troca qual coluna aparece. Nada de scroll horizontal de tabela larga no celular.
- Destaque do plano recomendado com fundo `--wc-accent-soft` na coluna inteira, sem depender só de cor (selo no cabeçalho).
