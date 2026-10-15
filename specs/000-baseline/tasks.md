# Tasks — 000 Baseline: fundação

Spec: [spec.md](./spec.md) · Plano: [plan.md](./plan.md)

Objetivo: deixar o código pronto para o desenvolvimento por specs, corrigindo
os desvios da constituição listados no plano (seção 6). Nenhuma tarefa aqui
muda o comportamento visível do app, exceto T012.

## Convenções

- `[ ]` pendente · `[~]` em andamento · `[x]` concluída
- `[P]` = pode rodar em paralelo com outras `[P]` da mesma fase
- Um commit por tarefa: `chore(...)`/`refactor(...)` … `(T00x)`

## Fase 1 — Qualidade (princípio VI)

- [ ] T001 Configurar Jest com `jest-expo` e `@testing-library/react-native`; script `npm test` — `package.json`, `jest.config.js` — RNF-07
- [ ] T002 [P] Configurar ESLint com `eslint-config-expo`; script `npm run lint`; corrigir ou silenciar com justificativa os erros iniciais — `eslint.config.js` — RNF-07
- [ ] T003 Pipeline de CI (GitHub Actions) rodando `typecheck`, `lint` e `test` em PR para `develop` e `main` — `.github/workflows/ci.yml` — RNF-07
- [ ] T004 Primeiros testes unitários da lógica pura: `src/data/insights/selectors.ts`, `src/features/auria/galleryLogic.ts`, `newsFormat.ts`, `richText.ts`, `formatDueLabel` em `tasksMockData.ts`, reducer de `useAuriaWorkspace.ts` — RNF-07

**Checkpoint:** `npm run typecheck && npm run lint && npm test` passa local e no CI.

## Fase 2 — Plataforma

- [ ] T005 [P] Declarar plugins e textos de permissão de câmera, fotos e microfone no `app.json` (`expo-camera`, `expo-image-picker`, `expo-audio`) — RNF-01
- [ ] T006 Atualizar Expo SDK 54 → 56 seguindo o guia de upgrade da v56 (`npx expo install expo@^56 --fix`), revisar breaking changes e atualizar o AGENTS.md — RNF-01
- [ ] T007 [P] `app.json`: `userInterfaceStyle: "automatic"` para o tema "Sistema" funcionar no nativo — RNF-02

**Checkpoint:** app abre no Expo Go (iOS e Android) e no web no SDK 56; câmera, fotos e microfone pedem permissão com texto próprio.

## Fase 3 — Camada de dados (princípio IV)

- [ ] T008 Criar fonte única do usuário atual (`src/features/session/`) e usar em Tasks, Auria, Mail e Ajustes no lugar dos nomes fixos — entidade Usuário
- [ ] T009 Expor dados de cada área por hooks/serviços (`src/features/<area>/`) e remover imports diretos de `src/data/*` em telas e componentes, começando por Tasks e Insights — princípio IV
- [ ] T010 [P] Derivar o resumo de tarefas (`TasksSummary`) das tarefas atuais em vez de números fixos — RF-TSK-01
- [ ] T011 [P] Trocar e-mails, telefones e nomes com aparência real nos mocks por dados claramente fictícios (`example.com`) — RNF-06

**Checkpoint:** `grep "data/" src/screens src/components` só encontra configuração estática (navegação, modelos, templates).

## Fase 4 — Correções pequenas

- [ ] T012 "Log out" nos Ajustes volta para a tela de Login — RF-LOG-03
- [ ] T013 [P] Mover cores soltas para tokens de `src/theme`, começando por `TaskCard.tsx`, `AuriaImageViewer.tsx`, `AuriaCameraView.tsx`, `AuriaVoiceMode.tsx`, `LoginScreen.tsx` — RNF-02
- [ ] T014 [P] Auditar acessibilidade de Insights, Tasks e Integrations (labels, roles, alvos de 44 pt) — RNF-04

**Checkpoint:** typecheck, lint e testes verdes; verificação manual no web e no Expo Go sem regressão visual.

## Depois da baseline

Criar as specs do roadmap (spec.md, seção 6) com `/sdd-specify`, começando
pela que as respostas da seção 7 da spec desbloquearem primeiro.
