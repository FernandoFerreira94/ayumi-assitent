# Métodos de design (sob demanda)

Ferramentas de processo para usar **antes** de codar e **durante** a revisão. Leia só a seção da etapa. Cada regra tem ao menos duas fontes; lista no fim.

## 1. Enquadrar (2 minutos, por escrito)
- **Trabalho a ser feito:** "Quando `<situação>`, quero `<ação>`, para `<resultado>`." Uma frase por tela. Se não sai, a tela ainda não tem objetivo. (JTBD, Christensen; Intercom)
- **Critério de pronto mensurável:** "o caixa fecha a venda em ≤ 3 toques", "o gestor acha o atraso em 5 s". Vira o teste da revisão. (Design Sprint, Knapp; Shape Up)
- **Apetite antes da solução:** quanto vale gastar (pequeno, médio, grande) e o que fica de fora. Corte escopo, não qualidade. (Shape Up, Basecamp)

## 2. Fluxo antes de pixel (breadboard)
Descreva em texto: **lugares** (telas, sheets, diálogos) → **afordâncias** (botões, campos, gestos em cada lugar) → **conexões** (o que leva aonde). Exemplo: `Pedidos [filtro, linha] → Detalhe (sheet) [Reembolsar…] → Confirmar (alert-dialog) → toast "Reembolsado" + Desfazer`. Só depois escolha receita e componentes. Evita desenhar uma tela linda que não fecha o fluxo. (Shape Up "breadboarding"; NN/g task flows)

## 3. Divergir antes de convergir (variações)
O usuário quer opções: **proponha 3 direções**, nunca uma só e nunca dez.
| Direção | O que muda | Exemplo |
| --- | --- | --- |
| **Segura** | segue a receita e o padrão conhecido (lei de Jakob) | lista + sheet de detalhe |
| **Ousada** | muda **um eixo** de forma marcante | mesma lista em cards com vidro e coreografia de entrada |
| **Fora da caixa** | muda o modelo de interação | linha do tempo, comando ⌘K, gesto, IA inline |
Eixos para variar (um por vez, o resto fixo): **densidade** (compacta ↔ arejada) · **material** (sólido ↔ vidro thin/regular/thick, efeito fosco/liquid/acrylic ↔ sombra de expressão) · **estrutura** (lista ↔ grade ↔ tabela ↔ quadro) · **navegação** (abas ↔ sidebar ↔ tab bar ↔ ⌘K) · **movimento** (nenhum ↔ função ↔ assinatura) · **tom** (neutro ↔ caloroso). Toda direção usa os mesmos tokens e componentes `@webcode`; a diferença é composição, não estilo inventado.
Mostre lado a lado (mesmo conteúdo real, mesmo tamanho) e **recomende uma** com o porquê ligado ao critério de pronto. (Double Diamond, Design Council; Crazy 8s, Google Ventures; Buxton, *Sketching User Experiences*)

## 4. Leis que decidem layout (Gestalt + Laws of UX)
- **Proximidade e região comum:** o que é do mesmo grupo fica mais perto entre si que do vizinho; fundo/borda só quando o espaço não basta. (Gestalt; NN/g)
- **Semelhança:** mesma função, mesma aparência; o diferente precisa ser diferente de propósito. (Gestalt)
- **Von Restorff:** só uma coisa se destaca por área; dois destaques se anulam. (Laws of UX)
- **Fitts:** ação frequente grande e perto de onde a mão/cursor já está; destrutiva longe da primária. (Fitts; Laws of UX)
- **Hick:** menos opções visíveis e um padrão pré-selecionado; o resto em "Mais". (Hick; Laws of UX)
- **Tesler:** a complexidade não some, alguém carrega; carregue no sistema (máscara, CEP preenche endereço, padrão inteligente). (Tesler; Laws of UX)
- **Doherty:** resposta em < 400 ms mantém o ritmo; acima disso, dê feedback ou trabalhe otimista. (Doherty; Laws of UX)
- **Gradiente de objetivo:** mostre o quanto falta (passo 2 de 3, barra de progresso no checkout). (Kivetz; Laws of UX)
- **Pico e fim:** as pessoas lembram o pior/melhor momento e o final. Invista no sucesso do pagamento, na primeira vitória do onboarding e na saída de um erro; não em enfeite do meio. (Kahneman; Laws of UX)
- **Posição serial:** primeiro e último itens de uma lista/menu são os mais lembrados; ponha ali o que importa. (Ebbinghaus; Laws of UX)

## 5. Testes rápidos (cada um < 1 minuto)
| Teste | Como | Passa quando |
| --- | --- | --- |
| **Desfoque (squint)** | screenshot com blur ~8px ou olhos semicerrados | ainda se vê a primária e os 2–3 grupos |
| **Escala de cinza** | `filter: grayscale(1)` na página | hierarquia e estados continuam legíveis sem cor |
| **5 segundos** | olhe 5 s e responda: o que é, o que faço aqui? | as duas respostas batem com o enquadramento |
| **Tirar um** | esconda cada borda, ícone, cor de fundo, um por vez | se nada se perde, tire de vez |
| **Polegar** | celular 390px, uma mão | primária na metade de baixo, nada crítico no topo esquerdo |
| **Ler em voz alta** | leia a copy da tela como se falasse com alguém | soa como gente; nenhuma frase precisa de explicação |
| **Pior caso** | nome de 60 caracteres, 0 itens, 10 mil itens, offline | nada quebra, corta sem jeito ou some |
(Refactoring UI; NN/g; UsabilityHub/Lyssna para 5 s; Luke Wroblewski para polegar)

## 6. Percurso cognitivo (antes de entregar um fluxo)
Para cada passo do breadboard, quatro perguntas; um "não" é problema de severidade alta na revisão:
1. A pessoa vai **querer** fazer isso aqui? 2. Ela **vê** o controle? 3. Ela **entende** que o controle faz o que quer? 4. Depois, ela **percebe** que deu certo?
(Wharton et al., *Cognitive Walkthrough*; NN/g)

## 7. Tipografia como método
1. Escolha o papel de cada texto antes do tamanho: título da tela, título de seção, corpo, rótulo, metadado, número. No máximo **4–5 papéis** por tela; cada papel = um token `text-*` + peso.
2. Contraste por **peso e cor** antes de tamanho: metadado em `text-fg-muted` no mesmo tamanho do corpo costuma bastar.
3. Entrelinha cai quando o tamanho sobe (corpo ~1.5, título ~1.1–1.2); tracking negativo leve em display, positivo em rótulo curto em caixa alta.
4. Medida 45–75 caracteres em texto corrido (`max-w-prose`); número tabular onde se compara.
5. Duas famílias no máximo (display + texto do tema). Fonte nova é decisão de tema, não de tela.
(Butterick, *Practical Typography*; Bringhurst; Refactoring UI; Apple HIG Typography)

## Fontes
Design Council, Double Diamond · Jake Knapp, *Sprint* (Crazy 8s) · Ryan Singer, *Shape Up* (breadboarding, apetite) · Bill Buxton, *Sketching User Experiences* · Clayton Christensen / Intercom, *Jobs to be Done* · Jon Yablonski, Laws of UX (lawsofux.com) · NN/g (Gestalt, task flows, cognitive walkthrough, 5-second test) · Wharton, Rieman, Lewis, Polson (1994) · Kahneman (pico-fim) · Wathan & Schoger, *Refactoring UI* · Luke Wroblewski (thumb zone) · Matthew Butterick, *Practical Typography* · Robert Bringhurst, *The Elements of Typographic Style* · Apple HIG.
