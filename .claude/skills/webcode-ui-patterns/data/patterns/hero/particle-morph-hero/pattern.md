---
id: particle-morph-hero
title: Hero rotativo com partículas que mudam de forma
category: hero
summary: Carrossel automático de mensagens em que uma nuvem de partículas 3D se reorganiza na forma de cada slide (pirâmides, lâmpada, pessoas), com título de destaque luminoso, malha sutil e luz da marca no fundo.
themes: [aurora, cinematografico, clean-saas, axion]
products: [landing, institutional, portfolio, launch, saas, ai-app, devtools, automation]
motion: high
tech: js
deps: []
a11y: Canvas aria-hidden. Carrossel com aria-roledescription, botões anterior/próximo, bolinhas com nome do slide e botão Pausar que para também o canvas (WCAG 2.2.2). Autoplay pausa no hover e no foco; o slide só é anunciado quando não está em autoplay. Movimento reduzido desliga autoplay, rotação e transição.
perf: Canvas 2D nativo (sem three.js), DPR até 2, 2400 partículas (1100 em telas pequenas, 320 na malha). rAF parado fora da tela e com a aba oculta; desenho em lote por cor.
reference_name: Heros de agências de software (ex.: verzel.com.br) e partículas 3D do three.js
reference_url: https://threejs.org/examples/#webgl_points_waves
react: Use `@webcode/particle-hero` (registry). Formas por nome, lista de pontos, função ou `sampleImage(src)` para amostrar logo/ilustração em SVG. `variant` particles | mesh | none; `palette` brand | gradient.
status: beta
---

## Quando usar
- Primeira dobra de site institucional, agência, software house ou produto de tecnologia com 2 a 4 mensagens fortes.
- Quando cada mensagem tem um símbolo simples (ideia, mercado, pessoas, crescimento) que reforça o texto.

## Evite
- Mais de 4 slides: ninguém espera o quinto. A mensagem principal vai no primeiro.
- Em páginas de app, dashboards ou com outro elemento animado forte na mesma dobra.
- Texto importante só no slide 2+: o CTA principal precisa existir já no primeiro.
- Formas complexas (rostos, logos detalhados): partículas leem bem silhuetas grandes e simples.

## Implementação
- Cada slide tem `shape`; na troca, cada partícula sai da posição atual para um ponto da nova forma com atraso aleatório e um "empurrão" no meio do caminho (curva ease-in-out, 1,8s).
- Cores vêm de `--wc-accent` (ou `--wc-gradient-1..3` por posição horizontal) lidas com `getComputedStyle` e relidas quando o `<html>` muda de tema/modo. No escuro o desenho é aditivo (brilho), no claro é normal.
- A palavra de destaque usa `--wc-accent` (cor de texto com contraste garantido) + `text-shadow` com `color-mix` da mesma cor. Nunca use a cor do gradiente para texto.
- O progresso do slide é uma animação CSS na bolinha ativa: `animation-play-state` pausa com hover/foco e o `animationend` avança. Sem timers soltos.
- Variantes: `particles` (padrão), `mesh` (poucas partículas ligadas por linhas, ar de wireframe/rede) e `none` (só texto + fundo, para páginas leves ou quando o tema pede sobriedade).
- Altura por `clamp(560px, 88svh, 880px)`, não `100vh`. No celular a forma vai acima do texto e menor.
