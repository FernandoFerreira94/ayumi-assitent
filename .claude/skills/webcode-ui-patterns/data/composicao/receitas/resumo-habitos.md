---
id: resumo-habitos
title: Resumo do dia (hábitos e saúde)
summary: Semana no topo, anéis de meta do dia, colunas da semana e lista do que falta fazer com marcação em um toque.
intent: [hábitos, saúde, metas do dia, resumo diário, bem-estar, treino, rotina, app de hábitos]
group: app
platform: mobile
products: [habits, health, mobile-app, edtech]
components: [navigation-bar, week-strip, activity-ring, progress-columns, list-group, checkbox, fab, card, sonner]
patterns: []
status: stable
---
## Quando usar
Tela inicial de app de rotina: "como foi hoje" e "o que falta". Painel de gestão: `painel-kpis`.

## Estrutura
```
navigation-bar large "Hoje" · week-strip (dias com registro marcados)
card: activity-ring (até 3 metas) + legenda com valores
card: progress-columns da semana
list-group inset "Falta hoje": linha com checkbox (marca em 1 toque) + horário
fab "+" para registrar
```

## Comandos perto do contexto
- Marcar o hábito na própria linha; desfazer pelo `sonner`.
- Registrar algo novo no `fab`, que recolhe ao rolar.
- Trocar o dia pela `week-strip`, sem sair da tela.

## Material e movimento
Anéis e colunas enchem uma vez ao abrir (parados no movimento reduzido). Marcar dá mola curta no check. Cores das metas pelos tokens de gráfico; legenda em texto.

## Estados
Dia sem registro: anéis vazios + "Nada registrado ainda". Meta batida: ✓ no anel + texto, sem confete. Dia futuro: só leitura.

## Evitar
Mais de 3 anéis; meta só por cor; streak que pune ("Você perdeu!"); `fab` e `bottom-bar` juntos.

## Variações
- Medicação/tratamento: horários do dia em `list-group` com check e lembrete.
- Treino: `progress-columns` por grupo muscular e sequência de dias.
- Web: anéis em `card` no topo e lista ao lado (2 colunas).

## Esqueleto
```tsx
<NavigationBar large title="Hoje"><WeekStrip/></NavigationBar>
<Card className="p-4"><ActivityRing rings={rings} label="Metas de hoje"/></Card>
<Card className="p-4"><ProgressColumns items={week} label="Semana"/></Card>
<ListGroup variant="inset" title="Falta hoje"><ListRow title="Beber água" detail="15h" accessory={<Checkbox/>}/></ListGroup>
<Fab label="Registrar"/>
```
