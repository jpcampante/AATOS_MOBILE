# Prompt para iniciar uma nova conversa

Copie o bloco abaixo como primeira mensagem de uma conversa nova no Claude
Code, aberta na pasta `D:\REPOS\AATOS_REBRANDING_MOBILE`. Troque a linha
**TAREFA** pelo que você quer fazer.

---

```text
Vamos continuar o desenvolvimento do AATOS Mobile (app Android em Expo SDK 54 /
React Native 0.81, TypeScript). Responda sempre em pt-BR.

Antes de qualquer coisa, leia nesta ordem:
1. docs/DECISOES.md — todas as decisões já tomadas (fonte da verdade).
2. AGENTS.md e CLAUDE.md — regras do repositório.
3. specs/constitution.md e specs/README.md — o fluxo SDD (spec → plano → tarefas → implementação).
4. specs/000-baseline/ — o que o app é e o backlog de fundação.
5. specs/001-login/ — a última feature entregue (login por código de e-mail), como referência de padrão.
6. specs/002-auria-real/ — a feature em andamento (Auria real, mesmo backend da web).

Contexto rápido:
- Produto só Android. O web é só preview. A verificação vale no emulador:
  Medium_Phone_API_37.0 (SDK em D:\AndroidSdk, AVD em D:\AndroidAvd; defina
  $env:ANDROID_HOME e $env:ANDROID_AVD_HOME na própria linha de comando).
- Branches: só develop e main. Todo trabalho é commitado na develop (não criar
  branch nova); a main só recebe merge da develop. Nunca commitar direto na main.
- Backend da Auria: D:\REPOS\Backend\aatos-auria (servido pelo aatos-system). A cópia
  local pode estar desatualizada: o contrato é o commit que o aatos-system main fixa.
- Commits sem nenhuma atribuição de IA (sem Co-Authored-By, sem "Generated with Claude Code").
- Backend de contas: D:\REPOS\Backend\myceo-authenticator (Django). O time trabalha na
  branch dev e leva para a main; desde 10/10/2026 o DEV usa o servidor de produção,
  então só a main implanta. Mudanças no backend só com aprovação explícita, e numa
  worktree separada (o checkout principal pode ter mudanças locais de outra pessoa).
- Antes de dizer que terminou: npm run typecheck e npm test verdes, e mudança visual
  conferida no emulador.

TAREFA: <descreva aqui o que vamos fazer>

Se a tarefa for uma feature nova, comece pela spec (/sdd-specify) e me mostre as
dúvidas antes de planejar. Se for uma tarefa da baseline (ex.: T002 ESLint, T003 CI,
T006 upgrade para o SDK 56), siga o specs/000-baseline/tasks.md. Ao terminar,
acrescente as decisões novas no fim de docs/DECISOES.md.
```

---

## Sugestões de próxima tarefa

| Opção | Tarefa | Por que agora |
| --- | --- | --- |
| A | Responder as dúvidas da spec 002 e implementar a fase 0 (P002–P004) | Destrava a Auria real, que é o motivo do app |
| B | Baseline T002 + T003: ESLint e CI no GitHub Actions | Garante qualidade automática em todo push |
| C | Baseline T006: upgrade do Expo SDK 54 → 56 | Quanto antes, menos código para migrar |
