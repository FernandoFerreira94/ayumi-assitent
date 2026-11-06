# Configuração que depende do Fernando

O código já está pronto e testado com simulações. Falta configurar o que só você pode.

## 1. Google (login + Agenda)

1. Google Cloud Console → novo projeto → **APIs e serviços** → ativar **Google Calendar API**.
2. **Tela de consentimento OAuth**: tipo externo, adicionar os e-mails de teste (Yumi e o seu). Escopo: `.../auth/calendar`.
3. **Credenciais** → ID do cliente OAuth (aplicativo da Web).
   - URI de redirecionamento: `https://<seu-domínio>/api/auth/callback/google` (e `http://localhost:3000/api/auth/callback/google` para testes).
4. Guardar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

## 2. Variáveis no Railway (serviço do app)

| Variável                                    | Valor                                           |
| ------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`                              | URL do Postgres do Railway                      |
| `BETTER_AUTH_URL`                           | URL pública do app                              |
| `BETTER_AUTH_SECRET`                        | `openssl rand -base64 32`                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | do passo 1                                      |
| `ALLOWED_EMAILS`                            | e-mails que podem entrar, separados por vírgula |

Comando de release/deploy: `pnpm db:migrate` antes de `pnpm start`.

## 3. Worker de lembretes (segundo serviço no Railway)

- Mesmo repositório, comando de start: `pnpm worker` (usa pg-boss no mesmo Postgres; roda a cada 5 minutos).
- Variáveis: `DATABASE_URL` (igual ao app) + `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`.
- Sem as variáveis da Evolution o worker sobe e apenas registra "reminders_skipped".
- Lembrete sai 24 h antes do horário, uma única vez por agendamento; se o envio falha, tenta de novo na rodada seguinte.

## 4. Observabilidade e backup

- **Healthcheck do Railway:** caminho `/api/health` (200 só se o banco responde).
- **Sentry (opcional):** crie um projeto Next.js no Sentry e defina `SENTRY_DSN` (servidor) e `NEXT_PUBLIC_SENTRY_DSN` (navegador). Sem DSN fica desligado; os erros sempre saem como JSON nos logs do Railway.
- **Backup diário:** crie um Bucket no Railway e um serviço **Cron** (mesmo repositório) com comando `pnpm backup` e agenda `0 6 * * *` (03:00 de Brasília). A imagem precisa do `pg_dump` (cliente PostgreSQL 16).
  Variáveis: `DATABASE_URL`, `BACKUP_BUCKET`, `BACKUP_ENDPOINT`, `BACKUP_ACCESS_KEY_ID`, `BACKUP_SECRET_ACCESS_KEY`, opcionais `BACKUP_REGION` (padrão `auto`) e `BACKUP_KEEP_DAYS` (padrão 14).
  Restaurar: baixe o `.sql.gz` e rode `gunzip -c arquivo.sql.gz | psql "$DATABASE_URL"` num banco vazio. **Faça um teste de restauração antes de confiar.**

## 5. Ainda não construído (precisa de acesso externo para testar)

- Receber respostas da cliente (confirmar/remarcar pelo WhatsApp) e o chat com foto: precisam do webhook da Evolution.
- Tela para ligar/desligar lembretes e ajustar a antecedência (hoje fixo em 24 h).
- Notificação push (chaves VAPID).
- Puxar mudanças feitas direto no Google Agenda para o app (hoje a sincronização vai do app para o Google).

## Avisos push (iPhone)
1. Gerar chaves: `npx web-push generate-vapid-keys`.
2. Variáveis no app **e** no worker: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (também no build), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ex.: `mailto:voce@dominio.com`).
3. No iPhone: instalar o app na tela de início (iOS 16.4+), abrir Ajustes > Avisos no celular > Ativar.
4. O worker envia, todo dia às 09h (Brasília), um aviso se houver pendências.

## Importar clientes
- Arquivo `.vcf`/`.csv`: funciona sem configurar nada. No iPhone: Contatos > selecionar > Compartilhar > salvar em Arquivos (ou exportar de planilha/Google Contatos).
- Google Contatos: ative a **People API** no Google Cloud e inclua o escopo `contacts.readonly` na tela de consentimento. Quem já conectou o Google antes precisa sair e entrar de novo para dar a nova permissão.

## Deploy no Railway
`railway.json` já define build (`pnpm build`), start com migração (`pnpm db:migrate && pnpm start`) e healthcheck em `/api/health`. O serviço worker usa o mesmo repositório, mas com **Settings > Config-as-code > Railway Config File = `/railway.worker.json`** (start `pnpm worker`, sem healthcheck). Sem isso o `railway.json` do app valeria também para o worker.
Variáveis do app: `DATABASE_URL` (`${{Postgres.DATABASE_URL}}`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (a URL pública), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAILS`.

## WhatsApp por estúdio
Cada estúdio conecta o próprio número em **Ajustes > WhatsApp** (código de pareamento). O app cria a instância `studio-<id>` na Evolution. Variáveis no **app e no worker**: `EVOLUTION_URL` e `EVOLUTION_API_KEY` (a `AUTHENTICATION_API_KEY` da Evolution). `EVOLUTION_INSTANCE` virou opcional (instância de reserva para estúdios sem conexão pelo app).
