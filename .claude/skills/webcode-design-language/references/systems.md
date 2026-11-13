# Recomendações por tipo de sistema

Ponto de partida para projeto novo sem Design Freeze. O blueprint do produto (`webcode-ui-patterns/data/blueprints/`) detalha telas, regras e estados; aqui fica a decisão rápida de tema, densidade, raio, motion e componentes. Os mesmos campos (`density`, `radius`, `components`) estão no frontmatter de cada blueprint e em `build/index.json`.

## Como ler
- **Densidade:** `compact` (linhas 32–36px, fonte 13–14px) · `comfortable` (40–44px, 14–15px) · `spacious` (seções amplas, 16–18px).
- **Raio:** valor-base em px do controle (botão, input). Cards usam o próximo degrau da escala do tema.
- **Motion:** `low` (só feedback), `medium` (feedback + transições de contexto), `high` (assinatura visual, scroll storytelling).
- **Escuro:** `sistema` segue o SO; `escuro` começa escuro; `claro` começa claro (com escuro disponível).
- **Tour de primeiro acesso:** recurso opcional por projeto (`@webcode/tour`, padrão `product-tour`). Recomendado para produtos de uso diário (gestão, verticais com área logada); o blueprint diz o que mostrar. Nunca em landing, checkout ou fluxo de conversão.

## Produto e gestão
| Tipo | Tema | Densidade | Raio | Motion | Escuro | Componentes-chave |
| --- | --- | --- | --- | --- | --- | --- |
| ERP e backoffice | clean-saas | compact | 6 | low | sistema | DataTable, Command, Sheet, Combobox, AlertDialog, Calendar |
| SaaS e dashboard | clean-saas · aurora | comfortable | 8 | low–medium | sistema | Sidebar, DataTable, Command, Dialog, Sheet, Chart |
| Dashboard analítico | clean-saas · aurora | comfortable | 8 | low | sistema | Chart, Card de KPI, Calendar em Popover, ToggleGroup |
| CRM de vendas | clean-saas | comfortable | 8 | low | sistema | Kanban, Sheet de detalhe, Combobox, Calendar |
| CRM de atendimento | clean-saas · aurora | comfortable | 10 | low | sistema | ScrollArea, Textarea, Drawer, Combobox de etiquetas |
| Admin interno | clean-saas | compact | 6 | low | sistema | DataTable, AlertDialog com motivo, Breadcrumb |
| Helpdesk | clean-saas · editorial | compact | 6 | low | sistema | DataTable, Accordion, Textarea com macros |
| PDV | clean-saas | comfortable | 10 | low | sistema | Card de produto, ToggleGroup, Dialog de pagamento |
| Logística | clean-saas | compact | 6 | low | sistema | DataTable, Drawer, Progress, Badge de status |
| Automação | clean-saas · aurora | comfortable | 8 | medium | sistema | canvas de fluxo, Sheet de configuração, logs em Table |

## Commerce
| Tipo | Tema | Densidade | Raio | Motion | Escuro | Componentes-chave |
| --- | --- | --- | --- | --- | --- | --- |
| E-commerce | aurora · editorial · clean-saas | comfortable | 12 | medium | claro | Carousel, Drawer de filtros, Sheet de carrinho, RadioGroup de pagamento |
| App de loja (mobile) | aurora · playful · clean-saas | comfortable | 14 | medium | sistema | tab bar com Sacola, busca em tela, Adicionar fixo no rodapé, checkout em etapas com Pix |
| Marketplace | clean-saas · aurora | comfortable | 10 | low–medium | claro | busca com Command, filtros, Card de oferta, Avatar de vendedor |
| Assinatura e D2C | aurora · editorial · brutalista | spacious | 14 | medium | claro | ToggleGroup mensal/anual, Card de plano, Accordion de FAQ |
| Catálogo B2B | clean-saas | compact | 6 | low | claro | DataTable de produtos, quantidade em lote, Sheet de pedido |

## Serviços e verticais
| Tipo | Tema | Densidade | Raio | Motion | Escuro | Componentes-chave |
| --- | --- | --- | --- | --- | --- | --- |
| Fintech | aurora · clean-saas | comfortable | 12 | medium | sistema | InputOTP, Drawer de confirmação, Chart, Badge de status |
| Saúde e agendamento | clean-saas · editorial | comfortable | 10 | low | claro | Calendar, ToggleGroup de horários, Field com máscaras |
| EdTech e LMS | aurora · clean-saas · playful | comfortable | 12 | medium | sistema | Progress, Accordion de módulos, Tabs, player |
| Delivery | aurora · playful | comfortable | 14 | medium | sistema | Drawer de item, stepper, Sheet de carrinho, tab bar |
| App do entregador | clean-saas · playful | comfortable | 14 | low | sistema | oferta com Aceitar de 56px, sheet de corrida sobre o mapa, prova offline (Expo recomendado) |
| Field service e OS | clean-saas · aurora | comfortable | 12 | low | sistema | offline primeiro, botão de estado no rodapé, checklist com foto, assinatura, fila de sincronização |
| Imobiliário | editorial · aurora | spacious | 8 | low–medium | claro | Carousel de fotos, filtros em Sheet, mapa + lista |
| Reservas | aurora · editorial | comfortable | 12 | medium | claro | Calendar de intervalo, stepper de hóspedes, Drawer |

## Marketing e presença
| Tipo | Tema | Densidade | Raio | Motion | Escuro | Componentes-chave |
| --- | --- | --- | --- | --- | --- | --- |
| Landing page | aurora · editorial · brutalista | spacious | 18 | high | sistema | hero, Accordion de FAQ, Dialog de vídeo, Field de lead |
| Institucional | editorial · clean-saas | spacious | 4 | low–medium | claro | navegação simples, Card de serviço, formulário de contato |
| Portfolio e agência | editorial · aurora · brutalista · cinematografico | spacious | 2 | high | sistema | grid de casos, view transitions, cursor |
| Blog e editorial | editorial | spacious | 3 | low | sistema | tipografia, sumário, Card de artigo |
| Lançamento | aurora · cinematografico | spacious | 18 | high | escuro | hero 3D/vídeo com poster, contagem, lista de espera |
| Evento | aurora · editorial · cinematografico | spacious | 14 | medium | sistema | agenda em Tabs, Card de palestrante, ingresso |

## Apps e ferramentas
| Tipo | Tema | Densidade | Raio | Motion | Escuro | Componentes-chave |
| --- | --- | --- | --- | --- | --- | --- |
| App mobile | aurora · playful | comfortable | 14 | medium | sistema | tab bar, pilha com voltar pela borda, Drawer, modal em cartão, lista com swipe + alternativa (guia `mobile.md`) |
| Hábitos e bem-estar | playful · aurora | comfortable | 16 | medium | sistema | onboarding em páginas, marcar com mola, calendário de calor, lembrete com permissão no momento certo |
| App de IA | aurora · clean-saas | comfortable | 12 | medium | escuro | Textarea de prompt, streaming, ScrollArea, Sheet de fontes |
| Docs e dev tools | clean-saas · editorial | comfortable | 6 | low | sistema | Command de busca, sidebar com seções, blocos de código copiáveis |

## Regras de decisão
1. Uso diário por horas → `clean-saas`, densidade compacta ou confortável, motion `low`.
2. Vende ideia ou marca → `aurora` (tecnologia, consumo) ou `editorial` (autoral, premium, conteúdo).
3. Toque como entrada principal (PDV, app, delivery) → raio ≥ 10, alvos ≥ 44–48px, nunca densidade compacta.
4. Mesmo cliente com site e app → site em `aurora`/`editorial`, app em `clean-saas`, **mesmo acento** (tema de cliente).
5. Público mais velho ou leigo (saúde, governo, serviços) → corpo 16–18px, contraste acima do mínimo, motion `low`.
6. Entretenimento, lançamento premium ou audiovisual → `cinematografico`, começando no escuro, motion `high` só no hero e nas transições.
7. Marca com atitude (moda jovem, criador, agência, indie) → `brutalista`; nunca para saúde, finanças conservadoras ou ERP.
8. Público jovem, aprendizado ou hábito (EdTech, infantil, gamificação) → `playful`, alvos ≥ 44px e mola `bouncy` só em feedback de conquista.

Todos os 27 tipos têm ao menos um blueprint (alguns têm vários, como CRM e SaaS). Tipos novos: adicione o produto em `scripts/lib/content.mjs`, uma linha aqui e o blueprint (`docs/adicionar-blueprint.md`).
