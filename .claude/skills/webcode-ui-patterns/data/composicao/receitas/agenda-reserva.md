---
id: agenda-reserva
title: Agenda e reserva de horário
summary: Escolher dia numa faixa da semana, horários livres em pílulas e confirmação fixa no rodapé com o resumo.
intent: [agendamento, reservar horário, marcar consulta, agenda, booking, horários disponíveis]
group: app
platform: ambos
products: [health, booking, delivery, field-service, edtech]
components: [week-strip, calendar, toggle-group, card, avatar, badge, bottom-bar, button, empty, skeleton, sonner]
patterns: []
status: stable
---
## Quando usar
Escolher dia + horário para um serviço/profissional. Agenda de equipe (várias pessoas): visão de calendário inteira.

## Estrutura
```
profissional/serviço em card: avatar + nome + duração + preço
week-strip (dias com vaga marcados) · "Ver mês" abre calendar
horários: toggle-group de pílulas por período (Manhã · Tarde · Noite)
bottom-bar: "Qui, 14/11 às 15h30" + button "Confirmar"
```

## Comandos perto do contexto
- Confirmar no rodapé com o resumo escolhido no próprio texto.
- Trocar profissional/serviço no card do topo ("Trocar").
- Dia sem vaga desabilitado com o motivo; próximo dia livre em um toque.

## Material e movimento
Pílulas com seleção sólida da marca; dia atual marcado com texto, não só cor. Troca de semana arrastando ou setas. Sem animação nos horários.

## Estados
Carregando horários: `skeleton` de pílulas. Dia sem vaga: `empty` curto com "Próximo dia com vaga: sex, 15". Confirmado: `sonner` + adicionar à agenda.

## Evitar
Select de horário; calendário mensal como primeira vista no celular; esconder o fuso; confirmar sem mostrar o resumo.

## Variações
- Mesa de restaurante: pessoas (`quantity-stepper`) + horário + observação.
- Profissional + serviço antes do horário (salão, clínica) com `avatar`.
- Web: `calendar` mensal à esquerda e horários à direita.

## Esqueleto
```tsx
<Card><CardContent className="flex gap-3"><Avatar/>…<Badge/></CardContent></Card>
<WeekStrip/><Button variant="link">Ver mês</Button>
<ToggleGroup type="single" variant="outline" className="flex-wrap"><ToggleGroupItem value="15:30">15:30</ToggleGroupItem></ToggleGroup>
<BottomBar><span>Qui, 14/11 às 15h30</span><Button>Confirmar</Button></BottomBar>
// Mês: <Calendar/>
```
