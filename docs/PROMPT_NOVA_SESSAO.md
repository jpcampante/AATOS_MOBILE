# Prompt para iniciar uma nova conversa

Copie o bloco abaixo como primeira mensagem de uma conversa nova no Claude
Code, aberta na pasta `D:\REPOS\AATOS_REBRANDING_MOBILE`. A linha **TAREFA** já
vem com o próximo passo; troque se quiser outra coisa.

---

```text
Vamos continuar o desenvolvimento do AATOS Mobile (app Android em Expo SDK 54 /
React Native 0.81, TypeScript). Responda sempre em pt-BR, inclusive nas
atualizações de progresso.

Antes de qualquer coisa, leia nesta ordem:
1. specs/002-auria-real/tasks.md, seção "Andamento": o que já foi feito, o que
   falta, os bloqueios e como testar sem eles.
2. docs/DECISOES.md: todas as decisões (D-01 a D-38) e a tabela "Pendências em aberto".
3. AGENTS.md e CLAUDE.md: regras do repositório.
4. specs/constitution.md (versão 2.1.0) e specs/README.md: o fluxo SDD.
5. specs/002-auria-real/spec.md e plan.md: a feature em andamento (a Auria real,
   com o mesmo backend da web). O plan.md §3 tem o inventário de endpoints E01–E56.

Como trabalhamos (obrigatório):
- Uma tarefa por vez: implementar → testes → npm run typecheck e npm test →
  conferir no emulador Android → commit (um por tarefa) → marcar [x] no
  tasks.md → registrar a decisão no fim do docs/DECISOES.md → só então a próxima.
- Teste de funcionalidade em toda tarefa: lógica pura com Jest; componentes e
  hooks com React Native Testing Library (helper src/test/renderWithTheme.tsx,
  que já traz o SafeAreaProvider e o tema).
- Um componente por arquivo e reutilizar antes de criar (ex.: AuriaActionSheet,
  AuriaFileChip, AuriaWorkPanel). As regras ficam em src/features/auria/, sem
  lógica nos componentes. Arquivos com mais de ~400 linhas são candidatos a
  divisão; o AuriaScreen já está grande, então a lógica nova vai para hooks.
- Paridade com a web: antes de cada tarefa, ler como o front web faz
  (D:\REPOS\aatos\src) e copiar o comportamento e os textos em inglês.
- O contrato do backend é o commit 6567791 de D:\REPOS\Backend\aatos-auria
  (git show 6567791:caminho). Não confiar na cópia local, que está desatualizada.
- Branches: só develop e main. Commitar na develop; a main só recebe merge da
  develop. Nunca criar branch nova e nunca commitar direto na main.
- Commits sem nenhuma atribuição de IA (sem Co-Authored-By, sem "Generated with
  Claude Code"). No estilo Conventional Commits, terminando com o ID: feat(auria): … (A034).
- Backend (aatos-auria, myceo-authenticator) só se muda com minha aprovação
  explícita, e numa worktree separada.

Ambiente:
- Emulador: Medium_Phone_API_37.0. SDK em D:\AndroidSdk, AVD em D:\AndroidAvd.
  Defina $env:ANDROID_HOME e $env:ANDROID_AVD_HOME na própria linha de comando.
  O adb fica em D:\AndroidSdk\platform-tools\adb.exe.
- Metro, em segundo plano: $env:EXPO_OFFLINE='1'; npx expo start --localhost
  (use --clear depois de instalar pacotes). Em seguida, adb reverse tcp:8081
  tcp:8081 e abra no Expo Go: adb shell am start -a android.intent.action.VIEW
  -d exp://127.0.0.1:8081. Capturas de tela: adb exec-out screencap -p > arquivo.png.
- Nunca rode "pm clear" no Expo Go: isso apaga o login, e quem faz login sou
  eu (você não digita senha).
- O push abre uma janela de login do GitHub (Git Credential Manager). Rode o
  push em segundo plano e me avise para eu autenticar. Não edite arquivos
  versionados enquanto um "push + merge" estiver esperando, porque o checkout
  da main falha.

Bloqueios atuais e como testar sem eles (detalhes no tasks.md):
- A conta de teste não tem plano, e o servidor responde 402 no_active_plan.
  Ainda não vimos nenhuma resposta real da Auria (P003).
- A busca na web está desligada no servidor de produção (settings devolve
  available: false, D-38).
- Para conferir no aparelho, sem commitar nada: o código temporário fica em
  src/features/auria/spike/ (não versionado).
  - Turno simulado: workDemo.ts, ligado no http.ts para mensagens que começam com /demo.
  - Conversa de QA criada sem IA: seedRetry.ts.
  - Liberar por um momento o bloqueio de créditos no AuriaScreen.
  - Faça backup antes, desfaça depois e confira com grep que não sobrou nada.
  - Toda conversa de QA criada eu apago pelo app: me avise.

TAREFA: seguir a spec 002 pela A034 (botão "Web" no composer, ligado ao
useWebSearchPreference da A033). Depois vêm A035 e A036, e então as Fases 9 e 10.
Antes, faça o push da develop e o merge na main do que estiver pendente
(o commit da A033 e o dos documentos).
```

---

## Sugestões de próxima tarefa

| Opção | Tarefa | Por que agora |
| --- | --- | --- |
| A | Spec 002: A034 → A036 (busca na web) e depois as Fases 9 e 10 | É a sequência da v1 |
| B | Spec 002: P003 assim que houver uma conta com plano | Prova o streaming real e todo o caminho de sucesso no aparelho |
| C | Baseline T002 + T003: ESLint e CI no GitHub Actions | Garante a qualidade automaticamente em todo push |
| D | Baseline T006: upgrade do Expo SDK 54 → 56 | Quanto antes, menos código para migrar |
