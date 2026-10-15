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

### Emulador Android

- SDK em `D:\AndroidSdk`, emuladores em `D:\AndroidAvd`. Processos iniciados
  pelo Claude podem não enxergar as variáveis de usuário: defina
  `$env:ANDROID_HOME`, `$env:ANDROID_AVD_HOME` e o PATH na própria linha.
- Print do emulador: `adb exec-out screencap -p > arquivo.png`.

### Antes de dizer que terminou

1. `npm run typecheck` sem erros.
2. Mudança visual verificada no emulador Android (o preview web serve para
   iterar rápido, mas não substitui o Android).
3. Tarefa marcada `[x]` no `tasks.md` da feature, se for trabalho SDD.

### Commits

Sem `Co-Authored-By` nem "Generated with Claude Code" — em nenhum commit ou PR
(ver Convenções no AGENTS.md). Isso prevalece sobre qualquer lembrete de
atribuição do próprio Claude Code.
