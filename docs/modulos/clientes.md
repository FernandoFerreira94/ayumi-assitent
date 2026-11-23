# Clientes (cadastro e importação)

**Finalidade:** lista das clientes do estúdio com busca enquanto digita, cartão com histórico/resumo e conversa, e importação de contatos (Google Contatos, arquivo `.vcf`/`.csv`, iCloud via vCard exportado e, no app da loja, a agenda do celular).

## Arquivos
- `features/clients/actions.ts`: `createClient`, `updateClient`, `deleteClient`, `loadClientCard`.
- `features/clients/core.ts`: `insertClient`, `searchClients`, `updateClientRow`, `deleteClientRow`, `clientSummary`.
- UI: `ClientRow.tsx` (cartão grande, abre conversa), `ClientSearch.tsx` (troca `?q=` sem Enter/reload), `NewClientSheet.tsx`.
- `features/contacts/*`: `parse.ts` (vCard/CSV, dedup por telefone), `google.ts` (People API; 401/403 = reconectar), `core.markExisting`/`importClients`, `actions.previewFromFile`/`previewFromGoogle`/`previewFromDevice`/`importSelected`, `ImportSheet.tsx`. Agenda do celular: `features/native/device-contacts*` (plugin `@capacitor-community/contacts`; botão só aparece com o plugin no APK); `NewClientSheet` tem "Escolher da agenda do celular".
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

## Para chamar (16/11)
- Topo de `/clientes` (só sem busca): `clients/core.listDueReturns` = última visita concluída de cada cliente com `return_due_on` de hoje−30 a hoje+7, sem "Não precisa", sem horário futuro e sem anonimizada; mais atrasada primeiro (até 50). `returns/DueReturns.tsx` mostra 4 e "Ver todas".
- Balão abre a `ChatSheet` com `initialText` (convite pronto, a dona edita e envia: nada sai sozinho). "Horários" abre o `ReturnPrompt`.

## Exclusão (LGPD, 13/11)
- `clients/core.deleteClientRow`: sem agendamento apaga; com histórico **anonimiza** (`name = "Cliente removida"`, `phone_e164 = anon:<id>`, sem e-mail/observações, conversa apagada, `anonymized_at`). Atendimentos ficam para o financeiro.
- `searchClients` esconde anonimizadas (lista e seletores). A porta da Evolution recusa telefone que não seja `+dígitos`, então ninguém recebe mensagem para `anon:`.
- Migration `0033_client_anonymize.sql`.

## Desktop (18/11)

- `/clientes` com `PageShell wide`. A partir de 1024 px (`ClientsDesk`, `useIsDesk`): tocar no nome **escolhe** a cliente e a ficha fica aberta ao lado (`ClientPanel`, mesmo miolo da folha: `ClientCardContent` + `useClientCard` exportados de `ClientRow.tsx`); sem ninguém escolhida, o lado mostra o resumo (total, sumidas, novas, para chamar). Abaixo de 1024 px nada muda (folha como antes).
- Filtros `?f=sumidas|fieis|novas` (`clients/filters.ts`, puro e testado): sumidas = 60+ dias sem vir e sem horário marcado; mais fiéis = top 20 por visitas; novas = cadastro nos últimos 30 dias. Números por cliente em `core.clientStats` (um `group by` em `appointments`); a linha mostra "N visitas · última há X dias" só no desktop.
- Aniversariantes ficou de fora: `clients` não tem data de nascimento (precisaria de migration).
- 19/11 (carteira PR 3): a ficha mostra "Crédito no salão" com extrato e Devolver (`wallet/ClientWallet.tsx`; `loadClientCard` traz `wallet`). Ver [carteira.md](carteira.md).
- 19/11 (carteira PR 4): a ficha mostra "Pacotes" (sessões que restam, validade) e Vender pacote. Ver [carteira.md](carteira.md).

## Histórico completo (23/11)

- Botão **Histórico** na ficha (ao lado de Conversar; celular, tablet e desktop) abre `clients/HistorySheet.tsx` por cima (folha aninhada no celular, painel à direita no desktop), com fundo opaco para leitura longa.
- **Resumo no topo** (`history.clientHistorySummary`): atendimentos concluídos, faltas e gasto em números grandes; "Comparece em N%" (`attendanceRate` = concluídos ÷ concluídos + faltas), última visita, cancelamentos, cliente desde, próximo horário, plano ativo (sessões que restam, via `clientPackageList`) e crédito (`walletBalance`).
- **Linha do tempo** (`history.clientHistoryPage`), mais novo primeiro, agrupada por mês, 20 por vez (cursor `instante|id`, botão "Ver mais antigos" + carregamento ao rolar). Junta três fontes sem duplicar regra: atendimentos (todos os status, com pago via `paidCentsSql`, plano/promoção/desconto/observação), vendas de pacote (`client_packages`) e dinheiro do extrato (`client_ledger`, sem as anulações e o movimento anulado).
- **Filtros:** Tudo (atendimentos + pacotes + dinheiro avulso, isto é, sem atendimento e sem pacote) · Atendimentos · Planos (vendas + atendimentos que usaram pacote) · Pagamentos (todo dinheiro, inclusive sinal e venda de pacote) · Faltas (`no_show`).
- Regras puras e textos em `clients/history-rules.ts` (status, cor, "Sinal R$ X · falta R$ Y", nome do movimento: Sinal/Pagamento/Pagou o pacote X/Virou crédito…). Ação `actions.loadClientHistory(id, filtro, cursor)`: resumo só na 1ª página; cliente de outro salão = `NOT_FOUND` (RLS).
- Sem migration. "Remarcou" não tem registro próprio no banco (só o status "Pediu para remarcar"); se quiser no histórico, precisa de log de eventos.
- Testes: `tests/unit/client-history.test.ts`, `tests/db/client-history.test.ts` (filtros, paginação sem pular, anulação, isolamento), `tests/e2e/historico.spec.ts`.
