---
id: permission-priming
title: Pedido de permissão no momento certo
category: onboarding
summary: Antes do diálogo do sistema (notificações, localização, câmera), uma tela explica o benefício no contexto da ação. Se a pessoa aceita, chama o pedido real; se recusa, o app segue funcionando e mostra como ativar depois.
themes: [aurora, clean-saas, playful]
products: [mobile-app, field-service, delivery, habits, health, fintech, ecommerce]
motion: low
tech: js
deps: []
a11y: Texto diz o que a pessoa ganha e o que acontece se recusar; dois botões claros ("Ativar avisos" e "Agora não"); estado final em role="status"; nada bloqueia o uso do app.
perf: Só chama a API real depois do sim (Notification.requestPermission, getCurrentPosition, getUserMedia), preservando a única chance de diálogo do iOS. Consulta navigator.permissions.query antes para não pedir de novo.
reference_name: Apple HIG (Accessing private data) e web.dev (Permission UX)
reference_url: https://developer.apple.com/design/human-interface-guidelines/privacy
react: Hook usePermission(name) com query + request e estado 'prompt' | 'granted' | 'denied'. Expo: expo-notifications/expo-location com getPermissionsAsync antes de requestPermissionsAsync e Linking.openSettings() no estado negado.
status: stable
---

## Quando usar
- Na primeira vez que a função depende da permissão: "Avisar quando o técnico chegar", "Usar minha localização para o frete", "Fotografar o comprovante".

## Evite
- Pedir na abertura do app ou no onboarding, sem contexto.
- Pedir de novo depois de um "Agora não" na mesma sessão.
- Texto genérico ("Permita notificações para uma melhor experiência").

## Implementação
- Estados: `prompt` (mostra a explicação), `granted` (segue), `denied` (explica o caminho nos Ajustes, com link quando a plataforma permite).
- No iOS o diálogo do sistema aparece uma vez só por permissão; por isso a explicação vem antes.
- No PWA, notificações no iOS exigem o app instalado na tela inicial (16.4+): explique isso no estado não suportado.
