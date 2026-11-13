# UX writing em pt-BR (sob demanda)

Complementa a seção Copy de `detalhes.md` (regras gerais). Aqui ficam as convenções do português do Brasil, a voz por momento e o glossário. Fontes no fim.

## 1. Gramática da interface
- **Botões e itens de menu no infinitivo**: "Salvar", "Criar conta", "Emitir nota". É o padrão do Apple, Google e Microsoft em pt-BR. Nada de "Salve" no botão.
- **Instruções no imperativo, falando com "você"**: "Digite o CPF", "Escolha uma data". Nunca "o usuário".
- **Sem gerúndio de futuro** ("estaremos enviando"): "Vamos enviar" ou "Enviamos". Gerúndio só em estado em andamento: "Salvando…".
- **Capitalização de frase** em títulos, botões e abas: "Formas de pagamento", não "Formas De Pagamento".
- **Plural certo**: "1 item", "2 itens", "Nenhum item"; use `Intl.PluralRules('pt-BR')`, nunca "item(s)".
- **Gênero sem barra**: reformule em vez de "Bem-vindo(a)" ou "todes": "Boas-vindas", "Que bom ter você aqui", "Pessoa responsável". (Linguagem neutra com "-e/elu" é vetada na administração pública pela Lei 15.263/2025; em produto privado, reformular resolve e lê melhor.)
- **Formatos**: R$ 1.234,56 (espaço não quebrável), 02/11/2026, "2 de nov." em texto, 14h30, 3,5 km, +55 (11) 91234-5678. Sempre por `Intl`/`@webcode/br`, nunca à mão.
- **Linguagem simples**: palavra comum, frase curta (até ~20 palavras), uma ideia por frase, ordem direta, sem jargão do sistema. (Lei 15.263/2025, Política Nacional de Linguagem Simples)

## 2. Voz fixa, tom por momento
A voz da marca não muda; o tom se ajusta à emoção do momento.
| Momento | Tom | Exemplo |
| --- | --- | --- |
| Rotina (salvar, filtrar) | neutro, mínimo | "Salvo" · nada, se o resultado já aparece |
| Primeira vez / vazio | convidativo, mostra o próximo passo | "Seus pedidos aparecem aqui. Criar o primeiro pedido" |
| Sucesso importante | caloroso, sem exagero | "Pagamento confirmado. O recibo foi para seu e-mail." |
| Erro do usuário | calmo, diz como corrigir | "O CEP precisa de 8 números." |
| Erro do sistema | assume a culpa, dá saída | "Não conseguimos salvar agora. Seus dados continuam aqui. Tentar de novo" |
| Perda, dinheiro, segurança | sério, preciso, sem humor nem exclamação | "Esta ação exclui 3 pedidos e não pode ser desfeita." |
(Podmajersky, *Strategic Writing for UX*: voz = conceitos + vocabulário + verbosidade + gramática + pontuação + capitalização, definidos uma vez no produto.)

## 3. Fórmulas
- **Erro:** o que houve + o que fazer (+ por que, só se ajudar). Ao lado do campo; sem "Ops", "Erro!", código ou culpa.
- **Vazio:** título curto + o que vai aparecer aqui + uma ação. Sem resultado de busca: diga o termo e ofereça limpar filtros.
- **Confirmação destrutiva:** título é a pergunta com o verbo e o objeto ("Excluir 3 pedidos?"); corpo diz a consequência; botão repete o verbo ("Excluir pedidos"); o outro é "Cancelar", a não ser que a ação já seja cancelar: "Cancelar assinatura" × "Manter assinatura".
- **Toast:** passado do verbo do botão ("Publicar" → "Publicado") + ação ("Desfazer", "Ver pedido"). Uma linha.
- **Rótulo de campo:** substantivo curto ("CPF", "Data de nascimento"); dica de formato fora do campo; "(opcional)" no rótulo do que é opcional, não asterisco no obrigatório quando a maioria é obrigatória.
- **Tamanho:** botão até 3 palavras; título até ~6; toast em uma linha. As duas primeiras palavras carregam o sentido.

## 4. Glossário (uma palavra por conceito no produto inteiro)
| Use | Não use | Nota |
| --- | --- | --- |
| Entrar / Sair | Login, Logar, Logout | "Criar conta" para cadastro |
| Excluir | Deletar, Apagar | some de vez; pede desfazer ou confirmação |
| Remover | Excluir | tira de uma lista/grupo, o item continua existindo |
| Arquivar | Excluir | some da vista, recuperável |
| Configurações | Settings, Preferências (misturado) | "Ajustes" só em app que imita iOS, e então em todo o app |
| E-mail, senha, celular | Email, password, telefone celular | |
| Baixar / Enviar arquivo | Download / Upload | "Exportar" quando gera arquivo de dados |
| Tentar de novo | Retry, Tentar novamente? | |
| Pesquisar (campo) / Buscar CEP (ação) | Search | escolha uma e mantenha |
Termo do domínio do cliente vence o glossário (ex.: "OS" no Axion). Registre o termo no `DESIGN.md` do projeto.

## 5. Checagem final (10 segundos)
Leia em voz alta. Tem "Ops", "!" em erro, "(s)", "(a)", "Clique aqui", "Saiba mais", Title Case, termo em inglês sem necessidade, ou duas palavras para a mesma coisa? Corrija.

## Fontes
Torrey Podmajersky, *Strategic Writing for UX* (O'Reilly) · Kinneret Yifrah, *Microcopy: The Complete Guide* · Microsoft, Guia de estilo de localização pt-BR (download.microsoft.com, por-bra-StyleGuide.pdf) · Apple e Google, interfaces em pt-BR (convenção de infinitivo em comandos) · Lei 15.263/2025, Política Nacional de Linguagem Simples (planalto.gov.br) · NN/g, error messages e empty states · Atlassian Design, Voice and tone.
