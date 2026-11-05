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

## 4. Ainda não construído (precisa de acesso externo para testar)

- Receber respostas da cliente (confirmar/remarcar pelo WhatsApp) e o chat com foto: precisam do webhook da Evolution.
- Tela para ligar/desligar lembretes e ajustar a antecedência (hoje fixo em 24 h).
- Notificação push (chaves VAPID).
- Puxar mudanças feitas direto no Google Agenda para o app (hoje a sincronização vai do app para o Google).
