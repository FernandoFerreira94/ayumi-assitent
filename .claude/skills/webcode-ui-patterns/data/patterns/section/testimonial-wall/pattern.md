---
id: testimonial-wall
title: Mural de depoimentos com resultado
category: section
summary: Depoimentos em colunas de alturas livres, cada um com pessoa real, empresa e um número de resultado em destaque. Um depoimento-âncora maior abre o mural e o resto expande sob demanda.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [landing, saas, subscription, institutional, edtech, health, ai-app, launch, portfolio]
motion: low
tech: css-js
deps: []
a11y: Cada depoimento é um figure com blockquote e figcaption (quem disse). O avatar de iniciais é aria-hidden. O botão "Ver mais" usa aria-expanded e aria-controls e leva o foco ao primeiro depoimento revelado. Nenhum carrossel automático.
perf: CSS columns, sem cálculo de masonry em JS. Fotos reais devem ter width/height e loading="lazy".
reference_name: Stripe Customers (histórias com resultado) e murais de depoimentos de SaaS
reference_url: https://stripe.com/customers
react: Server component; só o botão de expandir é client. Depoimentos vêm do CMS com campos pessoa, cargo, empresa, métrica e texto.
status: stable
---

## Quando usar
- Landing de produto e página de preços, logo depois da proposta de valor ou antes do CTA final.
- Quando você tem depoimentos com resultado mensurável ("fechamos o mês em 2 dias").

## Evite
- Depoimento sem nome e sem empresa ("Cliente satisfeito"): reduz confiança em vez de aumentar.
- Carrossel que gira sozinho; ninguém lê o terceiro slide.
- Mais de 9 depoimentos visíveis de uma vez.

## Implementação
- `columns: 3 300px` com `break-inside: avoid` em cada card; no mobile vira uma coluna.
- O depoimento-âncora ocupa a largura toda acima do mural (`column-span: all` não é necessário: fica fora do container de colunas).
- A métrica é o primeiro elemento visual do card, mas no DOM vem depois do texto para a leitura fazer sentido.
- Peça autorização por escrito para usar nome, foto e empresa (LGPD).
