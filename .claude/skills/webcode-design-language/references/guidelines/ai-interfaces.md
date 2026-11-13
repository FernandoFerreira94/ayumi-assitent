# Interfaces com IA

IA erra, demora e é imprevisível. A interface existe para dar ao usuário controle, contexto e confiança.

## Entrada
- [ ] Campo de prompt com exemplos clicáveis no estado vazio ("Resuma as vendas de outubro"), não uma caixa em branco.
- [ ] Anexos (arquivo, imagem, link) visíveis como chips removíveis antes de enviar.
- [ ] Enter envia, Shift+Enter quebra linha; no mobile, botão de enviar explícito.
- [ ] Quando a IA atua sobre dados do usuário, mostre o escopo ("Usando: Pedidos de outubro, 312 registros").

## Resposta e streaming
- [ ] Primeiro sinal em até 1s (indicador "pensando" com etapa real quando houver: "Lendo 3 arquivos…").
- [ ] Texto chega em streaming sem pular o layout; a rolagem só acompanha se o usuário estiver no fim.
- [ ] Botão Parar sempre disponível durante a geração. Regenerar e editar o prompt depois.
- [ ] Conteúdo estruturado (tabela, código, lista) renderizado de verdade, com copiar por bloco (`copy-feedback`).
- [ ] Fontes e citações clicáveis quando a resposta vem de documentos ou da web.

## Ações (agentes)
- [ ] Antes de agir fora da conversa (enviar e-mail, alterar registro, cobrar), mostre a prévia do que vai acontecer e peça confirmação. Ação reversível pode ser automática com desfazer.
- [ ] Cada passo executado aparece em uma linha do tempo legível (o que fez, em quê, resultado), recolhível.
- [ ] Permissões explícitas e revogáveis ("Pode editar pedidos? Sempre / Só desta vez / Não").
- [ ] Erro de ferramenta explicado em linguagem humana, com opção de tentar de novo ou fazer manualmente.

## Confiança
- [ ] Deixe claro o que foi gerado por IA (rótulo discreto, não alarmista).
- [ ] Indique incerteza quando houver ("Não encontrei o CNPJ; confira").
- [ ] Feedback por resposta (útil/não útil) leve, sem interromper.
- [ ] Dados sensíveis: diga o que é enviado ao modelo e o que fica armazenado (LGPD).

## Visual
- [ ] Mensagens do usuário e da IA diferenciadas por alinhamento ou superfície, não por avatar grande.
- [ ] Largura de leitura limitada (~70ch) mesmo em telas largas.
- [ ] Animação de streaming sutil (cursor ou fade por palavra), nunca efeito de "digitação" artificial lento.
- [ ] Tema Aurora combina com produtos de IA consumer; Clean SaaS quando a IA é uma função dentro do app.

## Padrões com demo
- `ai-prompt-composer` (entrada), `ai-streaming-response` (resposta e parar), `ai-agent-steps` (linha do tempo), `ai-action-approval` (aprovação).

## Fontes
- Google PAIR, People + AI Guidebook: https://pair.withgoogle.com/guidebook/
- Microsoft, Guidelines for Human-AI Interaction: https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/
- Apple HIG, Generative AI: https://developer.apple.com/design/human-interface-guidelines/generative-ai
- NN/g, AI & UX articles: https://www.nngroup.com/topic/ai/
- shape of AI (catálogo de padrões de UX para IA): https://www.shapeof.ai/
