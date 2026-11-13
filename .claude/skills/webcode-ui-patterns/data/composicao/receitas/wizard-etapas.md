---
id: wizard-etapas
title: Fluxo em etapas
summary: Etapas curtas com indicador, voltar sem perder dados e revisão antes de confirmar; empilhado em diálogo quando é curto.
intent: [wizard, passo a passo, etapas, onboarding de conta, abertura de conta, configurar integração, fluxo guiado]
group: conta
platform: ambos
products: [saas, fintech, erp, health, automation]
components: [stepper, dialog-stack, card, field, button, radio-group, description-list, form-validation, result]
patterns: [progress-stepper, signup-multi-step]
status: stable
---
## Quando usar
Decisões que dependem da anterior (tipo de conta → dados → plano). 3 a 6 etapas. Até 3 etapas curtas: `dialog-stack`; mais: página com `stepper`.

## Estrutura
```
página: stepper no topo (compacto no celular) → card da etapa atual
   card: título da etapa + campos (field / radio-group em cards)
   footer: "Voltar" (ghost, esquerda) · "Continuar" (direita)
última etapa: description-list de revisão com "Editar" por bloco → "Confirmar abertura"
fim: result de sucesso com o próximo passo
```

## Comandos perto do contexto
- Voltar e Continuar no rodapé do card da etapa, sempre no mesmo lugar.
- Na revisão, "Editar" ao lado de cada bloco leva direto à etapa.
- Etapas concluídas clicáveis no `stepper`.

## Material e movimento
Um card por vez; troca de etapa com fade curto (base), sem deslize lateral longo. `dialog-stack` mostra a etapa anterior recuada atrás.

## Estados
Validação ao continuar (`form-validation`), foco no primeiro erro. Rascunho salvo a cada etapa. Erro final: volta à etapa do problema com `alert`.

## Evitar
Mais de 6 etapas; etapa com um campo só; perder dados ao voltar; barra de progresso inventada; "Próximo" sem dizer o que vem.

## Variações
- Abertura de conta PJ: CNPJ → sócios → documentos → revisão.
- Mobile: uma pergunta por tela com `navigation-bar` e voltar nativo.
- Retomar depois: salva rascunho e mostra "Continuar de onde parou".

## Esqueleto
```tsx
<Stepper steps={steps} current={2}/>
<Card><CardHeader><CardTitle>Dados da empresa</CardTitle></CardHeader>
  <CardContent><Field/>…<RadioGroup/></CardContent>
  <CardFooter className="justify-between"><Button variant="ghost">Voltar</Button><Button>Continuar</Button></CardFooter></Card>
// Revisão: <DescriptionList/> + <Button variant="link">Editar</Button>
// Curto: <DialogStack><DialogStackContent><DialogStackPanel/>…</DialogStackContent></DialogStack>
// Fim: <Result status="success" title="Conta aberta"/>
```
