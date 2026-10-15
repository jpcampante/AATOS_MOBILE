@AGENTS.md

## Específico do Claude Code

### Comandos SDD

| Comando | Etapa |
| --- | --- |
| `/sdd-specify <descrição>` | Cria `specs/NNN-slug/spec.md` e a branch `feature/NNN-slug` |
| `/sdd-plan <NNN>` | Gera `plan.md` a partir da spec aprovada |
| `/sdd-tasks <NNN>` | Gera `tasks.md` a partir do plano |
| `/sdd-implement <NNN> [T00x]` | Implementa as tarefas, um commit por tarefa |

Definidos em `.claude/commands/`.

### Preview

- `.claude/launch.json` define `aatos-mobile-web` (`expo start --web`, porta 8084).
  Use `preview_start` com esse nome para verificar mudanças visuais.
- O app abre na tela de Login; para chegar às abas é preciso passar por ela.
- Em react-native-web, cliques sintéticos às vezes não disparam `onPress`.
  Se um clique não fizer efeito, confira com `read_page` antes de concluir que é bug.

### Antes de dizer que terminou

1. `npm run typecheck` sem erros.
2. Mudança visual verificada no preview web (ou explicado por que não dá).
3. Tarefa marcada `[x]` no `tasks.md` da feature, se for trabalho SDD.
