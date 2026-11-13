---
id: institutional
title: Site institucional
family: Marketing e presença
summary: Site de empresa de serviços (escritório, clínica, indústria, consultoria). Explica o que faz, prova que faz bem e leva ao contato.
kpi: Contatos qualificados por mês (WhatsApp, formulário, telefone) e taxa de rejeição das páginas de serviço
themes: [editorial, clean-saas]
patterns: [glass-sticky-header, editorial-type-hero, bento-grid, scroll-reveal-stagger, empty-state, copy-feedback, toast-stack, skip-link-focus, mega-menu, transparent-hero-header, fullscreen-menu-overlay, apple-expand-menu, priority-plus-nav, footer-big-type, testimonial-wall, faq-accordion, logo-cloud-marquee]
density: spacious
radius: 4
components: [button, card, accordion, field, input, textarea, select, sheet, badge, sonner]
status: stable
---

## Objetivo
Em 5 segundos o visitante entende o que a empresa faz e para quem; em 1 minuto acha o serviço dele e um jeito de falar com alguém.

## Mapa
| Página | Conteúdo | Padrões |
| --- | --- | --- |
| Home | proposta em uma frase, serviços principais, prova (clientes, números, depoimentos), contato | editorial-type-hero, bento-grid |
| Serviço | problema que resolve, como funciona, para quem é, casos, FAQ, CTA | scroll-reveal-stagger |
| Sobre | história curta, equipe com fotos reais, certificações | — |
| Casos / clientes | resultados com números, logos com permissão | — |
| Contato | WhatsApp, telefone, formulário curto, endereço com mapa, horário | copy-feedback, toast-stack |

## Regras
- Uma página por serviço (SEO e clareza), com título que o cliente buscaria ("Contabilidade para clínicas").
- CTA principal igual em todo o site ("Falar com um especialista"); WhatsApp fixo no mobile.
- Formulário de contato com no máximo 4 campos (nome, e-mail ou telefone, assunto, mensagem).
- Rodapé com CNPJ, endereço, política de privacidade (LGPD) e redes.
- Fotos reais da equipe e do lugar; banco de imagem genérico derruba credibilidade.
- Performance: estático/ISR, LCP < 2,5s em 4G.

## Recomendações
- **Tema:** Editorial (serviço humano, autoral, premium); Clean SaaS para indústria e tecnologia B2B.
- **Densidade:** espaçosa.
- **Componentes-chave:** Accordion de FAQ, Card de serviço, Field/Textarea do contato, Sheet de menu no mobile.

## Estados críticos
- Envio do formulário: confirma e diz o prazo de resposta ("Respondemos em até 1 dia útil").
- Fora do horário: WhatsApp avisa e registra.

## Anti-padrões
- Slider de 5 banners na home.
- "Bem-vindo ao nosso site" como título.
- Página "Serviços" com uma lista sem detalhe.

## Referências
- NN/g, 10 heurísticas: https://www.nngroup.com/articles/ten-usability-heuristics/
- Refactoring UI: https://www.refactoringui.com/
