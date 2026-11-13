---
id: skeleton-shimmer
title: Skeleton com shimmer e troca suave
category: loading
summary: Placeholders com o formato exato do conteúdo, brilho sutil passando e troca por crossfade quando os dados chegam. Sem salto de layout.
themes: [aurora, clean-saas, editorial, playful]
products: [saas, erp, crm, admin, ecommerce, fintech, mobile-app, delivery, ai-app, automation, b2b, booking, devtools, edtech, field-service, habits, health, helpdesk, logistics, marketplace, realestate]
motion: low
tech: css-js
deps: []
a11y: Container com aria-busy enquanto carrega e região aria-live que anuncia "Pedidos carregados". O shimmer para em reduced motion.
perf: O brilho é um pseudo-elemento com translateX (compositor), não background-position. Skeleton com as mesmas dimensões do conteúdo evita CLS.
reference_name: Vercel Geist (Skeleton)
reference_url: https://vercel.com/geist/skeleton
react: Use Suspense com fallback de skeleton. O crossfade fica num wrapper com key.
status: stable
---

## Quando usar
- Carregamentos acima de 300ms em listas, cards e tabelas com formato previsível.

## Evite
- Abaixo de 300ms: o skeleton pisca. Mostre-o com atraso ou não mostre.
- Spinner no lugar de skeleton em conteúdo com formato conhecido.

## Implementação
- Os blocos usam `--wc-sunken`; o brilho usa `--wc-surface` com 60% de opacidade.
- Troca: o skeleton sai em 150ms e o conteúdo entra em 220ms com leve deslocamento.
