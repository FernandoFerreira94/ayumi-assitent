---
id: device-frames
title: Molduras de iPhone e navegador em CSS
category: frame
summary: Moldura de celular e de janela de navegador feitas só com CSS, para mostrar telas reais do produto sem imagens pesadas de mockup.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista]
products: [landing, mobile-app, saas, portfolio, launch, ai-app]
motion: none
tech: css
deps: []
a11y: A moldura é decorativa; a tela dentro precisa de alt/aria-label descrevendo o conteúdo.
perf: Zero imagens para a moldura. A tela interna deve ser AVIF/WebP com width/height definidos.
reference_name: Apple Design Resources
reference_url: https://developer.apple.com/design/resources/
react: Componentes <PhoneFrame> e <BrowserFrame> que recebem children.
status: stable
---

## Quando usar
- Mostrar o produto em landing, case de portfolio ou seção de app mobile.

## Evite
- Mockups fotográficos pesados (PNG de 2MB) quando a moldura em CSS resolve.
- Screenshot com texto ilegível no tamanho exibido.

## Implementação
- Celular: `aspect-ratio: 9/19.5`, raio grande, borda grossa em `--wc-fg` e ilha dinâmica com pseudo-elemento.
- Navegador: barra com 3 pontos e campo de URL; conteúdo com `overflow: hidden`.
- Tamanhos por `--w`, para reutilizar em qualquer layout.
