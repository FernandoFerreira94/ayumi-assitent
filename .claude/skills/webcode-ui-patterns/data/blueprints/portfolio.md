---
id: portfolio
title: Portfolio e agência
family: Marketing e presença
summary: Site de estúdio, agência ou profissional criativo. O trabalho é o herói; a navegação e o motion mostram ofício sem atrapalhar.
kpi: Pedidos de orçamento qualificados e tempo nas páginas de caso
themes: [editorial, aurora, brutalista, cinematografico]
patterns: [editorial-type-hero, view-transition-morph, spotlight-cards, magnetic-button, tilt-card, scroll-reveal-stagger, blur-text-reveal, device-frames, glass-sticky-header, splash-logo-reveal, transparent-hero-header, floating-pill-header, fullscreen-menu-overlay, footer-newsletter, footer-minimal, footer-big-type, lightbox-zoom]
density: spacious
radius: 2
components: [button, card, dialog, field, input, textarea, badge, sonner]
status: stable
---

## Objetivo
Mostrar 4–8 trabalhos fortes com contexto (problema, solução, resultado) e transformar admiração em conversa.

## Mapa
| Página | Conteúdo | Padrões |
| --- | --- | --- |
| Home | posicionamento em uma frase grande, casos em grade, clientes, contato | editorial-type-hero, spotlight-cards |
| Caso | capa, desafio, processo, entregas em telas/dispositivos, resultado com número, próximo caso | view-transition-morph, device-frames |
| Sobre | quem somos, como trabalhamos, prêmios | blur-text-reveal |
| Contato | e-mail grande e copiável, formulário de briefing curto | magnetic-button |

## Regras
- Uma animação-assinatura por página (cursor **ou** reveal **ou** morph), sempre com reduced motion.
- Transição grade → caso com morph da capa (View Transitions) para dar continuidade.
- Imagens e vídeos otimizados (AVIF, poster, lazy); o caso abre rápido mesmo com mídia pesada.
- Texto do caso escaneável: desafio, solução e resultado em blocos curtos.
- Splash só se for curto (< 1,2s) e só na primeira visita.

## Recomendações
- **Tema:** Editorial (tipografia forte, cantos retos) ou Aurora para estúdios de tecnologia/motion.
- **Densidade:** espaçosa.
- **Componentes-chave:** poucos; o design é tipografia, grid e mídia.

## Estados críticos
- Vídeo não carregou: poster estático com o mesmo enquadramento.
- Reduced motion: nenhuma informação depende de animação.

## Anti-padrões
- Cursor customizado que esconde o ponteiro real.
- Scroll sequestrado (scrolljacking) que impede rolar normalmente.
- 30 projetos sem contexto.

## Referências
- Apple HIG, Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Chrome for Developers, View Transitions: https://developer.chrome.com/docs/web-platform/view-transitions
