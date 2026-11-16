# Suporte e avisos do dono

**Finalidade:** o salão fala com o dono do produto dentro do app (Ajustes > Ajuda e suporte) e o dono publica avisos que aparecem como cartão no Painel de todos os salões.

## Arquivos
- Regras puras: `features/support/rules.ts` (`supportBody` limpa e limita a 2000; `noticeInput` com zod; `isNoticeLive`; `preview`; `sortConversations` = sem resposta primeiro; textos de push sem nome nem trecho da mensagem).
- Lado do salão (dentro de `withTenant`, RLS): `features/support/core.ts` (`listSupportMessages`, `unreadSupportReplies`, `markSupportRepliesRead`, `sendSupportMessage` com trava por salão e limite de 10 por hora, `liveNoticesFor` no máximo 3 com importante na frente, `dismissNotice`). Actions: `features/support/actions.ts` (`sendSupport`, `markSupportRead`, `dismissPlatformNotice`).
- Lado do dono: `features/support/admin.ts` (leituras com `requireAdmin`, como dono do banco), `admin-write.ts` (escritas sem checagem, chamadas só pelas actions; separado para os testes), `admin-actions.ts` (`replySupport`, `markSupportSeen`, `createPlatformNotice`, `endPlatformNotice`, todas com `requireAdmin` e registro).
- UI: `ui/SupportThread.tsx` (conversa nos dois lados, balões no visual do chat da cliente, envio otimista com "Tentar de novo"), `ui/SupportSheet.tsx` (admin, vaul, `?salao=`), `ui/PlatformNotices.tsx` + `ui/NoticeCard.tsx` (topo do Painel só no dia de hoje; falha não derruba o Painel), `ui/NoticeComposer.tsx` (formulário com prévia), `ui/faq.ts`.
- Telas: `app/(app)/ajustes/suporte` (conversa, dúvidas comuns, WhatsApp e e-mail), `app/admin/suporte`, `app/admin/avisos`. Menu do admin mostra quantos salões esperam resposta (`unreadSupportCount` no `AdminShell`).

## Fluxo
- Salão manda: grava como `salon`; se não havia nada esperando resposta, manda push ao dono (`notifyAdmins`, link `/admin/suporte?salao=<id>`). Mensagens seguidas = um aviso só.
- Dono abre a conversa: marca as do salão como lidas. Responde: grava como `admin`, marca lidas e manda push aos aparelhos do salão (`sendToAll`, link `/ajustes/suporte`).
- Salão vê "O suporte respondeu" no Painel e o selo em Ajustes; abrir a tela marca como lida.
- Aviso: dono publica (info ou importante, sai sozinho em 1/3/7/30 dias ou só ao encerrar). Cada pessoa fecha o seu; o dono vê quantas fecharam e pode encerrar.

## Tabelas (migration `0045_support.sql`)
- `support_messages(tenant_id, author salon|admin, user_id, body, read_at, created_at)`. `app_user`: SELECT do próprio salão, INSERT só como `salon`, UPDATE só de `read_at` em mensagens `admin`. Sem DELETE. Resposta do dono é gravada pelo servidor como dono do banco.
- `platform_notices(title, body, tone, ends_at, ended_at, created_by)`: `app_user` só lê.
- `platform_notice_dismissals(notice_id, tenant_id, user_id)`: RLS por salão.
- Registro do admin: `view_support`, `support_reply` (target = salão), `view_notices`, `notice_created`, `notice_ended`.

## Cuidados
- Push nunca leva nome de salão nem trecho da conversa (passa pela Apple/Google).
- Mensagens somem junto com o salão (cascade). Ainda sem retenção própria: entra com a política de LGPD.
- 0043-0044 ficaram livres para o retorno da cliente.
