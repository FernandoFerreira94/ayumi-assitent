---
name: boas-praticas-codigo
description: Use ao escrever, revisar ou refatorar código (qualquer linguagem/projeto). Regras essenciais de Clean Code, A Philosophy of Software Design e The Pragmatic Programmer, sem repetir o que o CLAUDE.md do projeto já define.
---

# Boas práticas de código (síntese)

Regras do CLAUDE.md/AGENTS.md do projeto prevalecem. Esta skill só acrescenta julgamento de design. Aplique proporcionalmente: não refatore o que não foi pedido.

## 1. Complexidade é o inimigo
- Mudar algo simples exige mexer em muitos lugares? Ou o leitor precisa saber demais para alterar? Isso é complexidade: corrija a causa, não o sintoma.
- Prefira módulos profundos: interface pequena e simples, implementação rica. Evite muitas classes/funções rasas que só repassam chamadas.
- Esconda decisões de design dentro de um módulo (vazamento de informação entre módulos = acoplamento oculto).
- Reduza exceções e casos especiais: projete a API para que o caso comum e o de borda sigam o mesmo caminho.
- Decida o design duas vezes: pense em uma segunda alternativa antes de fixar a primeira.

## 2. Nomes e legibilidade
- Nome diz intenção e unidade (`timeoutMs`, `isExpired`). Nome difícil de achar = responsabilidade mal definida.
- Mesmo conceito, mesmo nome em todo o código; nomes distintos para conceitos distintos.
- Função faz uma coisa em um nível de abstração, mas não quebre em pedaços minúsculos se isso obriga o leitor a pular entre arquivos. Prefira divisão por responsabilidade, não por contagem de linhas.
- Poucos parâmetros; evite flags booleanas (separe em duas funções ou use objeto/enum nomeado).
- Separe consulta de comando: quem pergunta não altera estado.
- Evite retornar/passar `null` quando um tipo explícito (união, Result, valor vazio) resolve.

## 3. Comentários
- Código mostra o "o quê"; comentário explica o "porquê", restrições, unidades, armadilhas e decisões não óbvias.
- Escreva o comentário de interface (contrato) antes ou junto da implementação. Apague comentário que repete o código ou mente.
- Nada de código morto comentado: o git guarda.

## 4. Erros
- Falhe cedo e alto; não engula exceção. Erro tem contexto suficiente para diagnosticar (o que, onde, valor relevante, sem segredo).
- Reduza onde erros precisam ser tratados: defina a semântica para que o caso "nada a fazer" não seja erro.
- Valide na fronteira (entrada externa, API, form), confie nos tipos dentro.
- Invariantes impossíveis: assert/erro explícito, não correção silenciosa.

## 5. Duplicação e ortogonalidade
- Uma verdade em um só lugar (DRY é sobre conhecimento, não sobre linhas parecidas). Duas cópias parecidas por acaso são aceitáveis; a terceira pede abstração.
- Componentes independentes: mudar um não deve quebrar outro. Teste: "se eu trocar X, quantos arquivos mudam?"
- Não abstraia antes de ter dois usos reais. Abstração errada custa mais que duplicação.

## 6. Testes e feedback rápido
- Todo bug corrigido ganha teste que o reproduz antes do conserto.
- Teste comportamento observável, não implementação. Teste rápido, determinístico, legível como documentação.
- Entregue fatia fina ponta a ponta (tracer bullet) antes de polir camadas; mostre cedo, ajuste cedo.
- Não "quebre janelas": ao tocar num arquivo, deixe-o um pouco melhor que encontrou (escopo pequeno, mesmo PR só se relacionado).

## 7. Disciplina de mudança
- Estratégico > tático: gaste ~10-20% extra em design limpo quando o código vai viver; use atalho consciente só em protótipo descartável e registre.
- Refatore em passos pequenos com testes verdes; não misture refatoração com mudança de comportamento no mesmo commit.
- Antes de adicionar abstração ou dependência: existe capacidade nativa/simples que resolve? Se não, justifique em 1 linha.
- Estimou ou assumiu algo? Declare a premissa e como validar.

## Checklist antes de entregar
1. Alguém novo entende a intenção em 1 leitura? 2. Há caso especial evitável? 3. Existe duplicação de conhecimento? 4. Erros têm tratamento e contexto? 5. Há teste do que mudou? 6. Algo foi adicionado sem necessidade (dependência, abstração, flag)?

## Conflitos entre os livros (como resolvemos)
- Funções minúsculas (Clean Code) x módulos profundos (Ousterhout): vence a profundidade; extraia função quando ela tiver nome claro e reuso/isolamento real.
- Comentários "são fracasso" (Clean Code) x comentários valiosos (Ousterhout): vence comentar o porquê e o contrato.
- TDD estrito x protótipo: teste primeiro em lógica de negócio e bugs; protótipo descartável pode esperar.
