---
id: chat-ia
title: Conversa com IA ou suporte
summary: Conversa que gruda no fim, prompt com Parar e sugestões, respostas com copiar e código; painel lateral quando é assistente.
intent: [chat, assistente, ia, copiloto, conversa, suporte, atendimento, mensagens]
group: comunicacao
platform: ambos
products: [ai-app, helpdesk, crm, saas, devtools]
components: [chat, code-block, copy-button, mentions, sheet, empty, skeleton]
patterns: [ai-prompt-composer, ai-streaming-response]
status: stable
---
## Quando usar
Tela principal de um app de IA ou suporte; ou assistente dentro do produto (em `sheet` lateral).

## Estrutura
```
chat Conversation (gruda no fim) > Message por turno
   resposta: texto + code-block (copiar) + MessageActions (copiar, refazer, 👍)
   pessoa: bolha à direita
Suggestions (estado vazio) → PromptInput com anexo, Enviar ↔ Parar
assistente embutido: sheet right com a mesma conversa
```

## Comandos perto do contexto
- Copiar/refazer na própria mensagem, revelado no hover e visível no toque.
- Parar no lugar do Enviar enquanto responde.
- Citar pessoa/item com @ (`mentions`) no prompt.

## Material e movimento
Respostas sem bolha (texto largo, legível); bolha só na fala da pessoa. Streaming sem cursor piscando infinito; rolagem segue o fim só se a pessoa já estava no fim.

## Estados
Vazio: `empty` curto + 3 sugestões úteis. Pensando: TypingIndicator. Erro: mensagem com "Tentar de novo". Histórico carregando: `skeleton` de 3 turnos.

## Evitar
Puxar para o fim enquanto a pessoa lê acima; sugestões genéricas; código sem copiar; resposta da IA sem Parar.

## Variações
- Atendimento humano: `avatar` + nome do atendente e status "digitando".
- Copiloto dentro da tela: `sheet` estreito com ações que aplicam no conteúdo ao lado.
- Mobile: prompt fixo acima do teclado com `keyboard-toolbar`.

## Esqueleto
```tsx
<Conversation>
  <Message from="user"><MessageContent/></Message>
  <Message from="assistant"><MessageContent>…<CodeBlock/></MessageContent>
    <MessageActions><CopyButton/></MessageActions></Message>
</Conversation>
<Suggestions><Suggestion/></Suggestions>
<PromptInput/>
// Assistente: <Sheet><SheetContent side="right">…</SheetContent></Sheet>
```
