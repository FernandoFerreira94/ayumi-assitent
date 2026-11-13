---
id: copy-feedback
title: Copiar com troca de ícone
category: micro
summary: Botão de copiar em que o ícone vira um check com crossfade e blur por 1,5s. Para chaves de API, Pix copia-e-cola, cupons e código.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [devtools, fintech, saas, ecommerce, admin, ai-app, automation, b2b, booking, crm, delivery, editorial, erp, event, habits, health, helpdesk, institutional, logistics, marketplace, pos, realestate]
motion: low
tech: css-js
deps: []
a11y: aria-live anuncia "Copiado". O rótulo acessível muda junto. Fallback seleciona o texto se a clipboard API falhar.
perf: Dois SVGs sobrepostos com opacity/scale/blur. Custo desprezível.
reference_name: Vercel Geist (Snippet)
reference_url: https://vercel.com/geist/snippet
react: Hook useCopy() que retorna { copied, copy }; timeout limpo no unmount.
status: stable
---

## Quando usar
- Qualquer valor que o usuário precise colar em outro lugar: Pix, chave de API, link de convite, cupom.

## Evite
- Toast só para dizer "copiado": o feedback no próprio botão é suficiente.

## Implementação
- Os dois ícones ficam no mesmo grid cell. Estado `data-copied` alterna `opacity`, `scale` e `blur`.
- Sempre trate a rejeição de `navigator.clipboard.writeText` selecionando o texto.
