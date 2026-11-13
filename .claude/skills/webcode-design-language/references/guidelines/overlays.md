# Overlays: dialog, alert, sheet, drawer, popover, tooltip, toast

Overlay interrompe. Use o menor que resolve: tooltip < popover < toast < sheet não modal < sheet modal < dialog < alert dialog.

## Qual usar
| Situação | Componente | Modal? |
| --- | --- | --- |
| Explicar um ícone ou atalho | Tooltip | não |
| Escolha rápida ancorada no gatilho (filtro, data, cor, menu) | Popover / Dropdown | não |
| Confirmar que algo aconteceu, oferecer desfazer | Toast | não |
| Ver ou editar detalhe sem perder a lista (desktop) | Sheet lateral | opcional |
| Ações e detalhes contextuais no mobile | Bottom sheet / Drawer | sim |
| Tarefa curta e focada (criar item simples, renomear, compartilhar) | Dialog | sim |
| Decisão irreversível ou de alto custo | Alert dialog | sim |
| Tarefa longa, com rolagem ou várias etapas | Página própria | — |

## Dialog
- [ ] Uma tarefa, um título que diz qual ("Convidar pessoas"), ação primária que completa a tarefa.
- [ ] Tamanho pelo conteúdo (`size` sm/md/lg/xl do `@webcode/dialog`); corpo rola com cabeçalho e rodapé fixos.
- [ ] Fecha com Esc, botão ✕ e clique no scrim, **exceto** quando há dados digitados: aí pede confirmação ou não fecha no clique fora.
- [ ] Foco inicial no primeiro campo; sem campo, na ação menos destrutiva. Foco volta ao gatilho ao fechar.
- [ ] No mobile (< 640px) vira bottom sheet ou tela cheia; nunca um dialog central espremido.
- [ ] Nunca dialog sobre dialog. Se precisa de um segundo nível, o primeiro vira página ou sheet.
- [ ] Abrir por rota (`?dialog=convite`) quando deve ser compartilhável ou sobreviver ao F5.

## Alert dialog (confirmação)
- [ ] Use só para o que é irreversível, caro ou afeta outras pessoas. Para o resto, faça a ação e ofereça desfazer.
- [ ] Título é a pergunta com o objeto: "Excluir o projeto Site 2026?". Corpo diz a consequência concreta ("12 páginas e 3 integrações serão removidas. Não dá para desfazer.").
- [ ] Botões com verbos que respondem ao título ("Excluir projeto" / "Cancelar"). Nunca "Sim/Não" ou "OK".
- [ ] Ação destrutiva em `danger-solid`; foco inicial no **Cancelar**.
- [ ] Não fecha no clique fora (`role="alertdialog"` exige escolha). Esc = Cancelar.
- [ ] Para destruição em massa ou de alto valor, peça para digitar o nome do recurso. Use com moderação: atrito vira hábito e o usuário passa a digitar sem ler.
- [ ] Ordem dos botões consistente no produto inteiro (WebCode: cancelar à esquerda, ação à direita, como Apple e shadcn).

## Sheet lateral (desktop)
- [ ] Ideal para detalhe/edição a partir de uma lista: a lista continua visível e o contexto não se perde.
- [ ] Largura 400–640px; em telas largas pode ser não modal (sem scrim), permitindo trocar de linha com o sheet aberto.
- [ ] Abre da direita (conteúdo) ou da esquerda (navegação no mobile). Mola `smooth` na entrada, ease-in curta na saída.
- [ ] Item aberto refletido na URL; setas ↑↓ ou J/K para ir ao próximo registro é um bônus de produtividade.

## Bottom sheet / Drawer (mobile)
- [ ] Alça visível, arrastar para baixo fecha; também fecha com botão e Esc (WCAG 2.5.7: arrastar nunca é o único caminho).
- [ ] Detents (meia altura e altura cheia) quando o conteúdo cresce; o conteúdo rola por dentro só na altura máxima.
- [ ] Respeita `safe-area-inset-bottom` e o teclado virtual (campos não ficam atrás do teclado).
- [ ] Fundo atrás recua levemente (escala .96 e cantos arredondados) só no tema Aurora; nos outros, só scrim.
- [ ] Nada de sheet sobre sheet.

## Popover e dropdown
- [ ] Ancorado ao gatilho, abre do lado com mais espaço, com `transform-origin` no gatilho e escala de .96 → 1 em `fast`.
- [ ] Fecha com Esc, clique fora e ao rolar para longe; não prende o foco (não é modal), mas o foco entra nele ao abrir por teclado.
- [ ] Conteúdo curto. Se tem formulário com mais de 3 campos, é dialog ou sheet.
- [ ] Web nativa: `popover` + `popovertarget` + CSS anchor positioning resolvem a maioria dos casos sem JS.

## Tooltip
- [ ] Só texto curto e complementar; nunca informação essencial nem conteúdo interativo (vira popover).
- [ ] Aparece no hover com atraso (~500ms na primeira vez, instantâneo nas seguintes) e no foco do teclado. Some com Esc.
- [ ] Não existe no toque: o que está em tooltip precisa estar acessível de outro jeito no mobile.

## Toast
- [ ] Confirma resultado ("Fatura enviada") e oferece uma ação curta (Desfazer, Ver). Uma linha, no máximo duas.
- [ ] 4–6s por padrão; com ação, 6–8s; pausa no hover/foco. Erro que exige ação não é toast: fica na tela.
- [ ] Empilha no máximo 3 visíveis; os novos empurram os antigos (padrão `toast-stack` / Sonner).
- [ ] `role="status"` (polido). Posição fixa no produto inteiro (WebCode: embaixo ao centro, padrão do `@webcode/sonner`; com tab bar no celular, suba o `offset` para não cobri-la).
- [ ] Não cobre o foco atual (WCAG 2.4.11) nem a ação primária.
- [ ] Assíncrono = um toast só: `toast.promise` (ou o mesmo `id`) troca carregando → sucesso/erro no lugar; o tempo de fechar só começa ao concluir. Erro de ação não fecha sozinho e também aparece na tela.
- [ ] Pilha recolhida (escala −0,05 por nível) que expande no hover e no foco; pausa também com a aba oculta.
- [ ] Região alcançável por teclado (Sonner: Alt+T) e com rótulo pt-BR ("Notificações").
- [ ] Toast nunca é o único registro: o resultado também está na tela ou num histórico (Primer e WCAG 2.2.1 desaconselham toast como único aviso).

## Movimento dos overlays
| Overlay | Entrada | Saída |
| --- | --- | --- |
| Tooltip | fade + escala .97, `fast`; atraso só no primeiro, os vizinhos abrem sem animação | fade `instant` |
| Popover/dropdown | escala .96 → 1 + fade + 4px do lado do gatilho, `fast`, da origem do gatilho | só fade `instant`; item escolhido pisca antes de fechar |
| Dialog | escala .96 → 1 + fade, `base`, ease-out, origem no centro | escala .98 + fade, `fast` (o painel some antes do scrim) |
| Alert dialog | igual ao dialog, sem bounce | igual ao dialog |
| Sheet / drawer | translate 100% → 0 com spring `smooth` | translate, `fast`, ease-in |
| Scrim | fade `base` | fade `fast`, termina depois do painel |
| Toast | sobe 100% + fade, `base`–360ms | sai pelo lado de onde veio; arrastar fecha a partir de ~45px ou por velocidade |
| Troca de estado no toast (promise) | crossfade + `blur(2px)`, `fast`; a altura anima | — |

Valores cruzados de Emil Kowalski, NN/g, Atlassian, Base UI, código do Sonner 2 e shadcn v4 (pesquisa em `docs/pesquisa/` do repo webcode-design). Em aberto (ADR): curva de saída (ease-in suave × ease-out curto) e duração do sheet (360ms × 500ms do shadcn).
- [ ] Animações interrompíveis (transições, não keyframes, quando o usuário pode fechar no meio).
- [ ] Reduced motion: só fade.
- [ ] Web nativa: `<dialog>` com `showModal()`, `@starting-style` e `transition-behavior: allow-discrete` animam abertura e fechamento sem biblioteca; `closedby="any"` fecha no clique fora, mas ainda não é Baseline (2026): mantenha o fallback em JS.

## Fontes
- Apple HIG, Sheets, Alerts, Popovers e Modality: https://developer.apple.com/design/human-interface-guidelines/sheets · https://developer.apple.com/design/human-interface-guidelines/alerts · https://developer.apple.com/design/human-interface-guidelines/popovers · https://developer.apple.com/design/human-interface-guidelines/modality
- Material 3, Dialogs, Bottom sheets e Side sheets: https://m3.material.io/components/dialogs/overview · https://m3.material.io/components/bottom-sheets/overview · https://m3.material.io/components/side-sheets/overview
- WAI-ARIA APG, Dialog (Modal) e Alert Dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ · https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
- NN/g, Modal & Nonmodal Dialogs e Confirmation Dialogs: https://www.nngroup.com/articles/modal-nonmodal-dialog/ · https://www.nngroup.com/articles/confirmation-dialog/
- Radix UI, Dialog e Alert Dialog: https://www.radix-ui.com/primitives/docs/components/dialog · https://www.radix-ui.com/primitives/docs/components/alert-dialog
- shadcn/ui, Drawer e padrão "responsive dialog" (Dialog no desktop, Drawer no mobile): https://ui.shadcn.com/docs/components/drawer
- Vaul (Emil Kowalski): o autor declarou o projeto sem manutenção; não adote como dependência nova. Repositório: https://github.com/emilkowalski/vaul
- Sonner: https://sonner.emilkowal.ski/
- MDN, `<dialog>` e Popover API: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog · https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
