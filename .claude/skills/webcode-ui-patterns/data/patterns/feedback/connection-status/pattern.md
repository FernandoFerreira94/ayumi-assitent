---
id: connection-status
title: Status de conexão e fila offline
category: feedback
summary: Quando a rede cai, uma faixa discreta avisa que o app está offline, as ações continuam entrando numa fila local com contador, e ao voltar a conexão a fila sincroniza e confirma. Sem bloquear a tela.
themes: [clean-saas, aurora, playful]
products: [pos, delivery, logistics, mobile-app, helpdesk, saas, health, automation, crm, field-service]
motion: low
tech: css-js
deps: []
a11y: Mudança de conexão anunciada em role="status"; itens pendentes marcados em texto ("Pendente"), não só por ícone; nada de modal bloqueando a operação.
perf: Usa navigator.onLine e eventos online/offline como sinal inicial e confirma com a próxima requisição real; fila em IndexedDB ou localStorage com try/catch.
reference_name: web.dev (Offline UX design guidelines)
reference_url: https://web.dev/articles/offline-ux-design-guidelines
react: Hook useOnline com useSyncExternalStore; fila com TanStack Query (networkMode offlineFirst) ou service worker com Background Sync.
status: stable
---

## Quando usar
- PDV, app de entregador, coleta em campo, atendimento: lugares com rede instável onde parar é perder venda.

## Evite
- Bloquear a tela inteira com "Sem internet".
- Fingir que salvou: o item fica marcado como pendente até o servidor confirmar.
- Confiar só em `navigator.onLine`: ele diz que há rede, não que o servidor responde.

## Implementação
- Três estados: online (nada aparece), offline (faixa + contador), sincronizando (progresso) → "Tudo sincronizado" some em 3s.
- Conflitos de sincronização vão para uma lista de revisão, não descartados em silêncio.
