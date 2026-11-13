---
id: progresso-e-espera
title: Progresso e espera que dizem quanto falta
summary: Resumo de progresso com anel e o próximo passo no lugar de porcentagem solta; espera longa com contagem, barra e tempo restante no lugar de spinner.
intent: [progresso, tarefas concluídas, quanto falta, carregando, upload em lote, importação, tempo restante, espera longa, spinner]
group: app
platform: ambos
products: [saas, mobile-app, habits, edtech, ai-app]
components: [progress, spinner, skeleton, file-upload, card, button, sonner]
patterns: []
status: beta
---
## Quando usar
Lista de tarefas, metas e qualquer espera acima de ~3 s (envio, importação, IA gerando). Abaixo de 1 s não mostre nada; até ~3 s, `spinner` ou `skeleton`.

## Estrutura
```
resumo (card): ProgressCircle (anel com "20%") + "1 de 5 feitas" + linha: "4 para hoje, próxima às 16:00"
espera longa (card): "Enviando 3 de 8" · progress (barra pelos bytes/itens) · "Cerca de 20 s restantes" · Cancelar
fim: sonner "8 arquivos enviados" com a ação seguinte (Ver arquivos)
```

## Comandos perto do contexto
- Cancelar no próprio card da espera; Tentar de novo na linha que falhou.
- No resumo, tocar no anel abre a lista do que falta (filtro Hoje).

## Material e movimento
Anel e barra só com `stroke-dashoffset`/largura na curva do tema; sem pulso infinito. Número com `tabular-nums` para não tremer. Tempo restante de `@webcode/eta` (suavizado, arredondado: "Cerca de 20 s", nunca "17,4 s").

## Estados
Sem taxa ainda: "Calculando o tempo…". Parou (rede): barra fica, texto vira "Sem conexão, retomando…". Erro em um item: conta como falha, o lote segue. Tudo feito: ✓ + texto, sem confete.

## Evitar
Spinner sozinho em espera longa; porcentagem com duas casas ("20,00%"); frase de torcida ("Vamos lá, você consegue!") no lugar do próximo passo; barra que volta para trás; progresso só por cor.

## Variações
- Tarefas do dia: `progress` com `segments={5}` no lugar do anel quando cabe numa linha.
- IA gerando: etapas nomeadas ("Lendo arquivo · Resumindo") + barra indeterminada, não tempo inventado.
- Upload: `file-upload` com `multiple` já mostra o resumo do lote e o tempo restante.

## Esqueleto
```tsx
<Card className="flex-row items-center gap-4 p-4">
  <ProgressCircle value={20} size="lg">20%</ProgressCircle>
  <div><p className="font-medium">1 de 5 feitas</p><p className="text-sm text-muted-foreground">4 para hoje, próxima às 16:00</p></div>
</Card>
<FileUpload multiple upload={upload} />
// Espera própria: const eta = createEta(total); eta.add(feito) → formatRemaining(eta.remaining)
<Card className="gap-2 p-4"><p>Importando 3 de 8</p><Progress value={pct}/><p className="text-xs text-muted-foreground">{texto}</p>
  <Button variant="ghost" size="sm">Cancelar</Button></Card>
```
