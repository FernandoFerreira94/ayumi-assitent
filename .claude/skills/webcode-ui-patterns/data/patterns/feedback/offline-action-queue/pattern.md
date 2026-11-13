---
id: offline-action-queue
title: Ações offline em fila (otimista + sincronização)
category: feedback
summary: Sem sinal, a ação acontece na tela na hora (concluir entrega, marcar etapa) com um selo de "pendente". Uma faixa discreta conta o que está na fila e, quando a conexão volta, tudo sincroniza sozinho com progresso e aviso de conflito.
themes: [clean-saas, aurora, playful]
products: [field-service, delivery, logistics, mobile-app, habits, health, pos]
motion: low
tech: js
deps: []
a11y: Estado da fila em role="status" ("2 ações aguardando conexão"); selo "Pendente" em texto, não só ícone; falha mostra o motivo e botão "Tentar de novo"; nada é apagado sem aviso.
perf: Atualização otimista local (sem esperar a rede); fila persistida (IndexedDB/localStorage) e reenviada em ordem quando o evento online dispara, com backoff exponencial. Background Sync onde houver suporte.
reference_name: web.dev (Offline UX design guidelines) e Workbox Background Sync
reference_url: https://web.dev/articles/offline-ux-design-guidelines
react: TanStack Query com networkMode "offlineFirst", mutações persistidas (persistQueryClient + resumePausedMutations) e onMutate otimista. Expo: o mesmo, com AsyncStorage/MMKV e NetInfo no onlineManager.
status: stable
---

## Quando usar
- Apps usados na rua ou em lugares sem sinal: técnico em subsolo, entregador, coleta de assinatura, check-in de hábito.
- Qualquer ação idempotente que pode ser reenviada com segurança.

## Evite
- Fila offline para pagamento ou qualquer ação que não pode ser repetida sem chave de idempotência.
- Modal bloqueando a tela quando cai a conexão (use faixa, padrão `connection-status`).
- Sincronizar em silêncio quando houver conflito: mostre e deixe a pessoa escolher.

## Implementação
- Cada ação tem id único (chave de idempotência), timestamp e estado: `pending` → `syncing` → `done` | `failed`.
- Ao voltar a conexão, reenvie em ordem; conflito (ex.: OS cancelada pelo escritório) vira item com explicação.
- Mostre "Sincronizado agora" por 3s e some; o histórico fica em Ajustes.
- Teste com DevTools › Network › Offline e no modo avião de verdade.
