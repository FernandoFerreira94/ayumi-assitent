---
id: faq-accordion
title: FAQ em acordeão nativo
category: section
summary: Perguntas frequentes com details/summary nativos, abertura exclusiva pelo atributo name, altura animada só com CSS e busca que filtra as perguntas enquanto você digita.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [landing, saas, subscription, institutional, ecommerce, health, edtech, event, booking, fintech, devtools, ai-app, launch]
motion: low
tech: css-js
deps: []
a11y: details/summary dá teclado (Enter/Espaço), estado expandido e foco de graça. A busca tem label visível e anuncia "3 perguntas encontradas" num status polite. A seta é decorativa (aria-hidden). Conteúdo fechado continua encontrável pelo Ctrl+F do navegador (hidden="until-found" nativo do details).
perf: Animação de altura com interpolate-size e ::details-content (Chromium); outros navegadores abrem sem animação. Nenhuma biblioteca.
reference_name: MDN (details, atributo name) e Chrome for Developers (animar details)
reference_url: https://developer.chrome.com/docs/css-ui/animate-to-height-auto
react: Server component com <details name="faq">. A busca é client e só alterna hidden nos itens. Gere o JSON-LD FAQPage a partir dos mesmos dados.
status: stable
---

## Quando usar
- Antes do CTA final de landing e página de preços, para matar objeções (cancelamento, prazo, nota fiscal, LGPD).
- Central de ajuda curta, com até umas 20 perguntas.

## Evite
- Esconder no FAQ informação que decide a compra (preço, prazo de entrega). Isso vai na página.
- Acordeão dentro de acordeão.
- Respostas longas: mais de um parágrafo vira artigo da central de ajuda com link.

## Implementação
- `<details name="faq">` faz um fechar quando outro abre, sem JS. Tire o `name` se o usuário precisar comparar respostas.
- `:root { interpolate-size: allow-keywords }` + `details::details-content { block-size: 0; transition: block-size, content-visibility allow-discrete }` e `[open]::details-content { block-size: auto }`.
- Busca normaliza acentos (`normalize('NFD')`) para "cancelamento" achar "Cancelamento".
- Agrupe por tema com h3 quando passar de 8 perguntas.
