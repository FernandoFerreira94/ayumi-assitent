---
id: primeiro-acesso
title: Primeiro acesso e novidades
summary: Estado vazio que ensina pela primeira ação, checklist de ativação e tour curto opcional; novidades uma vez por versão.
intent: [onboarding, primeiro acesso, boas-vindas, tour, checklist de ativação, novidades, whats new, conta nova]
group: conta
platform: ambos
products: [saas, mobile-app, ai-app, edtech, fintech]
components: [empty, button, card, progress, item, checkbox, tour, whats-new, popover, lens-reveal]
patterns: [product-tour, empty-state]
status: stable
---
## Quando usar
Conta nova até a ação-chave ("aha"), e na volta depois de atualização grande.

## Estrutura
```
tela principal vazia: empty com a 1ª ação ("Importar clientes") + link "Ver exemplo"
card "Comece por aqui" (fechável): progress 2/4 + item por passo com checkbox (só leitura) e botão
tour (opcional, ≤5 passos) iniciado pelo card ou pelo menu Ajuda
atualização: whats-new (mobile) ou popover âncora no recurso novo (web), uma vez por versão
```

## Comandos perto do contexto
- Cada passo do checklist com o botão que o faz ali mesmo.
- Ajuda e "Refazer tour" no menu de Ajuda, não fixos na tela.

## Material e movimento
Checklist em card discreto, sem confete. Passo concluído marca ✓ com transição curta. Tour com spotlight do tema; movimento reduzido sem deslize.

## Estados
Passo feito em outro lugar marca sozinho. Card some ao completar tudo (com "Concluído" por 1 visita). Usuário pulou: nunca reabrir sozinho.

## Evitar
Tour obrigatório de 10 passos; carrossel de boas-vindas antes do produto; explicar o óbvio; checklist que não sai.

## Variações
- Mobile: páginas com `page-control` só quando há permissão a pedir (pre-permission).
- Conta empresa: checklist com "Cadastrar CNPJ", "Convidar equipe", "Conectar banco".
- Novidade de recurso: `popover` ancorado uma vez, nunca tour inteiro.
- Abertura de marca antes do login: `lens-reveal` (puxar a cúpula revela o login; toque e Enter também), só na 1ª abertura.

## Esqueleto
```tsx
<Empty><EmptyHeader><EmptyTitle>Importe seus clientes</EmptyTitle><EmptyDescription/></EmptyHeader>
  <EmptyContent><Button>Importar planilha</Button><Button variant="link">Ver exemplo</Button></EmptyContent></Empty>
<Card><CardHeader><CardTitle>Comece por aqui</CardTitle><Progress value={50}/></CardHeader>
  <CardContent><Item size="sm"><Checkbox checked disabled/><ItemContent/><ItemActions><Button size="sm"/></ItemActions></Item></CardContent></Card>
<TourProvider id="onboarding" version={1} steps={steps}/>
// Mobile: <WhatsNew/>
```
