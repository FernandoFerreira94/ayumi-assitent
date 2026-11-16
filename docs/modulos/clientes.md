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
- Testes: `tests/e2e/clientes.spec.ts`, `tests/e2e/retorno.spec.ts`, `tests/db/contacts.test.ts`.

## Retorno e histórico no cartão (16/11)
- `clients/core.clientSummary` traz `history` (últimas `HISTORY` = 5 visitas concluídas + 1 para o intervalo) e `ret` (retorno da visita mais recente, se tem `return_due_on` e não tem "Não precisa"). `actions.loadClientCard` monta o texto com `returns/rules.visitHistory` ("após N dias", "1ª visita", média "volta a cada ~N dias") e só mostra o retorno se a cliente não tem próximo horário.
- "Ver horários" fecha o cartão e abre `returns/ReturnPrompt` (sem o "Atendimento concluído"/Desfazer). O cartão agora rola (`max-h` + `overflow-y-auto`).

## Exclusão (LGPD, 13/11)
- `clients/core.deleteClientRow`: sem agendamento apaga; com histórico **anonimiza** (`name = "Cliente removida"`, `phone_e164 = anon:<id>`, sem e-mail/observações, conversa apagada, `anonymized_at`). Atendimentos ficam para o financeiro.
- `searchClients` esconde anonimizadas (lista e seletores). A porta da Evolution recusa telefone que não seja `+dígitos`, então ninguém recebe mensagem para `anon:`.
- Migration `0033_client_anonymize.sql`.
