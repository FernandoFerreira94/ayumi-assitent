# Skills do Superpowers (cópia vendorizada)

As 14 pastas abaixo são cópia das skills do plugin **Superpowers** (https://github.com/obra/superpowers, licença MIT, ver `SUPERPOWERS-LICENSE`):

brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills.

- **Por quê:** sessões do Claude Code na nuvem não instalam plugins, só leem `.claude/skills/`. No PC, o plugin continua ligado pelo `.claude/settings.json` (as skills aparecem duas vezes: `superpowers:<nome>` do plugin e `<nome>` desta cópia — é esperado).
- **Origem:** plugin `superpowers@claude-plugins-official` instalado no PC, versão **6.3.0**, commit `eafe962b18f6c5dc70fb7c8cc7e83e61f4cdde06`.
- **Copiado em:** 2026-11-19. Só a pasta `skills/` do plugin (sem hooks, comandos nem agentes), sem alterações.

## Esta cópia NÃO se atualiza sozinha

Para atualizar:

1. Atualize o plugin no PC (`/plugin` → superpowers → update) ou clone https://github.com/obra/superpowers.
2. Apague as 14 pastas listadas acima (não mexa nas outras skills do projeto).
3. Copie de novo cada pasta de `skills/` do plugin para `.claude/skills/`, mais o `LICENSE` como `SUPERPOWERS-LICENSE`.
4. Atualize versão, commit e data neste arquivo e abra um PR.
