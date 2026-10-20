---
description: SDD etapa 4 — implementa as tarefas pendentes de uma feature
argument-hint: <NNN ou NNN-slug> [T00x]
---

Implemente a feature `$ARGUMENTS` seguindo o `tasks.md`.

Passos:

1. Leia `spec.md`, `plan.md` e `tasks.md` da feature e `specs/constitution.md`.
2. Confirme que está na `develop` (não há branches de feature).
3. Para cada tarefa pendente, na ordem (ou só a tarefa indicada nos argumentos):
   1. Marque `[~]` no `tasks.md`.
   2. Implemente, seguindo o padrão do código ao redor e os tokens de `src/theme`.
   3. Verifique: `npm run typecheck`, `npm test` e, se for visual, abra o preview web.
   4. Marque `[x]` e faça um commit pequeno: `feat(<area>): <descrição> (T00x)`.
4. Em cada **Checkpoint**, confira os critérios de aceite da história e pare para mostrar o resultado ao usuário.
5. Se a implementação revelar que a spec ou o plano estão errados, pare e proponha a correção no documento antes de seguir.
