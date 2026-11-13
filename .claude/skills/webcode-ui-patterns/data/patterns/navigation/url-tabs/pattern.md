---
id: url-tabs
title: Abas com teclado do APG e estado na URL
category: navigation
summary: Abas de visões do mesmo objeto com setas, Home/End, ativação automática, indicador que desliza e aba ativa refletida na URL (link compartilhável, F5 e voltar funcionam).
themes: [clean-saas, aurora, editorial, brutalista]
products: [saas, erp, crm, admin, helpdesk, devtools, ecommerce, edtech, event]
motion: low
tech: css-js
deps: []
a11y: role tablist/tab/tabpanel com aria-selected, aria-controls e tabindex móvel (só a aba ativa é tabulável); setas, Home e End; o painel é focável e rotulado pela aba.
perf: Indicador com translate e scale (sem animar width/left); conteúdo dos painéis montado sob demanda; hashchange sem recarregar.
reference_name: WAI-ARIA APG (Tabs)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
react: Use @webcode/tabs (já tem indicador deslizante) controlado por searchParams (?aba=faturas) com router.replace.
status: stable
---

## Quando usar
- Visões do mesmo registro: Visão geral, Faturas, Atividade, Configurações.

## Evite
- Abas como passos de um fluxo (use stepper).
- Mais de 6 abas; rótulos longos.
- Animar o conteúdo pesado do painel na troca.

## Implementação
- Ativação automática (a seta já troca) quando o painel é leve; manual (Enter/Espaço) quando carrega dados.
- A URL guarda `#aba=faturas` (`?aba=` em app real) com `replaceState` para não lotar o histórico.
- Indicador: `translate` + `scale` calculados a partir da aba ativa.
