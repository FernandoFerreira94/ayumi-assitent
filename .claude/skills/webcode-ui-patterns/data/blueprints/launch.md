---
id: launch
title: Lançamento de produto
family: Marketing e presença
summary: Página de lançamento ou lista de espera de um produto tech. É a vitrine da assinatura visual: impacto alto, mas rápida e acessível.
kpi: Inscrições na lista de espera ou pré-venda por visitante único
themes: [aurora, cinematografico]
patterns: [aurora-glass-hero, product-shot-hero, blur-text-reveal, scroll-reveal-stagger, bento-grid, gradient-border-glow, device-frames, magnetic-button, splash-logo-reveal, glass-sticky-header, transparent-hero-header, announcement-cta-header, floating-pill-header, fullscreen-menu-overlay, apple-expand-menu, footer-newsletter, footer-minimal, footer-big-type, logo-cloud-marquee, testimonial-wall, faq-accordion]
density: spacious
radius: 18
components: [button, field, input, card, badge, dialog, accordion, sonner]
status: stable
---

## Objetivo
Criar desejo em 10 segundos e capturar o e-mail (ou a pré-venda) antes que a atenção acabe.

## Estrutura (uma página)
| Seção | Conteúdo | Padrões |
| --- | --- | --- |
| Hero | nome, promessa, imagem/vídeo do produto, CTA com campo de e-mail | aurora-glass-hero, blur-text-reveal |
| Problema → solução | 3 benefícios com prova visual | bento-grid |
| Produto em ação | telas em molduras, vídeo curto com poster | device-frames, scroll-reveal-stagger |
| Prova | quem já usa, imprensa, números | — |
| Oferta | data, preço de lançamento, bônus de lista de espera | gradient-border-glow |
| FAQ + CTA final | dúvidas de compra e o mesmo CTA do hero | magnetic-button |

## Regras
- CTA visível acima da dobra no mobile, com o campo de e-mail e um rótulo de valor ("Quero acesso antecipado").
- Vídeo/3D com lazy load e poster; LCP é a imagem do hero, não o vídeo.
- Contagem regressiva só se a data for real.
- Após inscrição: posição na fila, compartilhar para subir, e e-mail de confirmação.
- Modo escuro como padrão combina com Aurora, mas o claro precisa funcionar.

## Recomendações
- **Tema:** Aurora, começando escuro.
- **Densidade:** espaçosa.
- **Componentes-chave:** Field + Button no hero, Dialog para vídeo, Accordion de FAQ.

## Estados críticos
- E-mail já inscrito: mostra a posição em vez de erro.
- Reduced motion: hero estático com a mesma hierarquia.

## Anti-padrões
- Splash longo antes do conteúdo.
- Três CTAs diferentes competindo.
- Hero que só faz sentido depois de rolar.

## Referências
- Apple WWDC25, Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- web.dev, Baseline: https://web.dev/baseline
