# Manual de composição (GERADO — não edite)

## Regras gerais de composição
1. **Comando perto do conteúdo**: ação da linha na linha, do card no rodapé do card, da página no `page-header`. Nada de "Salvar" global longe do que mudou.
2. **Uma primária por contêiner**; o resto `secondary`/`ghost` ou no menu `…` (`dropdown-menu`).
3. **Hover revela, toque mostra**: ação secundária com `group-hover`/`group-focus-within`; em `pointer: coarse` fica visível ou vai para `swipe-actions`. Nunca esconda a única forma de fazer algo.
4. **Compacto sem apertar**: altura por `--wc-density-*`, proximidade agrupa, valor à direita com `tabular-nums`.
5. **No máximo 3 superfícies** (página → card → item). Card em card só `flat`; vidro nunca em vidro.
6. **Material segue a função**: `card` default (conteúdo), `interactive` (card clicável), `elevated` (raro), `glass` só sobre mídia/cor. Sombra só `shadow-wc-*`.
7. **Movimento explica**: durações do tema, mola só no que se arrasta/aperta, nada infinito, respeita movimento reduzido. Em conjunto: `stagger` na entrada, `swap` na troca de estado, `presence-list` na saída, `view-transition` do card ao detalhe; um conjunto anima por vez.
8. **Todo estado tem lugar**: `skeleton` no layout real, `empty` com a ação, erro com saída, `sonner` com Desfazer, desabilitado com motivo.
9. **Destrutivo proporcional**: reversível → Desfazer; pequeno → `popconfirm`; irreversível → `alert-dialog` com o nome do que some.
10. **Mesmo verbo do botão ao toast**: "Arquivar" → "Pedido arquivado · Desfazer".

## Receitas (44; sem marca = web, (m) = celular, (w+m) = os dois) — leia só a da tarefa
- Comércio: carrinho-mobile (m), checkout-web, comprovante-entrega (w+m), filtros-mobile (m), pdv-caixa, produto-mobile (m), rastreio-pedido (w+m), vitrine-produtos (w+m)
- Financeiro: cobranca-pix-boleto, emissao-nota-fiscal, extrato-financeiro (w+m), paywall-ios (m), plano-assinatura, transferencia-pix (m)
- Gestão: editor-ferramenta, equipe-permissoes, integracoes-api, lista-com-detalhe, painel-kpis, quadro-tarefas, relatorios-periodo, tabela-admin
- Conta e cadastro: ajustes-conta-ios (m), configuracoes-em-card, formulario-cadastro (w+m), login-cadastro (w+m), primeiro-acesso (w+m), wizard-etapas (w+m)
- App (iPhone): agenda-reserva (w+m), inicio-app-ios (m), lista-pedidos-ios (m), progresso-e-espera (w+m), resumo-habitos (m), vidro-barras-botoes (w+m)
- Comunicação e ajuda: busca-global (w+m), central-ajuda (w+m), central-notificacoes, chat-ia (w+m), envio-arquivos (w+m)
- Páginas: galeria-curadoria, landing-premium, landing-produto, pagina-precos, telas-desfecho (w+m)

Receita: `receitas/<id>.md`. Ficha de um componente: procure `"<nome>"` em `componentes.json` (não leia o arquivo inteiro).
