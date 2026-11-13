---
id: central-ajuda
title: Central de ajuda e suporte
summary: Busca grande primeiro, categorias e perguntas frequentes em acordeão, e saída clara para falar com alguém ou abrir chamado.
intent: [ajuda, faq, suporte, abrir chamado, base de conhecimento, fale conosco]
group: comunicacao
platform: ambos
products: [saas, helpdesk, ecommerce, fintech, mobile-app]
components: [input-group, highlight, card, accordion, button, sheet, field, textarea, file-upload, chat, sonner, empty]
patterns: [faq-accordion, search-header]
status: stable
---
## Quando usar
Autoatendimento antes do humano. Conversa com assistente de IA: `chat-ia`. Fila do atendente: `lista-com-detalhe`.

## Estrutura
```
topo: título curto "Como podemos ajudar?" + input-group de busca grande (resultados com highlight do termo)
grade de card por categoria (ícone · nome · nº de artigos)
accordion "Perguntas frequentes" (6–8, as mais buscadas)
card final "Ainda precisa de ajuda?" → Conversar (chat) · Abrir chamado (sheet) · horário de atendimento
sheet Abrir chamado: assunto (select) · descrição (textarea) · anexos (file-upload) · Enviar
```

## Comandos perto do contexto
- Busca no topo, sempre; artigo termina com "Isso ajudou? Sim / Não" na própria página.
- Contato no fim da página e no fim de cada artigo, não flutuando por cima do conteúdo.
- Enviar chamado no rodapé do `sheet`, com número do protocolo no toast.

## Material e movimento
Página leve: cards `flat`, acordeão com a altura animada do tema. Resultado da busca aparece abaixo do campo sem modal. Chat abre em `sheet` lateral (web) ou tela cheia (mobile).

## Estados
Busca sem resultado: `empty` "Nada sobre 'boleto vencido'" + "Abrir chamado" já com o termo no assunto. Fora do horário: dizer quando volta. Chamado enviado: `sonner` "Chamado #4821 aberto · resposta em até 1 dia útil".

## Evitar
Esconder o contato atrás de 3 cliques; FAQ de 40 perguntas; chat que abre sozinho; formulário de chamado pedindo dados que a conta já tem.

## Variações
- Mobile iOS: `search-bar` + `list-group` de categorias, artigo em tela empilhada.
- Dentro do produto: `sheet` "Ajuda" com busca e artigos do contexto da página atual.
- Status do serviço: `alert` no topo quando houver incidente.

## Esqueleto
```tsx
<InputGroup className="h-(--wc-density-control-lg)">…</InputGroup>
<div className="grid gap-3 sm:grid-cols-3"><Card variant="flat">…</Card></div>
<Accordion type="single" collapsible><AccordionItem value="pix"><AccordionTrigger>Como pagar com Pix?</AccordionTrigger>
  <AccordionContent>…</AccordionContent></AccordionItem></Accordion>
<Sheet><SheetContent side="right"><Field><FieldLabel>Descrição</FieldLabel><Textarea/></Field><FileUpload/>
  <SheetFooter><Button>Enviar chamado</Button></SheetFooter></SheetContent></Sheet>
```
