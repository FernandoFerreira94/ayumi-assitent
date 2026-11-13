---
id: delivery-courier
product: delivery
title: App do entregador
family: Serviços e verticais
summary: App de quem entrega: aceita a corrida, navega até a coleta e a entrega, prova a entrega e vê quanto ganhou. Uma mão, moto parada, sol na tela, sinal instável.
kpi: Taxa de aceite de corridas e entregas concluídas sem contato com o suporte
themes: [clean-saas, playful]
patterns: [ios-tab-bar, ios-stack-navigation, bottom-sheet, action-sheet, offline-action-queue, connection-status, permission-priming, swipe-row-actions, async-button-states, toast-stack, otp-code-input, pix-copy-paste, kpi-stat-card, bar-ranking, empty-state, status-banner, order-tracking, chat-thread]
density: comfortable
radius: 14
components: [button, card, badge, drawer, sheet, dialog, alert-dialog, tabs, switch, sonner, skeleton, field, input, stat-card, empty]
status: beta
---

## Objetivo
Aceitar ou recusar em segundos com a informação certa (distância, valor, destino), chegar sem errar e fechar a entrega com prova, sabendo sempre quanto ganhou no dia.

## Navegação
- Tab bar: **Corridas**, **Ganhos**, **Ajuda**, **Perfil**. Interruptor "Disponível" fixo no topo de Corridas.
- Corrida ativa vira um bottom sheet sobre o mapa com três alturas (resumo, detalhes, itens), sempre com a próxima ação no rodapé.
- Ocorrências (cliente ausente, endereço errado, pedido danificado) em action sheet; cada uma abre o fluxo próprio.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Nova corrida | cartão de oferta com valor, distância até coleta e entrega, bairro de destino, contagem regressiva visível e anunciada, Aceitar grande / Recusar | async-button-states, status-banner |
| Coleta | endereço da loja, código do pedido, botão "Cheguei na loja", conferência de itens | bottom-sheet, ios-stack-navigation |
| Entrega | endereço com complemento em destaque, Ligar/WhatsApp pelo app (número mascarado), código de entrega de 4 dígitos | otp-code-input, action-sheet |
| Prova | código, foto ou assinatura, conforme o pedido; envio na fila se sem sinal | offline-action-queue |
| Ganhos | hoje, semana, por corrida, gorjetas, saque via Pix | kpi-stat-card, bar-ranking, pix-copy-paste |

## Regras
- Oferta legível em 2 segundos: valor e distância total em fonte grande; Aceitar à direita, na zona do polegar.
- Contagem regressiva com número e barra, anunciada a cada 10s para leitor de tela; nunca só cor.
- Ações perigosas (cancelar corrida) com motivo e confirmação; ações frequentes (cheguei, coletei) em um toque com desfazer de 5s.
- Navegação externa (Google Maps, Waze) por deep link; o app não tenta ser GPS.
- Localização pedida no primeiro "Disponível", explicando o uso; só rastreia com o interruptor ligado.
- Telefone do cliente mascarado; contato pelo app.
- Tema claro por padrão e contraste acima do mínimo (sol); suporte ao escuro à noite seguindo o sistema.

## Recomendações
- **Tema:** Clean SaaS (contraste e sobriedade) ou Playful para marca jovem, sempre com alvos ≥ 48px.
- **Densidade:** confortável; Aceitar com 56px de altura, largura total.
- **Componentes-chave:** Drawer (sheet de corrida), Switch (disponível), StatCard (ganhos), AlertDialog (cancelar).
- **Plataforma:** Expo recomendado (localização em segundo plano, push confiável, áudio de nova corrida). PWA só para piloto.

## Estados críticos
- Sem sinal no meio da entrega: prova fica na fila e a corrida mostra "Aguardando envio".
- Cliente ausente: fluxo com tempo de espera, tentativa de contato registrada e instrução da plataforma.
- Corrida cancelada pela loja depois de aceita: aviso claro, valor de compensação quando houver.

## Anti-padrões
- Oferta com texto pequeno e Aceitar pequeno no topo.
- Exigir digitação durante a rota.
- Mapa próprio competindo com o app de navegação do entregador.

## Referências
- Apple HIG, Sheets e Privacy (localização): https://developer.apple.com/design/human-interface-guidelines/sheets · https://developer.apple.com/design/human-interface-guidelines/privacy
- Material 3, Bottom sheets: https://m3.material.io/components/bottom-sheets/guidelines
- Expo, Location (background): https://docs.expo.dev/versions/latest/sdk/location/
