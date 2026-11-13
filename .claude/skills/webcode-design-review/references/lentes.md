# Lentes de revisão

Use na passada que estiver fazendo (estrutura → interação → acabamento). Cada achado entra na tabela da revisão com o critério correspondente.

## Heurísticas de Nielsen (cada uma cai num critério)
| Heurística | Critério |
| --- | --- |
| Visibilidade do estado | 4, 6 |
| Linguagem do usuário | 3 |
| Controle e saída (desfazer, Esc) | 5, 6 |
| Consistência e padrões | 8 |
| Prevenir erro | 4, 6 |
| Reconhecer em vez de lembrar | 2, 5 |
| Eficiência (atalhos, padrões) | 5, 11 |
| Estética minimalista | 2, 10 |
| Ajudar a sair do erro | 4 |
| Ajuda no contexto | 3 |

## Perguntas de checagem (Rams, Linear, Schoger, Ive)
- Dá para tirar uma borda, um ícone ou uma cor sem perder informação?
- Algum valor está fora dos tokens? Alguma promessa é desonesta (progresso falso, "grátis*")?
- O que acontece quando ninguém está olhando: erro de rede, sessão expirada, lista vazia?
- Isso é igual ao que qualquer gerador faria? (cards iguais com sombra, gradiente de enfeite, sobretítulo em caixa alta, fade-up em tudo)
- Dá para comparar antes e depois lado a lado?
- Passa nos testes de 1 minuto (desfoque, escala de cinza, 5 segundos, polegar)? Lista em `webcode-interface-craft/references/metodos.md` §5.
- A copy soa como gente quando lida em voz alta, no infinitivo nos botões, sem "Ops", "(s)" ou Title Case? (`webcode-interface-craft/references/ux-writing.md`)
- O pico e o fim do fluxo (sucesso, pagamento, saída do erro) têm o cuidado que merecem?
- O vidro está só na camada funcional (barras, controles flutuantes, menus) e tem foto, mapa ou rolagem atrás? Há mais de um vidro tingido ou vidro sobre vidro? (`webcode-design-language/references/materiais.md`)
