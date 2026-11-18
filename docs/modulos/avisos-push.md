# Avisos do dia e push

**Finalidade:** notificações no celular da profissional (Web Push, funciona com o app fechado): bom dia 2 h antes da 1ª cliente, folga (com clima), fim do expediente, roteiro da semana, feriados/datas comemorativas; além dos avisos de WhatsApp (confirmou, quer remarcar, não respondeu).

## Arquivos
- Push: `features/push/webpush.ts` (`pushFromEnv`; emoji do mascote da pessoa no título, cache 5 min), `port.ts` (mesma `tag` substitui o aviso anterior), `core.ts` (`saveSubscription`, `sendToAll`, `notifyPendencias`), `actions.subscribePush`/`unsubscribePush`, `PushToggle.tsx`.
- Avisos: `features/owner-notices/run.ts` (`runOwnerNotices`), `plan.ts` (regra pura: `dueNotices`, `isDayOff`, `dayEndMin`), `core.ts` (`runTenantNotices`, `daySummary`, `testNotice`), `texts.ts` (banco de frases, `pickVariant`), `ai.ts` (texto maior pela IA; sem chave cai no texto pronto), `weather.ts` (Open-Meteo), `holidays.ts`, `device-location.ts` (GPS + BigDataCloud), `mascots.ts`.
- UI: `PushToggle` (`features/push`, `/ajustes/notificacoes`, sem texto longo nem botão de teste desde 13/11; a action `sendTestNotice` ficou sem tela), `LocationToggle.tsx` (Ajustes > Notificações), `NoticeHost.tsx` (`?aviso=<id>` abre o texto num diálogo).
- Worker: fila de avisos a cada 5 min.

## Por pessoa (equipe, A5)
- `push/recipients.ts` (regra pura): `appointmentRecipients(members, professionalId)` = login ligado à profissional do atendimento + owner/admin (Set, sem duplicar); sem login dela, só owner/admin. `noticeScope(member)`: owner/admin = salão; profissional = só a própria agenda (D5); sem agenda ligada = sem aviso do dia.
- `sendToAll(tx, port, payload, only?)`: `only` = ids de login. Push de resposta da cliente (`messaging/inbound.ts`) e "não respondeu" (`reminders/no-reply.ts`) usam o atendimento; conversa sem atendimento vai só para owner/admin. `team/membership.membersOf(tenantId)` lê os logins (papel dono do banco).
- Avisos do dia: horário e registro (`owner_notices`, uma linha por tipo/dia) seguem o salão; o conteúdo é por login: owner/admin recebem o resumo do salão, profissional o da própria agenda (e só se trabalha no dia). Roteiro da semana da profissional não usa IA nem abre o diálogo (texto compartilhado); datas comemorativas (mensagem para clientes) só para owner/admin.
- Limitação: sem migration não há aviso por profissional em `owner_notices` (unique por salão/tipo/dia), então a hora do aviso da profissional é a do salão. Pendências (`notifyPendencias`) seguem para todos.

## Dados
- `push_subscriptions`, `owner_notices` (kind, day, variant: garante uma vez por dia), `tenants` (localização, `location_source`).

## Ligações
- **Usa:** hours (expediente/folga), appointments e blocks (resumo do dia), push.
- **Usado por:** worker, messaging/reminders/webhook (push), components/brand (mascote).

## Cuidados
- Precisa de VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) em web e worker.
- Toda regra de horário em `plan.ts` (pura e testada); fuso do estúdio.
- Falha de clima/IA nunca bloqueia o aviso.
- Mudou aqui: Redeploy do **worker**.
- Testes: `tests/db/push.test.ts`, `tests/unit/owner-notices.test.ts`, `push-schema.test.ts`.

- Push também é usado pelo painel do dono (`admin/alerts.notifyAdmins`: cadastro novo, resumo das 9h, suporte) e pelo suporte (`sendToAll` ao salão). Ver [admin.md](admin.md) e [suporte.md](suporte.md).
- App da loja: push nativo (FCM/APNs). `pushFromEnv` roteia pelo endpoint (`fcm:`/`apns:` vs URL Web Push); canal sem env lança erro comum (não apaga a inscrição). Ver [apps-loja.md](apps-loja.md).
