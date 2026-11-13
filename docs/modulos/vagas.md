# Vagas e expediente

**Finalidade:** expediente por dia da semana (com pausa), cálculo dos horários livres por serviço e o "Copiar texto para divulgar" (formatos Padrão e Agenda aberta, horários exclusivos marcados como "(blindagem)" só no texto, listas personalizadas salvas).

## Arquivos
- `features/hours/core.ts` (`getHours`, `saveHours`; sem linha salva usa seg–sáb 09–18), `slots.ts` (livres = expediente − agendamentos − bloqueios − pausa), `actions.saveWorkingHours`, `HoursForm.tsx` (`/ajustes/expediente`).
- Divulgar: `ShareSheet.tsx`, `share-text.ts` (faixas "09:00 às 11:30"), `CustomSheet.tsx` + `custom-actions.ts` (`computeCustomSlots`, `saveCustomList`, `deleteCustomList`), `custom-slots.ts` (turnos pelo horário de início), `slot-lists.ts`.
- `SlotButton.tsx`: tocar na vaga abre o agendamento já preenchido.
- Tela: `app/(app)/vagas` (chama `blocks/external-sync.syncExternalCalendars`, Google e iCloud em paralelo, antes de calcular). "+ Serviço" abre `services/NewServiceSheet` por cima, sem ir para Serviços.

## Dados
- `working_hours` (por dia, com pausa), `slot_lists` (listas personalizadas, `config` jsonb), lê `appointments` e `blocks`.

## Ligações
- **Usa:** appointments, blocks, services, google (eventos importados viram `blocks`).
- **Usado por:** appointments (expediente no dia), calendar, owner-notices (folga e fim do expediente).

## Cuidados
- Mudou regra de expediente: avisos do dia dependem dela (`owner-notices/plan.isDayOff`, `dayEndMin`).
- Texto de divulgação segue o modelo da cliente (semanas, "dd/mm - 09:00 | 10:00"); confira a prévia.
- Testes: `tests/e2e/vagas.spec.ts`, `tests/unit/slots.test.ts`, `share-text.test.ts`, `custom-slots.test.ts`.
