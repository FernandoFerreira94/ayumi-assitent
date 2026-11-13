---
id: landing
title: Landing page
family: Marketing e presença
summary: Uma página, um objetivo, uma ação. Converte visitante frio em lead ou cadastro.
kpi: Taxa de conversão do CTA principal (meta inicial 3–8% para tráfego pago, 10%+ para tráfego quente)
themes: [aurora, editorial, clean-saas, brutalista, cinematografico]
patterns: [glass-sticky-header, aurora-glass-hero, product-shot-hero, editorial-type-hero, bento-grid, spotlight-cards, scroll-reveal-stagger, blur-text-reveal, gradient-border-glow, device-frames, press-spring-button, magnetic-button, skip-link-focus, announcement-cta-header, auth-sliding-panels, footer-saas-columns, footer-newsletter, footer-minimal, pricing-tiers, testimonial-wall, faq-accordion, logo-cloud-marquee]
density: spacious
radius: 18
components: [button, card, accordion, tabs, dialog, badge, input, field, sonner]
status: stable
---

## Objetivo
Levar o visitante a **uma** ação (cadastro, demo, WhatsApp, compra). Tudo que não ajuda nessa ação sai da página.

## Mapa da página
| Ordem | Seção | Padrão sugerido | Pergunta que responde |
| --- | --- | --- | --- |
| 1 | Header | glass-sticky-header (lançamento: announcement-cta-header; foto forte: transparent-hero-header) | Quem é você? Onde clico? |
| 2 | Hero | aurora-glass-hero ou product-shot-hero | O que é e por que me importa? |
| 3 | Prova social | logos + números (scroll-reveal-stagger) | Outros confiam? |
| 4 | Benefícios | bento-grid ou spotlight-cards | O que eu ganho? |
| 5 | Como funciona | 3 passos com device-frames | É difícil começar? |
| 6 | Depoimentos | cards com foto, nome e empresa real | Funciona para alguém como eu? |
| 7 | Preço / oferta | gradient-border-glow no plano destacado | Quanto custa? |
| 8 | FAQ | accordion nativo (details/summary) | E as minhas objeções? |
| 9 | CTA final | blur-text-reveal + press-spring-button | Ok, e agora? |
| 10 | Rodapé | links legais, CNPJ, contato | É uma empresa séria? |

## Regras
- O CTA principal aparece no hero, no meio e no fim, sempre com o mesmo texto.
- Hero cabe em uma tela no celular com o CTA visível sem rolar.
- Uma única animação "assinatura" por página (aurora, magnetic ou blur-text). O resto fica em revelações discretas.
- Prova social com dados reais e verificáveis. Números redondos demais parecem falsos.
- Formulário com no máximo 3 campos. Se precisar de mais, divida em etapas depois do primeiro envio.

## Estados críticos
- Envio do formulário: botão com loading e sucesso no próprio botão (press-spring-button), sem redirecionar para página vazia.
- Erro de envio: mensagem ao lado do campo, dados preservados.

## Performance
- LCP é o título ou a imagem do hero: sem animação de entrada que esconda o LCP, fonte com `display=swap` e preload.
- Vídeo de fundo só com poster, `muted playsinline` e carregado depois do LCP.

## Anti-padrões
- Carrossel no hero. Ninguém vê o segundo slide.
- Três CTAs concorrentes no hero.
- "Soluções inovadoras para o seu negócio": copy genérico que serve para qualquer empresa.
