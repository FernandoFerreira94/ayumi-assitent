---
id: top-progress-bar
title: Barra de progresso no topo
category: loading
summary: Linha fina no topo que avança devagar enquanto a página ou ação carrega e completa rápido no fim. Feedback de navegação sem bloquear a tela.
themes: [aurora, clean-saas, editorial]
products: [saas, erp, crm, admin, ecommerce, devtools, editorial, b2b, edtech, logistics, pos]
motion: low
tech: css-js
deps: []
a11y: role progressbar com aria-busy no main durante a carga. Não substitui mensagens de erro.
perf: Só transform scaleX. Aparece com atraso de 150ms para não piscar em respostas rápidas.
reference_name: NProgress (barra de navegação popularizada por YouTube e GitHub)
reference_url: https://github.com/rstacruz/nprogress
react: Em Next.js App Router, dispare start/done nos eventos de navegação ou com useTransition.
status: stable
---

## Quando usar
- Navegação client-side, envio de formulário e ações que não têm lugar próprio para mostrar loading.

## Evite
- Progresso "falso" que para em 90% por muito tempo. Se demorar mais de 8s, mostre mensagem.

## Implementação
- `start()` agenda a barra após 150ms e faz "trickle" assintótico até 90%.
- `done()` vai a 100% e some com fade.
