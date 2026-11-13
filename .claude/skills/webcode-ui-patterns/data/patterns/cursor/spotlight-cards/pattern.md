---
id: spotlight-cards
title: Cards com spotlight seguindo o mouse
category: cursor
summary: Grade de cards onde um brilho suave e a borda acendem exatamente sob o cursor. Assinatura de produtos dev e SaaS premium.
themes: [aurora, clean-saas, cinematografico]
products: [saas, devtools, ai-app, landing, event, portfolio]
motion: low
tech: css-js
deps: []
a11y: Efeito puramente decorativo; foco por teclado acende o card inteiro com o mesmo visual. Nada é comunicado só pelo brilho.
perf: Um listener de pointermove no grid (não por card), atualiza 2 custom properties. Sem layout, só paint de gradiente.
reference_name: Vercel e Linear (grades de features)
reference_url: https://vercel.com
react: Componente client com ref no grid. Não use estado do React para x/y; escreva direto no style.
status: stable
---

## Quando usar
- Grade de features, pricing ou integrações em landing de produto técnico.

## Evite
- Em dispositivos touch o efeito não existe; o card precisa funcionar sem ele.
- Brilho forte demais: o objetivo é sugerir, não iluminar.

## Implementação
- Cada card recebe `--mx` e `--my` relativos a ele. Dois `radial-gradient`: um no fundo (glow) e um na borda via máscara.
- `@media (hover: hover)` liga o efeito só onde existe cursor.
