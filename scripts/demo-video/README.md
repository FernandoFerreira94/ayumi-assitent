# Vídeo de demonstração · verificação de escopos sensíveis do Google

Roteiro guiado pelo Playwright para gravar o fluxo que o Google pede na verificação do app
(Sign-In, `calendar.events`, `contacts.readonly`) em https://app.bubbly.app.br. Fica fora do build.

| Arquivo | O que é |
|---|---|
| `record.ts` | Conduz o Chrome pelas cenas 0–6 e para (Enter no terminal) onde o login e as ações são feitas à mão |
| `captions.ts` | Fonte única das legendas em inglês |
| `subtitles.en.srt` | Legendas de referência, com durações estimadas (regerar: `pnpm exec tsx scripts/demo-video/reference-srt.ts`) |
| `out/` | Saída de cada gravação: o `.srt` sincronizado com o tempo real. Ignorado pelo git, assim como vídeos |

## Checklist de preparo (antes de gravar)

- [ ] A conta Google de **teste** está em *Test users* da tela de consentimento (o app continua em modo Teste; não mexer no Cloud Console).
- [ ] O idioma da conta de teste está em **English** (myaccount.google.com › Personal info › Language), para a tela de consentimento sair em inglês.
- [ ] Acesso do Bubbly **revogado** em https://myaccount.google.com/permissions, para o consentimento aparecer completo.
- [ ] No Google Agenda da conta de teste existe um compromisso **"Dentist"** num dia visível (ex.: amanhã 11:00).
- [ ] No Google Contatos da conta de teste existem **3 contatos fictícios** (ex.: Ana Teste, Bia Teste, Carla Teste).
- [ ] O salão do Bubbly usado no vídeo tem só dados fictícios (cliente fictícia para o agendamento de teste).
- [ ] Gravador de tela pronto (OBS, ou Xbox Game Bar com Win+Alt+R) capturando a **janela inteira do Chrome**, com a barra de endereço.
- [ ] Notificações do Windows desligadas (Não incomodar) e nenhum dado pessoal aberto em outras abas.

## Como rodar

```powershell
pnpm install
```

```powershell
pnpm exec tsx scripts/demo-video/record.ts
```

1. Abre um Chrome 1280x800 com perfil **temporário** (fora do repo, apagado no fim; nenhum cookie ou token é salvo).
2. Posicione a janela, comece a gravar a tela e aperte Enter: o relógio das legendas começa nesse Enter.
3. Siga as instruções do terminal. O script nunca digita a senha do Google: login e consentimento são sempre à mão.
   Nas telas de consentimento ele segura 8 s para a URL (`client_id=` e escopos) aparecer no vídeo.
4. Se algum botão do Bubbly mudou e o script não achar, ele pede para fazer aquele passo à mão e segue.
5. No fim, pare a gravação. O `.srt` sincronizado fica em `scripts/demo-video/out/`.
   Se o gravador começou antes do Enter, ajuste o atraso das legendas no editor (ou corte o início do vídeo).

**Se o Google recusar o login** ("This browser or app may not be secure"), use o seu Chrome comum:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:TEMP\bubbly-demo" --window-size=1280,800
```

```powershell
pnpm exec tsx scripts/demo-video/record.ts --cdp http://localhost:9222
```

Depois, apague a pasta `%TEMP%\bubbly-demo`.

## Cenas

0. bubbly.app.br: nome e link da Política de Privacidade.
1. /login: links Privacidade e Termos, Entrar com Google, consentimento (8 s), aceite manual.
2. Agenda: criar agendamento de teste, ver no Google Agenda, editar horário, ver a atualização, cancelar, ver que sumiu.
3. Bloco "ocupado" vindo do compromisso "Dentist".
4. Clientes › Importar › Do Google Contatos: marcar e importar; mostrar que nada mudou no Google Contatos.
5. Ajustes: links no fim, privacidade#google; Ajustes › Calendários: desconectar e reconectar (consentimento de novo).
6. bubbly.app.br/privacidade#google e Meu perfil › Excluir minha conta, **sem concluir**.
