---
id: announcement-cta-header
title: Header SaaS com barra de anúncio e dupla de CTAs
category: header
summary: Barra de anúncio dispensável acima de um header com navegação, "Entrar" discreto e "Começar grátis" em destaque. No mobile, os links vão para um painel simples e o CTA principal continua visível.
themes: [clean-saas, aurora, editorial, cinematografico, brutalista]
products: [saas, landing, launch, ai-app, devtools, automation, fintech]
motion: low
tech: css-js
deps: []
a11y: Anúncio é region rotulada com botão "Fechar anúncio" (não só um X sem nome). Dispensa é lembrada. Menu mobile é disclosure com aria-expanded/aria-controls; Esc fecha e devolve o foco.
perf: Estado dispensado lido de localStorage antes da pintura para não piscar. A barra recolhe com grid-template-rows 1fr→0fr, sem medir altura.
reference_name: Linear, Vercel e Stripe (anúncio de lançamento acima do header)
reference_url: https://linear.app
react: Anúncio como server component com cookie de dispensa (evita flash no SSR); menu mobile com useState e o Sheet/Drawer do registry se tiver muitos links.
status: stable
---

## Quando usar
- Sites de produto SaaS com um lançamento, evento ou promoção que vale um clique.

## Evite
- Anúncio permanente sem botão de fechar, ou mais de uma barra empilhada.
- Dois CTAs com o mesmo peso visual: "Entrar" é secundário, "Começar grátis" é a ação.

## Implementação
- Barra com `display: grid; grid-template-rows: 1fr` e transição para `0fr` ao dispensar; depois `hidden`.
- Persistência por id do anúncio (`wc-announce-<id>`), assim um anúncio novo volta a aparecer.
- Header sticky com vidro; abaixo de 820px a nav vira botão "Menu" e o "Entrar" entra no painel.
