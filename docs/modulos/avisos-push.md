# Avisos do dia e push

**Finalidade:** notificações no celular da profissional (Web Push, funciona com o app fechado): bom dia 2 h antes da 1ª cliente, folga (com clima), fim do expediente, roteiro da semana, feriados/datas comemorativas; além dos avisos de WhatsApp (confirmou, quer remarcar, não respondeu).

## Arquivos
- Push: `features/push/webpush.ts` (`pushFromEnv`; emoji do mascote da pessoa no título, cache 5 min), `port.ts` (mesma `tag` substitui o aviso anterior), `core.ts` (`saveSubscription`, `sendToAll`, `notifyPendencias`), `actions.subscribePush`/`unsubscribePush`, `PushToggle.tsx`.
- Avisos: `features/owner-notices/run.ts` (`runOwnerNotices`), `plan.ts` (regra pura: `dueNotices`, `isDayOff`, `dayEndMin`), `core.ts` (`runTenantNotices`, `daySummary`, `testNotice`), `texts.ts` (banco de frases, `pickVariant`), `ai.ts` (texto maior pela IA; sem chave cai no texto pronto), `weather.ts` (Open-Meteo), `holidays.ts`, `device-location.ts` (GPS + BigDataCloud), `mascots.ts`.
- UI: `DailyNoticesCard.tsx` (Ajustes > Avisos do dia, teste na hora), `LocationToggle.tsx` (Conexões), `NoticeHost.tsx` (`?aviso=<id>` abre o texto num diálogo).
- Worker: fila de avisos a cada 5 min.

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
