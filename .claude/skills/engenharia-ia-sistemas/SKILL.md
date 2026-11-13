---
name: engenharia-ia-sistemas
description: Use ao projetar, implementar ou revisar funcionalidade com LLM/IA em produto (chat, copiloto, RAG, agente, automação) e ao orquestrar vários agentes. Síntese de guias de Anthropic, OpenAI e Google + livros de AI Engineering.
---

# Engenharia de IA em produto (síntese)

CLAUDE.md/AGENTS.md do projeto prevalecem. Aplique proporcionalmente ao risco e ao custo.

## 1. Escada de complexidade (suba só com prova)
1. Uma chamada ao modelo + bom contexto/exemplos.
2. Workflow fixo (código decide o caminho).
3. Agente único (modelo + ferramentas em loop).
4. Multiagente.
Só passe de degrau se uma eval mostrar ganho que paga o custo/latência. API direta antes de framework; prompt antes de fine-tuning; busca por termo/SQL antes de banco vetorial.

## 2. O que todo sistema com IA precisa
| Camada | Mínimo exigido |
|---|---|
| Contexto | Menor conjunto de tokens de alto sinal; buscar sob demanda (just-in-time) em vez de despejar tudo; resumir (compaction) perto do limite; notas/plano fora da janela. |
| Memória | Sessão (histórico) separada de memória longa (arquivo/tabela com dono e expiração). Nunca guardar segredo ou PII sem necessidade. |
| Ferramentas | Poucas, sem sobreposição, nome e parâmetros claros, exemplos e limites; retorno enxuto; tornar o erro difícil (caminho absoluto, enum, validação). Teste com entradas reais. |
| Avaliação | Evals desde o dia 1: 20 casos reais já bastam para começar. Juiz-LLM com rubrica simples, validado por amostra humana. Rodar a cada mudança de prompt/modelo. |
| Guardrails | Em camadas: validar entrada/saída (schema), relevância, injeção de prompt, PII, regras determinísticas. Somam-se a auth, RLS e permissões mínimas, nunca as substituem. |
| Risco por ferramenta | Classificar baixo/médio/alto (reversível? dinheiro? dado de terceiro?). Alto = confirmação humana. |
| Human-in-the-loop | Escalar após N falhas e antes de ação irreversível/financeira/externa. Mensagem externa = rascunho. |
| Observabilidade | Trace de cada passo (prompt, ferramenta, resultado, tokens, latência, custo, versão do modelo/prompt). Revisão humana diária de amostra no início. |
| Custo/latência | Orçamento por requisição e por usuário; limite de passos/tokens; cache de prompt; modelo pequeno para triagem/rota, grande para decisão; streaming na UI. |
| Fallback | Timeout, retry com backoff, modelo alternativo, resposta degradada honesta, retomar do checkpoint (não reiniciar). Testar o comportamento quando o modelo é atualizado. |
| Privacidade/compliance | Minimizar dados enviados, logar sem conteúdo sensível, saber onde o dado vai. |

## 3. Orquestração de várias IAs
Padrões (do mais simples ao mais caro):
- **Encadeamento**: etapas fixas com checagem programática entre elas.
- **Roteamento**: classificador envia para fluxo/modelo especializado (barato para o simples).
- **Paralelização**: seções independentes ao mesmo tempo, ou votação para decisões críticas.
- **Orquestrador-subagentes**: líder decide subtarefas dinamicamente; cada subagente tem contexto limpo e devolve só resumo.
- **Avaliador-otimizador**: um gera, outro critica, com critério claro.
- **Manager (agentes como ferramentas)** vs **handoff descentralizado** (triagem passa a conversa ao especialista). Prefira manager: controle e síntese em um lugar só.

Regras:
- Antes de dividir em agentes, melhore ferramentas, nomes e instruções do agente único.
- Divida por contexto ou ferramentas realmente distintos, não por "papéis" decorativos.
- Cada subagente recebe: objetivo, formato de saída, ferramentas permitidas, limite de esforço. Saída = resumo estruturado, não transcrição.
- Escale esforço pela complexidade (pergunta simples = 1 agente, poucas chamadas).
- Estado e plano persistidos fora do contexto; checkpoints para retomar.

**Quando NÃO usar multiagente**: tarefa com forte dependência entre passos ou que exige o mesmo contexto compartilhado (ex.: a maior parte de programação); baixo valor por tarefa (multiagente gasta ~15x tokens de um chat, agente ~4x); coordenação em tempo real; árvore de decisão mapeável (use workflow).

## 4. Checklist antes de entregar
1. Existe eval com casos reais e critério de aprovação?
2. Ação irreversível/externa passa por humano?
3. Há limite de passos, tokens e custo, e fallback se o modelo falhar?
4. Dá para reconstruir por trace por que o sistema respondeu aquilo?
5. Segredo/PII fora de prompt, log e memória?
6. A solução usa o degrau mais baixo da escada que resolve?
