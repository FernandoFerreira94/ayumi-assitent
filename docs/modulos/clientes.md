# Clientes (cadastro e importação)

**Finalidade:** lista das clientes do estúdio com busca enquanto digita, cartão com histórico/resumo e conversa, e importação de contatos (Google Contatos ou arquivo `.vcf`/`.csv`, iCloud via vCard exportado).

## Arquivos
- `features/clients/actions.ts`: `createClient`, `updateClient`, `deleteClient`, `loadClientCard`.
- `features/clients/core.ts`: `insertClient`, `searchClients`, `updateClientRow`, `deleteClientRow`, `clientSummary`.
- UI: `ClientRow.tsx` (cartão grande, abre conversa), `ClientSearch.tsx` (troca `?q=` sem Enter/reload), `NewClientSheet.tsx`.
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
