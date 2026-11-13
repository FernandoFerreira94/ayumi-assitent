---
id: footer-ecommerce-br
title: Footer de loja brasileira (benefícios, SAC, pagamentos e dados legais)
category: footer
summary: Footer completo de e-commerce no Brasil: faixa de benefícios (frete, troca, Pix, compra segura), atendimento com WhatsApp e horário, colunas de ajuda e institucional, formas de pagamento, selos e a identificação legal exigida (razão social, CNPJ e endereço).
themes: [clean-saas, aurora, editorial]
products: [ecommerce, marketplace, subscription, b2b, delivery]
motion: none
tech: css-js
deps: []
a11y: Formas de pagamento são lista com nomes em texto (não só logos). Telefones e WhatsApp em links tel:/https com rótulo claro. Colunas viram sanfonas nativas no mobile. Contraste AA nos textos legais pequenos (fg-muted, nunca fg-subtle).
perf: Selos e bandeiras como texto/SVG inline; sem imagens de terceiros carregando no footer. JS só para abrir as sanfonas no desktop.
reference_name: Decreto 7.962/2013 (comércio eletrônico) e footers de Magalu, Amaro e Insider
reference_url: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
react: Server component com dados da loja vindos do CMS (CNPJ, endereço, horários); formas de pagamento a partir da configuração do gateway.
status: stable
---

## Quando usar
- Toda loja virtual no Brasil. O Decreto 7.962/2013 exige razão social, CNPJ, endereço e contato em local de fácil visualização.

## Evite
- Esconder CNPJ e endereço em uma página "Sobre": vai no footer.
- Selos falsos ou de enfeite. Só use selos verificáveis com link.

## Implementação
- Faixa de benefícios em grid de 4 (2×2 no mobile) com ícone e texto curto.
- Coluna "Atendimento" com WhatsApp, SAC (0800) e horário; e-mail opcional.
- Pagamentos como `<ul>` de chips de texto (Pix, Visa, Mastercard, Elo, Amex, Boleto).
- Linha legal: razão social, CNPJ, endereço completo.
