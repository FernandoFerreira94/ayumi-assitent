# Siri e Atalhos do iPhone (fase 1, só leitura)

**Finalidade:** a profissional pergunta para a Siri "Agenda de hoje", "Próxima cliente" ou "Resumo do dia" e ouve a resposta sem abrir o app. Funciona com um Atalho do iPhone que chama a API com uma **chave pessoal só de leitura**. Nenhuma rota escreve: agendar por voz é a fase 3 (escopo `write` separado, com confirmação). Plano: doc "Plano Siri + Atalhos (fase 1, só leitura)".

## Arquivos

- `features/atalhos/token.ts`: `newApiToken` (`bub_` + 32 bytes base64url), `hashApiToken` (SHA-256), `isApiTokenShape`, `tokenLast4`, `bearerToken` (lê `Authorization: Bearer`).
- `core.ts` (puro, testável): `falaAgenda`, `falaProxima`, `falaResumo`, `nextOf`, `spokenTime` ("9h", "10h30"), `parseDia`, `dayOf`, `publicRow`. A frase nasce no servidor: dá para melhorar o texto sem reinstalar o Atalho. **Só o primeiro nome da cliente** (a Siri fala alto), sem telefone.
- `rate.ts`: limite em memória: 60/min por IP **antes do banco**, 30/min e 500/dia por chave. Zera a cada deploy; com mais de uma instância do web, mover para o Postgres.
- `server.ts`: `activeTokenByHash` (como dono do banco: ainda não se sabe o estúdio), `markTokenUsed` (no máximo a cada 10 min), `loadRows` (via `withTenant` + `appointments/core.listDay`), `handleAtalho` (casca das rotas), `listApiTokens`.
- `actions.ts`: `createApiToken(nome)` (máx. 3 ligadas, devolve a chave só nessa hora), `revokeApiToken(id)`.
- `tokens-shared.ts`: `MAX_ACTIVE_TOKENS`, tipo `TokenItem` (fora do `"use server"`).
- `AtalhosCard.tsx`: tela `/ajustes/siri` (seção `siri` em `settings/sections.ts`, linha em Conexões). Criar no sheet (vaul): nome do aparelho → chave com Copiar + endereços dos 3 Atalhos com Copiar. Lista "•••• a9F2 · usada há X" e Desligar com confirmação na linha.

## Rotas (GET, `Authorization: Bearer bub_…`)

| Rota | Parâmetros | Resposta |
| --- | --- | --- |
| `/api/v1/atalhos/agenda` | `dia=hoje\|amanha` | `{ fala, dia, atendimentos[] }` (hoje: a frase lista só o que falta) |
| `/api/v1/atalhos/proxima` | — | `{ fala, proxima }` (hoje e próximos 7 dias; "daqui a 40 min") |
| `/api/v1/atalhos/resumo` | `dia=hoje\|amanha` | `{ fala, dia, total }` (previsto, recebido, sem confirmar) |

- Sem chave, chave errada ou desligada: **o mesmo 401** com `fala` "Esse atalho não está mais ligado…". Limite: 429 com `fala`. Erro: 500 com `fala`, log só `errInfo` (nunca chave nem nome).
- `Cache-Control: private, no-store`, `noindex`, sem CORS. `/api` fica fora do `proxy.ts`.

## Dados

- Tabela `api_tokens` (migration `0047_api_tokens.sql`, RLS por estúdio): `token_hash` único, `scope` (só `read`), `last4`, `name`, `user_id`, `last_used_at`, `revoked_at`. Separada do `tenants.calendar_token_hash`: desligar uma não derruba a outra.

## Atalho no iPhone (manual, fase 1)

1. Atalhos → novo Atalho com o nome da frase (ex.: "Agenda de hoje").
2. "Obter Conteúdo do URL": endereço copiado na tela, método GET, cabeçalho `Authorization` = `Bearer <chave>`.
3. "Obter Valor do Dicionário": chave `fala`.
4. "Mostrar Resultado" (a Siri lê em voz alta) ou "Falar Texto".

Próximo passo: Atalhos prontos publicados por link do iCloud com **pergunta de importação** para a chave (o link nunca carrega a chave de ninguém). Só publicar depois da troca para `app.bubbly.app.br` (a URL fica dentro do Atalho).

## Ligações

- **Usa:** appointments (`listDay`), dashboard (`untilLabel`), lib/dates.
- **Usado por:** Ajustes (linha e seção).

## Testes

- `tests/unit/atalhos.test.ts` (chave, frases, limite), `tests/db/atalhos.test.ts` (isolamento por estúdio, 401 igual, revogada, último uso, RLS), `tests/e2e/siri-atalhos.spec.ts` (criar, consultar as 3 rotas, desligar).
