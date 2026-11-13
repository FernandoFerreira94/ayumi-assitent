# Dashboards e visualização de dados

Dashboard responde perguntas. Se ninguém sabe qual pergunta um gráfico responde, ele sai.

## Estrutura do dashboard
- [ ] Defina as 3–5 perguntas que o usuário faz toda manhã ("Vendi mais que ontem?", "O que está atrasado?"). Cada bloco responde uma.
- [ ] Ordem: KPIs no topo (o estado), um gráfico principal (a tendência), lista "precisa de atenção" (a ação).
- [ ] Tudo que importa cabe na primeira tela no desktop (1280×800). Detalhe fica a um clique.
- [ ] Período global único (Hoje, 7d, 30d, Mês, Personalizado) no topo, refletido na URL, aplicado a tudo.
- [ ] Dashboards diferentes por papel (dono vê receita, operador vê fila), não um dashboard com tudo.

## KPI (stat card)
- [ ] Rótulo curto, valor grande com `tabular-nums`, variação vs período anterior com seta e sinal (+12,4%) e o período comparado no texto ("vs semana passada").
- [ ] Cor da variação segue o significado, não o sinal: custo subindo é ruim. Sempre com seta/sinal além da cor.
- [ ] Sparkline opcional, sem eixos, só para tendência.
- [ ] Número abreviado com precisão útil (R$ 1,2 mi), valor exato no tooltip.
- [ ] Clicar no KPI leva à lista filtrada que o compõe.

## Escolha do gráfico
| Pergunta | Gráfico |
| --- | --- |
| Como evoluiu no tempo? | Linha (contínuo) ou colunas (períodos discretos) |
| Qual é maior? | Barras horizontais ordenadas |
| Qual a composição? | Barra empilhada 100% ou treemap. Pizza só com 2–3 fatias |
| Como se distribui? | Histograma ou box plot |
| Há relação entre A e B? | Dispersão |
| Onde está o gargalo? | Funil (barras decrescentes com taxa entre etapas) |
| Está dentro da meta? | Barra com marcador de meta (bullet chart) |
- [ ] Nada de 3D, gauge decorativo, donut com 9 fatias ou dois eixos Y sem necessidade.

## Desenho do gráfico
- [ ] Eixo Y de barras começa no zero. Linhas podem não começar, se o eixo deixa isso claro.
- [ ] Grade horizontal leve (`border`), sem grade vertical. Rótulos de eixo em `fg-muted`, pt-BR (jan, fev; R$ 10 mil).
- [ ] Rótulo direto na série em vez de legenda quando há até 4 séries. Legenda, quando existir, na ordem das séries.
- [ ] Destaque a série que importa no `accent` e deixe as outras em neutro (`fg-muted`, tracejado). Paleta categórica (até 5–6 cores) só com tokens validados para daltonismo; os `--chart-*` atuais do bridge vêm dos gradientes do tema e não servem como paleta categórica.
- [ ] Escala sequencial (magnitude) é um tom só, do neutro ao acento: `color-mix(in oklab, var(--wc-accent) N%, var(--wc-surface))` em 5 degraus, o que já funciona no escuro.
- [ ] Um eixo Y só. Nunca dois eixos com escalas diferentes.
- [ ] Tooltip com valor exato, data completa e comparação; segue o cursor no eixo X (crosshair) em séries temporais.
- [ ] Estados: carregando (skeleton do formato do gráfico), sem dados no período ("Sem vendas entre 01/10 e 07/10"), erro com tentar de novo.

## Tempo real
- [ ] Mostre "Atualizado há 30 s" e um indicador ao vivo discreto. Atualizações não movem o layout nem roubam o foco.
- [ ] Números que mudam com transição curta (contagem ou crossfade), nunca piscando a tela inteira.
- [ ] Alertas críticos destacados na lista de atenção, não só por cor no gráfico.

## Acessibilidade
- [ ] Cada gráfico tem título que diz a conclusão ("Vendas cresceram 18% em outubro") ou ao menos o que mede, e uma tabela ou resumo acessível alternativo.
- [ ] Séries diferenciadas por cor **e** forma (traço, marcador, padrão). Contraste 3:1 entre série e fundo.
- [ ] Tooltip acessível por teclado (foco nos pontos ou navegação por setas) ou dados disponíveis em tabela.

## Padrões com demo
- `kpi-stat-card`, `line-chart-crosshair`, `bar-ranking`, `bullet-goal`, `conversion-funnel`, `calendar-heatmap`.

## Fontes
- Stephen Few, Information Dashboard Design (livro) e Perceptual Edge: https://www.perceptualedge.com/
- NN/g, Dashboards: https://www.nngroup.com/articles/dashboards-preattentive/
- IBM Carbon, Data visualization: https://carbondesignsystem.com/data-visualization/getting-started/
- Financial Times Visual Vocabulary: https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- shadcn/ui Charts (Recharts): https://ui.shadcn.com/charts
