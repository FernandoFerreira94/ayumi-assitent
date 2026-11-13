---
id: drilldown-drawer-menu
title: Drawer lateral com submenus em camadas (drill-down)
category: navigation
summary: Menu que desliza da lateral e navega por níveis como os Ajustes do iOS: cada categoria empurra a próxima tela, com botão Voltar e título do nível. Resolve catálogos profundos no mobile.
themes: [clean-saas, aurora, editorial]
products: [ecommerce, marketplace, b2b, edtech, delivery, institutional, mobile-app]
motion: medium
tech: css-js
deps: []
a11y: Drawer é dialog modal nativo (foco preso, Esc fecha). Ao entrar num nível, o foco vai para o título do nível (anunciado); Voltar devolve o foco ao item de origem. Níveis fora de cena ficam inert. Gesto de arrastar para fechar tem alternativa por botão.
perf: Níveis são translateX em uma faixa (compositor). Só o nível visível e o anterior ficam montados em produção. Arrastar usa pointer events com rAF.
reference_name: Ajustes do iOS e menu mobile da Nike
reference_url: https://www.nike.com.br
react: Sheet do shadcn (side="left") com um estado de pilha [nível...]; renderize só o topo e o anterior e anime com translate.
status: stable
---

## Quando usar
- Catálogos com 2 ou 3 níveis no mobile (Departamento → Categoria → Subcategoria).
- Apps com menu de configurações profundo.

## Evite
- Mais de 3 níveis: a pessoa se perde. Achate ou use busca.
- Sanfona dentro de sanfona para o mesmo caso: fica comprida e pula.

## Implementação
- `<dialog>` com `translate: -100% 0` → `0` usando `@starting-style` e `allow-discrete`.
- Pilha de níveis absolutamente posicionados; o nível atual em `0`, anteriores em `-30%` (paralaxe iOS), próximos em `100%`.
- Cabeçalho do nível com botão "‹ Nome do anterior" e título com `tabindex="-1"` para receber foco.
- Arrastar o drawer para a esquerda acima de 30% da largura fecha; abaixo volta com mola.
