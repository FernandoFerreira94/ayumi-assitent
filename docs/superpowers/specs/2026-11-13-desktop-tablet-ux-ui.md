# Bubbly no tablet e no desktop: levantamento de UX/UI

Data: 2026-11-13 · Escopo: só front-end (o back-end fica como está) · Referência visual: canvas "Bubbly desktop — pranchas" (https://claude.ai/artifact/A6KGTMjLZNQ8TaD4inetou)

## 1. Resumo

Hoje o Bubbly é um app de celular esticado: tudo mora numa coluna de 520 px no meio da tela, a navegação é a barra de vidro no rodapé e toda tarefa abre numa folha que sobe de baixo. Num iPad ou num monitor isso deixa dois terços da tela vazios, esconde a navegação no avatar e faz cada formulário subir do rodapé de uma tela de 900 px de altura.

As pranchas já resolvem o desenho: menu lateral de 248 px no desktop, trilho de ícones de 76 px no iPad, conteúdo em duas colunas (principal + painel de contexto à direita) e calendário em semana. O trabalho é levar o app até lá sem mexer no celular, que continua exatamente como está.

## 2. Como o app está hoje (o que conferi no código)

| Ponto | Situação atual | Evidência |
|---|---|---|
| Largura | Tudo preso em `max-w-[520px]`, centralizado | `src/components/ui/PageShell.tsx:23` e os `loading.tsx` de vagas, serviços e clientes |
| Breakpoints | Nenhum. Zero classes `sm:`/`md:`/`lg:`/`xl:` em `src/`, e o CSS só tem media queries de movimento e transparência | busca em `src/` e `src/app/globals.css` |
| Navegação | Barra de vidro fixa no rodapé com 4 abas (Painel, Calendário, Financeiro, Clientes) e o + à parte. Serviços, Vagas, Pendências e Ajustes só pelo menu do avatar | `src/components/nav/TabBar.tsx`, `AppMenu.tsx` |
| Cabeçalho | Avatar à esquerda (menu "De cima"), título de 17 px centralizado, sino à direita; seta de voltar nas telas secundárias | `PageShell.tsx` |
| Folhas | 14 arquivos abrem folha de baixo (vaul `Drawer`), todas com `max-w-[520px]` e `bottom-0` | `NewAppointmentSheet`, `EditAppointmentSheet`, `ClientRow` (3 folhas), `ServicesCatalog`, `ChatSheet`, `ImportSheet`, `NewClientSheet`, `NewBlockSheet`, `NewExpenseSheet`, `MonthPicker`, `MascotPicker`, `InstallGuide`, `LetterPicker`, `AgendaDay` |
| Arrastar na agenda | Usa `onPointerDown`, então já funciona com mouse | `src/features/appointments/AgendaDay.tsx` |
| Hover | Praticamente não existe (2 ocorrências de `hover:`) | busca em `src/` |
| Teclado | Nenhum atalho global | busca por `keydown` |
| Tour | O passo da navegação aponta para `.tabbar` | `src/features/tour/steps.ts:41` |
| Testes e2e | Só o projeto "iphone-15" no Playwright | `playwright.config.ts` |
| Calendário | Dia, Mês e Ano com paginação por gesto; não tem Semana | `src/features/calendar/` |

## 3. O que as pranchas pedem

| Prancha | Tamanho | Estrutura |
|---|---|---|
| Painel desktop | 1440 × 900 | Menu lateral 248 px · conteúdo `1fr` + painel "Contexto do dia" 360 px |
| Painel iPad | 1024 × 768 | Trilho 76 px · conteúdo `1fr` + painel 272 px · alvos de 44 px |
| Calendário semana | 1440 × 900 | Grade `56px repeat(7,1fr)`, Dia/Semana/Mês, arrastar para remarcar, atalhos ← → e D/S/M |
| Clientes | 1440 | Lista `1fr` + ficha 420 px |
| Finanças | 1440 | 4 indicadores lado a lado · `1fr` + 380 px |
| Pendências | 1440 | `1fr` + 360 px |
| Ajustes | 1440 | Índice de seções 220 px + cartões em 2 colunas |
| Serviços | 1440 | Catálogo em 3 colunas + edição 400 px |
| Vagas | 1440 | Horários `1fr` + divulgar 400 px |
| Meu perfil | 1440 | 2 colunas, mascotes em grade de 4 |
| Splash, Login, Criar conta, Erro | 1440 | Tela cheia, sem menu |

O menu lateral tem, nesta ordem: Novo agendamento (atalho N), Painel, Calendário, Finanças, Clientes, separador, Serviços, Vagas, Pendências (com contagem), Ajustes, e no rodapé o salão com "Perfil e conta". O trilho do iPad tem os mesmos itens só com ícone. Em todas as pranchas a Bolha e o tom lavanda (`#6d4aff`) seguem iguais ao celular.

## 4. Faixas de tela propostas

| Faixa | Largura | Navegação | Conteúdo | Folhas |
|---|---|---|---|---|
| Celular | até 767 px | Barra de vidro no rodapé (como hoje) | Coluna de 520 px | Sobem de baixo (como hoje) |
| Tablet retrato | 768 a 1023 px | Trilho de ícones 76 px | Uma coluna até 720 px | Painel lateral à direita (440 px) |
| Tablet paisagem | 1024 a 1279 px | Trilho de ícones 76 px | Duas colunas (`1fr` + 272 px) | Painel lateral |
| Desktop | 1280 px ou mais | Menu lateral 248 px com nomes | Duas colunas (`1fr` + 360 px) | Painel lateral |

São os breakpoints padrão do Tailwind v4 (`md` 48rem, `lg` 64rem, `xl` 80rem), então não precisa configurar nada novo. iPad Air em paisagem (1180) fica com trilho; iPad Pro 12,9" em paisagem (1366) já ganha o menu completo.

## 5. Achados de UX/UI

Gravidade: **A** bloqueia o uso no tablet/desktop, **M** atrapalha, **B** acabamento.

### Navegação e cabeçalho
1. **A** · No desktop, metade das telas (Serviços, Vagas, Pendências, Ajustes) só aparece dentro do menu do avatar. O menu lateral deixa todas a um clique e mostra a contagem de pendências sem abrir nada.
2. **A** · A barra do rodapé fica flutuando no meio de um monitor de 1440 px, longe do conteúdo. Some a partir de 768 px e dá lugar ao trilho ou ao menu.
3. **M** · O título centralizado de 17 px some numa tela larga. No tablet/desktop vira título de 24 px alinhado à esquerda com a data embaixo, como nas pranchas.
4. **M** · A seta de voltar não faz sentido quando a tela já está no menu lateral. A partir de 768 px ela some; o item ativo do menu mostra onde a pessoa está.
5. **M** · O avatar que abre o menu "De cima" vira o rodapé do menu lateral (salão + "Perfil e conta"). O menu "De cima" continua só no celular.
6. **B** · No trilho os ícones precisam de nome acessível e de dica ao passar o mouse, porque o texto não aparece.

### Folhas, diálogos e formulários
7. **A** · As 14 folhas sobem de baixo numa tela de 900 px de altura e cobrem a tela inteira com o fundo escuro. A partir de 768 px elas viram painel lateral à direita (440 px, altura toda), que deixa a lista visível, como a ficha do cliente e a edição de serviço nas pranchas.
8. **M** · O "arraste para baixo para fechar" não existe com mouse. No painel lateral entram botão Fechar visível e Esc (o vaul já fecha com Esc).
9. **M** · A conversa (`ChatSheet`) com 85 % da altura fica estranha no monitor. Como painel lateral de altura toda, ela vira um chat de verdade ao lado da agenda.
10. **B** · O seletor de letras (`LetterPicker`) e o de mês (`MonthPicker`) foram feitos para o polegar. No desktop podem continuar como painel lateral; não precisam de outro desenho agora.

### Interação com mouse e teclado
11. **M** · Não há estado de passar o mouse em linhas, cartões e botões. Sem isso o desktop parece "morto". Entra só quando o aparelho tem mouse (`@media (hover: hover)`), para não grudar no toque.
12. **M** · Atalhos das pranchas: N (novo agendamento), / (buscar), ← → (dia ou semana), T (hoje), D/S/M (visão do calendário). Ignorados quando o foco está num campo de texto.
13. **B** · Arrastar com mouse já funciona; falta cursor `grab`/`grabbing` e dica "arraste para remarcar" visível só no desktop.
14. **B** · Rolagem: com o menu lateral fixo, só o conteúdo rola. A faixa de 36 px de folga para a barra do rodapé (`pb-36`) vira 40 px normais.

### Tela a tela
15. **A · Painel**: duas colunas. Esquerda: faixa da semana e linha do tempo do dia. Direita ("Contexto do dia"): balão da Bolha e, depois, Previsão de ganho, Próximos e Pendências do dia.
16. **A · Calendário**: a visão Semana (prancha "Calendário · visão semana") é a que mais ganha com tela larga. É recurso novo no front e merece plano próprio.
17. **M · Clientes**: lista à esquerda, ficha à direita sem sair da lista (hoje a ficha é folha). Com o item 7 a ficha já abre ao lado; a coluna fixa de 420 px fica para depois.
18. **M · Finanças**: os 4 indicadores lado a lado e a rosca + despesas na coluna de 380 px.
19. **M · Serviços**: catálogo em grade de 3 colunas; editar abre no painel lateral.
20. **M · Vagas**: horários livres à esquerda; "Copiar texto para divulgar" na coluna de 400 px.
21. **M · Pendências**: lista `1fr` + resumo 360 px.
22. **M · Ajustes**: índice de seções fixo de 220 px à esquerda e cartões em 2 colunas.
23. **B · Meu perfil**: 2 colunas; mascotes em grade de 4.
24. **B · Login e Splash**: hoje o formulário de 520 px fica sozinho no meio. Nas pranchas a Bolha ganha metade da tela e o formulário a outra.

### Estados, acessibilidade e PWA
25. **M** · Os `loading.tsx` repetem a classe da coluna de 520 px. Precisam seguir a mesma largura da tela pronta, senão a tela "pula" ao carregar.
26. **M** · Alvos de toque de 44 px no tablet (prancha do iPad), mesmo com menu de ícones.
27. **M** · Foco visível em todos os itens do menu e do trilho, `aria-current="page"` no item ativo.
28. **B** · iPad instalado como app: respeitar `safe-area-inset-left/right` no trilho em paisagem.
29. **B** · O tour precisa apontar para o menu lateral quando a barra do rodapé está escondida.
30. **B** · Os testes e2e só rodam em iPhone 15. Entram dois projetos: iPad paisagem (1024 × 768) e desktop (1440 × 900).

## 6. Como construir: 3 caminhos

1. **Recomendado · Uma árvore só, responsiva por CSS.** Menu lateral e barra do rodapé ficam os dois na página e o CSS mostra um ou outro; as folhas trocam de lado com um único hook de largura. Ganha: celular intacto, sem duplicar telas, sem pulo na hidratação. Perde: cada tela precisa de uma passada de grade.
2. **Layout separado para desktop, escolhido no servidor pelo aparelho.** Ganha: liberdade total no desktop. Perde: duplica telas e erra no iPad, que se apresenta como Mac.
3. **Só alargar a coluna e centralizar os diálogos.** Ganha: pronto em um dia. Perde: não chega perto das pranchas e o desktop continua sem navegação.

Sigo com o caminho 1.

## 7. Fases

- **Fase 1 · Casca (plano `docs/superpowers/plans/2026-11-13-desktop-tablet-shell.md`)**: faixas de tela, menu lateral e trilho, cabeçalho, folhas que viram painel lateral, hover, atalhos, tour e e2e em iPad/desktop. Depois dela o app inteiro já funciona bem no tablet e no desktop, numa coluna de até 720 px.
- **Fase 2 · Telas em duas colunas (mesmo plano)**: Painel, Finanças, Pendências, Vagas, Ajustes, Meu perfil e Clientes. Serviços ganha o painel lateral de edição já na Fase 1.
- **Fase 3 · Recursos novos de tela larga (planos próprios)**: visão Semana do calendário, cartões Previsão de ganho / Próximos / Pendências do dia no painel, ficha fixa de cliente, catálogo de Serviços em 3 colunas e Login/Splash em duas metades.

## 8. Decisões para o Fernando

1. Faixas de tela da seção 4 (trilho de 768 a 1279, menu completo a partir de 1280).
2. Visão Semana só a partir de 1024 px, ou também no tablet retrato.
3. Previsão de ganho no painel: os números saem dos agendamentos do dia que já existem (soma do previsto e do recebido), sem tocar no back-end?
