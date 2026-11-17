# Clientes (cadastro e importação)

**Finalidade:** lista das clientes do estúdio com busca enquanto digita, cartão com histórico/resumo e conversa, e importação de contatos (Google Contatos ou arquivo `.vcf`/`.csv`, iCloud via vCard exportado).

## Arquivos
- `features/clients/actions.ts`: `createClient`, `updateClient`, `deleteClient`, `loadClientCard`.
- `features/clients/core.ts`: `insertClient`, `searchClients`, `updateClientRow`, `deleteClientRow`, `clientSummary`.
- UI: `ClientRow.tsx` (linha que desliza, `ClientCardBody` = miolo da ficha), `ClientPanel.tsx` (ficha fixa do desktop), `ClientSearch.tsx` (troca `?q=` sem Enter/reload, mantém `?id=`), `NewClientSheet.tsx`.
- Desktop (≥1024 px): a página vira `1fr 420px`; a cliente aberta vem de `?id=` (trocado com `router.replace`, linha ativa com `aria-current`). J/K andam pela lista na tela (`neighbor.ts`, atalhos em `components/nav/Shortcuts.tsx`). Abaixo de 1024 px a ficha continua em folha.
- `features/contacts/*`: `parse.ts` (vCard/CSV, dedup por telefone), `google.ts` (People API; 401/403 = reconectar), `core.markExisting`/`importClients`, `actions.previewFromFile`/`previewFromGoogle`/`importSelected`, `ImportSheet.tsx`.
- Tela: `app/(app)/clientes`.

## Dados
- `clients` (nome, telefone E.164 único por estúdio, e-mail opcional). E-mail recebe o convite do Google Agenda.

## Ligações
- **Usa:** appointments (resumo/histórico), messaging (conversa no cartão), google (token para contatos).
- **Usado por:** appointments (seletor `LetterPicker`, `loadBookingOptions`), messaging/inbound (acha a cliente pelo telefone: `replies.phoneCandidates`), reminders.

## Cuidados
- Telefone sempre por `lib/phone.ts`; a resposta do WhatsApp só casa com a cliente se o telefone estiver normalizado.
- Nomes curto/completo aparecem nas mensagens (primeiro nome).
- Excluir cliente com agendamentos: confira o efeito em agenda e financeiro.
- Testes: `tests/e2e/clientes.spec.ts`, `tests/db/contacts.test.ts`.

## Exclusão (LGPD, 13/11)
- `clients/core.deleteClientRow`: sem agendamento apaga; com histórico **anonimiza** (`name = "Cliente removida"`, `phone_e164 = anon:<id>`, sem e-mail/observações, conversa apagada, `anonymized_at`). Atendimentos ficam para o financeiro.
- `searchClients` esconde anonimizadas (lista e seletores). A porta da Evolution recusa telefone que não seja `+dígitos`, então ninguém recebe mensagem para `anon:`.
- Migration `0033_client_anonymize.sql`.
