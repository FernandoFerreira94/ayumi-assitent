# Navegação

O usuário precisa saber onde está, para onde pode ir e como voltar. Sempre, em qualquer tela.

## Escolha do modelo
| Produto | Desktop | Mobile |
| --- | --- | --- |
| Site, landing, institucional | header com 4–6 links + CTA | header compacto + menu em sheet/tela cheia |
| E-commerce | header com busca proeminente, categorias em mega menu | header com busca + tab bar (Início, Categorias, Busca, Carrinho, Conta) |
| SaaS, CRM, admin | sidebar recolhível (5–8 áreas) + header da página | sidebar vira sheet; tab bar se o uso mobile for diário |
| ERP | sidebar por módulo com grupos + ⌘K + favoritos | uso mobile restrito a consultas e aprovações |
| App mobile | — | tab bar com 3–5 destinos (iOS) ou navigation bar (Material) |

## Sidebar
- [ ] 5–8 itens de primeiro nível; mais que isso, agrupe com títulos de seção ou mova para Configurações.
- [ ] Ícone + rótulo. Recolhida mostra só ícone com tooltip, e lembra a preferência.
- [ ] Item ativo claro (fundo `accent-soft` ou indicador lateral + `aria-current="page"`).
- [ ] Workspace/empresa no topo, conta e ajuda no rodapé.
- [ ] Contadores (badges) só para o que exige ação ("3 aprovações"), não para totais.
- [ ] Rótulos substantivos e estáveis ("Pedidos", "Clientes"); nada de "Gerenciar" ou "Meus" repetido.

## Header da página (apps)
- [ ] Título da tela igual ao item de navegação que levou até ela.
- [ ] Breadcrumb quando há 3+ níveis de hierarquia ("Clientes / Acme / Contratos"); o último item não é link.
- [ ] Ação primária à direita do título; secundárias em menu. Filtros e abas logo abaixo.
- [ ] Em telas de detalhe, voltar leva para a lista com filtros e scroll preservados.

## Tabs
- [ ] Abas para alternar visões do mesmo objeto (Visão geral, Faturas, Atividade), não para passos de um fluxo.
- [ ] 2–6 abas, rótulos curtos. Aba ativa refletida na URL.
- [ ] Teclado segue o WAI-ARIA: setas trocam de aba, Tab entra no painel.
- [ ] Indicador desliza entre abas (o `@webcode/tabs` já faz) sem animar o conteúdo pesado.

## Tab bar (mobile)
- [ ] 3–5 destinos de topo, sempre visíveis, com ícone + rótulo. Nunca ações ("Novo") na tab bar, exceto o botão central de criação em apps de conteúdo, se for a ação principal.
- [ ] Tocar de novo na aba ativa volta ao topo/raiz da pilha.
- [ ] Cada aba preserva sua pilha de navegação.
- [ ] Respeita `env(safe-area-inset-bottom)`; vidro conforme o tema (padrão `ios-tab-bar`).

## Menus e mega menus
- [ ] Mega menu abre no clique (ou hover com atraso de ~150ms e "corredor" tolerante), fecha com Esc e ao sair com atraso.
- [ ] Menu de ações segue o padrão `menu button` do WAI-ARIA: setas navegam, letras saltam, Esc fecha e devolve o foco.
- [ ] Itens destrutivos no fim do menu, separados, em `danger`.

## Busca e ⌘K
- [ ] Apps com mais de ~10 telas ou muitos registros têm paleta de comandos (⌘K / Ctrl+K) que navega, busca registros e executa ações.
- [ ] Busca global mostra resultados agrupados por tipo, recentes quando vazia, e atalhos visíveis.
- [ ] E-commerce: busca com sugestões, correção de digitação ("Você quis dizer…"), e nunca "0 resultados" seco.

## URLs e estado
- [ ] Toda tela importante tem URL própria (deep link): filtros, abas, item aberto em sheet, passo do wizard.
- [ ] Voltar do navegador funciona como o usuário espera (fecha sheet aberto por rota, volta o passo).
- [ ] Links abrem em nova aba com Ctrl/⌘+clique (use `<a href>` de verdade, não `onClick` em `div`).
- [ ] Transição entre telas com View Transitions quando ajuda a entender a continuidade (lista → detalhe), nunca atrasando a interação.

## Rodapé (sites)
- [ ] Contato, CNPJ, endereço, políticas (privacidade/LGPD, trocas), redes e WhatsApp. Links agrupados por intenção.

## Fontes
- Apple HIG, Tab bars e Sidebars: https://developer.apple.com/design/human-interface-guidelines/tab-bars · https://developer.apple.com/design/human-interface-guidelines/sidebars
- Material 3, Navigation bar e Navigation rail: https://m3.material.io/components/navigation-bar/overview · https://m3.material.io/components/navigation-rail/overview
- NN/g, Menu design checklist: https://www.nngroup.com/articles/menu-design/
- NN/g, Breadcrumbs: https://www.nngroup.com/articles/breadcrumbs/
- WAI-ARIA APG, Tabs e Menu Button: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ · https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
- MDN, View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
