---
id: edtech
title: EdTech, LMS e curso online
family: Serviços e verticais
summary: Plataforma de cursos ou área de membros. O aluno precisa saber onde parou, quanto falta e qual é a próxima aula.
kpi: Taxa de conclusão do curso e alunos ativos por semana
themes: [aurora, clean-saas, playful]
patterns: [ios-tab-bar, skeleton-shimmer, toast-stack, empty-state, list-enter-exit, press-spring-button, top-progress-bar, bottom-sheet, splash-logo-reveal, url-tabs, progress-stepper, bullet-goal, conversion-funnel, product-tour, hide-on-scroll-header, drilldown-drawer-menu, priority-plus-nav, login-split-screen, auth-sliding-panels, password-recovery-flow, footer-newsletter, pricing-tiers, testimonial-wall, kanban-board]
density: comfortable
radius: 12
components: [button, card, progress, accordion, tabs, sheet, drawer, dialog, badge, avatar, sonner, skeleton, textarea, radio-group, checkbox, scroll-area, tour]
status: stable
---

## Objetivo
Levar o aluno da compra à conclusão: continuar de onde parou em um toque e sentir progresso a cada sessão.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Início do aluno | "Continuar assistindo" com miniatura e tempo restante, cursos em andamento com progresso | skeleton-shimmer |
| Curso | módulos em acordeão com aulas, duração, concluídas marcadas, próxima aula destacada | list-enter-exit |
| Aula | player, marcar como concluída, materiais, transcrição, comentários, próxima aula | press-spring-button |
| Quiz / atividade | uma pergunta por vez no mobile, feedback imediato com explicação | toast-stack |
| Certificado | emitido automaticamente, compartilhar, validar por código | — |

## Regras
- Progresso em % e em tempo ("faltam 2h40"), por módulo e por curso.
- Player lembra a posição, velocidade e legenda; aula seguinte começa com contagem cancelável.
- Conclusão marcada automaticamente perto do fim do vídeo, com opção de desmarcar.
- Legenda e transcrição em todas as aulas (WCAG e busca dentro do conteúdo).
- Comunidade/comentários por aula, não num fórum separado.
- Uso no celular é o principal: aula offline quando possível.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, trilha, próxima aula e progresso, terminando em "Comece pela aula 1". Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Aurora para cursos e infoprodutos; Clean SaaS para LMS corporativo.
- **Densidade:** confortável.
- **Componentes-chave:** Progress, Accordion de módulos, Tabs na aula (Materiais, Transcrição, Comentários), Drawer de índice no mobile.

## Estados críticos
- Acesso expirado: data e como renovar, sem perder progresso.
- Aula bloqueada (liberação por data/drip): quando libera.
- Primeiro acesso: onboarding curto com o primeiro passo ("Comece pela aula 1").

## Anti-padrões
- Lista plana com 200 aulas.
- Gamificação que pontua tempo de tela, não aprendizado.
- Player sem atalhos de teclado.

## Referências
- Understanding WCAG 1.2.2 (legendas): https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html
- Apple HIG, Playing video: https://developer.apple.com/design/human-interface-guidelines/playing-video
