---
id: event
title: Evento e conferência
family: Marketing e presença
summary: Site de evento presencial ou online: data, local, agenda, palestrantes e ingresso. Antes vende, durante orienta.
kpi: Ingressos vendidos por visitante e check-ins no dia
themes: [aurora, editorial, cinematografico]
patterns: [aurora-glass-hero, editorial-type-hero, glass-sticky-header, ios-tab-bar, bento-grid, spotlight-cards, bottom-sheet, copy-feedback, scroll-reveal-stagger, url-tabs, skip-link-focus, pix-copy-paste, transparent-hero-header, fullscreen-menu-overlay, auth-flip-card, footer-minimal, footer-big-type, hero-carousel-autoplay, lightbox-zoom, faq-accordion, logo-cloud-marquee]
density: spacious
radius: 14
components: [button, tabs, card, avatar, badge, dialog, drawer, accordion, field, input, sonner]
status: stable
---

## Objetivo
Antes: convencer e vender o ingresso. Durante: dizer o que está acontecendo agora e onde.

## Mapa
| Página | Conteúdo | Padrões |
| --- | --- | --- |
| Home | nome, data, cidade/online, CTA de ingresso, palestrantes em destaque, patrocinadores | aurora-glass-hero |
| Agenda | dias em abas, trilhas, horários com sala, favoritar sessões | bottom-sheet |
| Palestrantes | grade com foto, nome, empresa; detalhe com bio e sessões | spotlight-cards |
| Ingressos | lotes com preço e prazo, meia-entrada, o que inclui | — |
| Local | mapa, como chegar, hospedagem parceira | copy-feedback |

## Regras
- Data, local e preço visíveis sem rolar.
- Lote atual e quando vira ("Lote 2 até 10/11"), só se for verdade.
- Agenda com fuso horário em eventos online e "agora / a seguir" no dia do evento.
- Minha agenda (favoritos) sem login, salva no dispositivo.
- No dia: modo "evento" com tab bar (Agora, Agenda, Mapa, Ingresso) e QR do ingresso offline.

## Recomendações
- **Tema:** Aurora (tech, música) ou Editorial (cultura, negócios).
- **Densidade:** espaçosa antes, confortável no modo evento.
- **Componentes-chave:** Tabs de dias, Card de sessão, Avatar de palestrante, Drawer de detalhe.

## Estados críticos
- Esgotado: lista de espera.
- Sessão mudou de sala/horário: destaque na agenda e push para quem favoritou.

## Anti-padrões
- Agenda em PDF.
- Ingresso só por e-mail, sem acesso no site.

## Referências
- Apple HIG, Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- WAI-ARIA APG, Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
