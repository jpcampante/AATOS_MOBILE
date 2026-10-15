---
description: SDD etapa 3 — quebra o plano em tarefas executáveis
argument-hint: <NNN ou NNN-slug>
---

Gere a lista de tarefas da feature `$ARGUMENTS`.

Passos:

1. Leia `spec.md` e `plan.md` em `specs/$ARGUMENTS*/`. Se o plano não existir, pare e sugira `/sdd-plan`.
2. Copie `specs/templates/tasks-template.md` para `tasks.md` na mesma pasta.
3. Organize por fases: Preparação → Fundação → uma fase por história (na ordem de prioridade) → Acabamento.
4. Cada tarefa: ID sequencial (`T001`…), descrição no imperativo, arquivo(s) e requisitos atendidos (`RF-xx`).
   - Testes antes da implementação correspondente quando houver lógica pura.
   - Marque `[P]` só quando a tarefa não compartilha arquivos com outra `[P]` da mesma fase.
   - Cada fase de história termina com um **Checkpoint** verificável.
5. Garanta que todo requisito da spec aparece em pelo menos uma tarefa e liste os que ficaram de fora, se houver.
