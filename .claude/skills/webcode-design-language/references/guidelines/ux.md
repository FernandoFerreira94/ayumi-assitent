# UX

Decisões de fluxo, estado e linguagem. A tela bonita que não deixa o usuário terminar a tarefa falhou.

## Antes de desenhar
- [ ] A tarefa principal da tela cabe numa frase com verbo ("emitir a nota do pedido"). Tudo que não serve a ela é secundário ou sai.
- [ ] O KPI do blueprint está claro (ativação, conversão, tempo por tarefa). A tela tem um jeito de medir isso (evento de analytics).
- [ ] Use os padrões que o usuário já conhece (lei de Jakob). Inovação fica no conteúdo e no acabamento, não em como se fecha um modal.

## Fluxos
- [ ] Caminho feliz com o menor número de passos possível. Cada campo e cada clique a mais precisa justificar existência.
- [ ] Decisões difíceis vêm com padrão sensato pré-selecionado (lei de Hick: menos opções visíveis, mais rápido).
- [ ] Revelação progressiva: o avançado fica a um clique ("Mais opções"), não na cara de todos.
- [ ] Toda ação tem saída: voltar, cancelar, desfazer. Desfazer (toast com ação, 5–8s) é melhor que confirmar antes.
- [ ] Confirmação explícita só para o que é irreversível e caro (excluir conta, emitir fiscal, cobrar cartão). Ver `overlays.md`.
- [ ] Fluxos longos (checkout, cadastro, onboarding) mostram progresso real e salvam o que já foi feito.
- [ ] O usuário nunca digita duas vezes a mesma informação no mesmo fluxo (WCAG 3.3.7).

## Onboarding e tour de primeiro acesso
- [ ] Tour é opcional por projeto (`@webcode/tour`, `enabled`) e só entra em produto usado no dia a dia (SaaS, ERP, CRM, admin…), nunca em landing, checkout ou fluxo de conversão.
- [ ] 3–5 passos. O primeiro diz quanto tempo leva; cada passo responde "por que isso me ajuda agora", não "este é o botão X".
- [ ] Abre sozinho **uma vez**, depois da página carregar e nunca por cima de outro modal. "Já visto" por usuário + versão do tour; com login, gravado no backend.
- [ ] Pular e Esc sempre funcionam e contam como visto. Reabrir fica no menu de ajuda.
- [ ] Mostre valor e leve à ação-chave (criar o primeiro pedido, cliente, fluxo); o checklist de ativação continua depois do tour.
- [ ] `spotlight` (bloqueia, foco preso) para o primeiro acesso; `floating` (não bloqueia) para novidades de versão e equipes internas.
- [ ] Meça: conclusão, passo onde pulam e ativação em 7 dias com e sem tour.

## Estados (cada tela precisa de todos)
- [ ] **Primeiro uso:** vazio que ensina o valor e tem uma ação ("Importar clientes" + "Ver exemplo").
- [ ] **Carregando:** < 300ms nada; até 2s skeleton no formato do conteúdo; > 2s skeleton + texto de progresso; > 10s barra com estimativa e possibilidade de sair.
- [ ] **Parcial:** poucos itens não podem parecer quebrado; layout funciona com 1 item.
- [ ] **Sem resultados de busca/filtro:** diz qual filtro zerou e oferece limpar.
- [ ] **Erro:** o que aconteceu, por que (se souber), o que fazer. Mantém o que o usuário digitou. Tem "Tentar de novo".
- [ ] **Sem permissão:** diz quem pode liberar. **Offline:** diz o que funciona e enfileira o resto.
- [ ] **Sucesso:** confirma com o resultado ("Pedido #1043 enviado"), mostra o próximo passo.
- [ ] **Limite:** plano, cota, estoque. Avisa antes de bater (80%), não só quando bate.

## Feedback e tempo de resposta
- [ ] Resposta visual ao toque em até 100ms (press, foco, spinner no botão). Até 1s o usuário mantém o fluxo; acima de 10s perde a atenção.
- [ ] Atualização otimista para ações de alta taxa de sucesso (curtir, marcar, mover card), com reversão clara se falhar.
- [ ] Botão que dispara requisição entra em loading e bloqueia clique duplo; o rótulo não muda de largura.
- [ ] Salvar automático mostra "Salvo há 2 min" discreto; se não for automático, avisa ao sair com alterações não salvas.
- [ ] Notificação assíncrona (export pronto, pagamento confirmado) via toast ou central, nunca modal.

## Copy (microtexto)
- [ ] Botão = verbo + objeto ("Criar fatura"). Nada de "OK", "Enviar", "Clique aqui".
- [ ] O par de botões de um diálogo responde à pergunta do título ("Excluir projeto?" → "Excluir" / "Cancelar").
- [ ] Erro sem culpa e sem jargão: "O CEP precisa de 8 números", não "Input inválido" ou "Erro 422".
- [ ] Termos do usuário, não do banco de dados ("Clientes", não "Entidades").
- [ ] Datas, moedas e números no padrão brasileiro: 27/10/2026, R$ 1.234,56, 1.234 itens. Datas relativas ("há 3 h") com a absoluta no tooltip.
- [ ] Tom consistente: direto, cordial, sem exclamação em mensagem de erro, sem humor em momentos de perda.
- [ ] Rótulos curtos e escaneáveis: as 2 primeiras palavras carregam o sentido.

## Performance percebida
- [ ] Conteúdo acima da dobra chega primeiro; o resto carrega com prioridade baixa.
- [ ] Prefetch de rotas prováveis (hover/visível) e transição imediata com skeleton em vez de tela branca.
- [ ] Animações não atrasam a tarefa: a próxima tela é interativa antes do fim da transição.
- [ ] Metas: LCP < 2,5s, INP < 200ms, CLS < 0,1 no p75 de usuários reais.

## Confiança
- [ ] Preço, prazo e custo total visíveis antes do último passo (sem surpresa no checkout).
- [ ] Dados sensíveis (cartão, CPF, saúde) com explicação curta de por que são pedidos.
- [ ] Ajuda no mesmo lugar em todas as telas (WCAG 3.2.6): WhatsApp, chat ou link de suporte fixo.
- [ ] Nada de padrões enganosos: opt-in desmarcado, cancelar tão fácil quanto assinar, urgência só se for real.

## Fontes
- Nielsen Norman Group, 10 heurísticas de usabilidade: https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g, Response Times (os 3 limites): https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g, Onboarding tutorials vs. contextual help: https://www.nngroup.com/articles/onboarding-tutorials/
- NN/g, Empty states: https://www.nngroup.com/articles/empty-state-interface-design/
- Laws of UX (Jakob, Hick, Fitts, Doherty, Tesler): https://lawsofux.com/
- GOV.UK Design System, padrões de serviço: https://design-system.service.gov.uk/patterns/
- Apple HIG, Feedback e Loading: https://developer.apple.com/design/human-interface-guidelines/feedback · https://developer.apple.com/design/human-interface-guidelines/loading
- web.dev, Core Web Vitals: https://web.dev/articles/vitals
- Deceptive Patterns (Harry Brignull): https://www.deceptive.design/
