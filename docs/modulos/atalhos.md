# Siri e Atalhos do iPhone (fase 1, só leitura)

> **23/11/2026: a Siri saiu do PWA.** Não há mais card nem linha em Ajustes > Conexões (o contador virou "X de 3"), nem tela `/ajustes/siri` (redireciona para `/ajustes`). A Siri vai **só no app nativo (Capacitor), já ligada, sem opção de ativar/desativar** (App Intents, fase 2). Foram apagados `AtalhosCard`, `SiriQuickConnect`, `atalho-guide` e `actions.ts` (criar/desligar chave, código de pareamento). **Ficam** as rotas `api/v1/atalhos/*` (incluindo `/parear`), `token.ts`, `core.ts`, `rate.ts`, `server.ts`, `tokens-shared.ts` e a tabela `api_tokens`: chaves já criadas continuam funcionando. As seções abaixo que falam da tela descrevem o histórico.

**Finalidade:** a profissional pergunta para a Siri "Agenda de hoje", "Próxima cliente" ou "Resumo do dia" e ouve a resposta sem abrir o app. Funciona com um Atalho do iPhone que chama a API com uma **chave pessoal só de leitura**. Nenhuma rota escreve: agendar por voz é a fase 3 (escopo `write` separado, com confirmação). Plano: doc "Plano Siri + Atalhos (fase 1, só leitura)".

## Arquivos

- `features/atalhos/token.ts`: `newApiToken` (`bub_` + 32 bytes base64url), `hashApiToken` (SHA-256), `isApiTokenShape`, `tokenLast4`, `bearerToken` (lê `Authorization: Bearer`).
- `core.ts` (puro, testável): `falaAgenda`, `falaProxima`, `falaResumo`, `nextOf`, `spokenHour` ("às duas e meia da tarde", "ao meio-dia"), `numberWords` (0–59 por extenso), `spokenTime` ("9h", só nos dados). Fala corrida para a Siri: números e horas por extenso, poucos pontos, valor sem ",00", `parseDia`, `dayOf`, `publicRow`. A frase nasce no servidor: dá para melhorar o texto sem reinstalar o Atalho. **Só o primeiro nome da cliente** (a Siri fala alto), sem telefone.
- `rate.ts`: limite em memória: 60/min por IP **antes do banco**, 30/min e 500/dia por chave. Zera a cada deploy; com mais de uma instância do web, mover para o Postgres.
- `server.ts`: `activeTokenByHash` (como dono do banco: ainda não se sabe o estúdio), `markTokenUsed` (no máximo a cada 10 min), `loadRows` (via `withTenant` + `appointments/core.listDay`), `handleAtalho` (casca das rotas), `listApiTokens`.
- `actions.ts`: `createApiToken(nome)` (máx. 3 ligadas, devolve a chave só nessa hora), `revokeApiToken(id)`.
- `tokens-shared.ts`: `MAX_ACTIVE_TOKENS`, tipo `TokenItem` (fora do `"use server"`).
- `atalho-guide.tsx`: `ATALHO_STEPS`, 7 passos ilustrados (SVG com `GuideArt`, no `StepGuide`) de como montar o Atalho no app Atalhos; aparecem na tela e no sheet depois de criar a chave.
- `SiriQuickConnect.tsx`: **"Adicionar à Siri" (2 toques)**, só quando `SIRI_SHORTCUT_URL` (link `https://www.icloud.com/shortcuts/…`, checado por `isShortcutLink`) existe. Toque → `createSiriPairing` cria um **código de uso único** `bubpar_…` (15 min, hash na mesma `api_tokens`, só o último vale) → copia (ClipboardItem com Promise, para o Safari não perder o toque) → abre o link do iCloud. "Já tenho o Atalho: ligar de novo" copia e abre `shortcuts://run-shortcut?name=Bubbly&input=clipboard`. Ao voltar, `router.refresh` mostra o iPhone na lista. Sem a variável, só o caminho manual.
- `AtalhosCard.tsx`: tela `/ajustes/siri` (seção `siri` em `settings/sections.ts`, linha em Conexões). Criar no sheet (vaul): nome do aparelho → **autorização** (`Bearer bub_…`, pronta para o valor do cabeçalho) + endereços dos 3 Atalhos com Copiar + passo a passo ilustrado. Colunas do sheet com `grid-cols-1 min-w-0` (o endereço longo estourava a largura no celular). Lista "•••• a9F2 · usada há X" e Desligar com confirmação na linha.

## Rotas (GET, `Authorization: Bearer bub_…`)

Resposta padrão: **texto puro** (`text/plain`), só a frase. Assim "Obter Conteúdo do URL" → "Falar" funciona sem passo de dicionário (antes a Siri lia o JSON inteiro). JSON só com `?formato=json` ou `Accept: application/json`.

| Rota | Parâmetros | Resposta JSON (`?formato=json`) |
| --- | --- | --- |
| `/api/v1/atalhos/agenda` | `dia=hoje\|amanha` | `{ fala, dia, atendimentos[] }` (hoje: a frase lista só o que falta) |
| `/api/v1/atalhos/proxima` | — | `{ fala, proxima }` (hoje e próximos 7 dias; "daqui a 40 min") |
| `/api/v1/atalhos/resumo` | `dia=hoje\|amanha` | `{ fala, dia, total }` (previsto, recebido, sem confirmar) |

- Sem chave, chave errada ou desligada: **o mesmo 401** com a frase "Esse atalho não está mais ligado…". Limite: 429 com frase. Erro: 500 com frase, log só `errInfo` (nunca chave nem nome).
- `Cache-Control: private, no-store`, `noindex`, sem CORS. `/api` fica fora do `proxy.ts`.

| `POST /api/v1/atalhos/parear` | corpo `{"codigo":"bubpar_…"}` ou o código em texto (nunca na URL) | 200: a chave `bub_…` em texto puro (o Atalho salva em arquivo). Vencido/usado/lixo: 400 com frase. Limite por IP. |

## Dados

- Tabela `api_tokens` (migration `0047_api_tokens.sql`, RLS por estúdio): `token_hash` único, `scope` (só `read`), `last4`, `name`, `user_id`, `last_used_at`, `revoked_at`. Separada do `tenants.calendar_token_hash`: desligar uma não derruba a outra.
- `pairing_expires_at` (migration `0048`): preenchido = código de pareamento pendente (não abre a agenda, não conta no limite de 3, não aparece na lista). `redeemPairing` troca numa UPDATE atômica: grava o hash da chave nova e zera o prazo.

## Atalho no iPhone (manual, fase 1)

1. Atalhos → novo Atalho com o nome da frase (ex.: "Agenda de hoje").
2. "Obter Conteúdo do URL": endereço copiado na tela, método GET, cabeçalho `Authorization` = `Bearer <chave>`.
3. "Falar" (já usa o "Conteúdo do URL"). Sem dicionário.

## Atalho pronto "Bubbly" (link do iCloud)

Um Atalho só, com menu (Agenda de hoje, Próxima cliente, Resumo do dia, Agenda de amanhã). Na 1ª vez sem chave salva, lê a Entrada do Atalho ou a área de transferência; se começar com `bubpar_`, faz o POST `/parear` e salva a chave em `Atalhos/bubbly-chave.txt` (iCloud Drive). Depois: lê o arquivo → menu → GET com `Authorization: Bearer` → Falar. Chave inválida: apaga o arquivo. O link é criado à mão no iPhone (Atalhos só são assinados pela Apple) e vai para a variável `SIRI_SHORTCUT_URL` do web. A URL do app fica dentro do Atalho: trocar de domínio = publicar o Atalho de novo.

## Ligações

- **Usa:** appointments (`listDay`), dashboard (`untilLabel`), lib/dates.
- **Usado por:** só as rotas da API (Ajustes não mostra mais a Siri desde 23/11).

## Testes

- `tests/unit/atalhos.test.ts` (chave, frases, limite), `tests/db/atalhos.test.ts` (isolamento por estúdio, 401 igual, revogada, último uso, RLS). O e2e da tela (`siri-atalhos.spec.ts`) saiu junto com a tela.
