---
id: footer-app-download
title: Footer de app com download, QR code e avaliação
category: footer
summary: Footer de produto mobile: chamada para baixar o app com botões das lojas, QR code no desktop (para passar do computador ao celular), nota média nas lojas e links essenciais. No celular, o QR some e a loja do aparelho vem primeiro.
themes: [aurora, clean-saas, editorial, playful]
products: [mobile-app, delivery, fintech, health, booking, ai-app, subscription]
motion: low
tech: css-js
deps: []
a11y: Botões das lojas são links com nome completo ("Baixar na App Store"). QR tem texto alternativo dizendo o destino e um link equivalente. Nota em texto ("4,8 de 5, 32 mil avaliações"), estrelas decorativas. Ordem das lojas muda só visualmente com order, mantendo a lógica.
perf: QR em SVG gerado no servidor (aqui um padrão decorativo em CSS). Detecção de plataforma só por userAgentData/userAgent, sem bibliotecas.
reference_name: Nubank, iFood e Duolingo (sites de apps)
reference_url: https://nubank.com.br
react: Server component; a ordem das lojas pode vir do header User-Agent no servidor (sem flash). QR gerado no build para o link do app (smart link).
status: stable
---

## Quando usar
- Sites cujo produto principal é um app (fintech, delivery, saúde, reservas).

## Evite
- Selos de loja enormes e pixelados; use SVG e altura de 44–48px.
- QR code no mobile: não dá para escanear a própria tela.

## Implementação
- Bloco em duas colunas: texto + botões à esquerda, QR + mockup à direita.
- Abaixo de 720px: QR some; se for Android, Google Play vem primeiro (`order: -1`).
- Use um smart link (uma URL que redireciona para a loja certa) no QR.
