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

- [x] T001 Configurar Jest com `jest-expo` e `@testing-library/react-native`; script `npm test` — `package.json`, `jest.config.js` — RNF-07
- [ ] T002 [P] Configurar ESLint com `eslint-config-expo`; script `npm run lint`; corrigir ou silenciar com justificativa os erros iniciais — `eslint.config.js` — RNF-07
- [ ] T003 Pipeline de CI (GitHub Actions) rodando `typecheck`, `lint` e `test` em PR para `develop` e `main` — `.github/workflows/ci.yml` — RNF-07
- [ ] T004 Primeiros testes unitários da lógica pura: `src/features/auria/galleryLogic.ts`, `newsFormat.ts`, `richText.ts`, reducer de `useAuriaWorkspace.ts` — RNF-07

**Checkpoint:** `npm run typecheck && npm run lint && npm test` passa local e no CI.

## Fase 2 — Plataforma

- [ ] T005 [P] Declarar plugins e permissões Android de câmera, fotos e microfone no `app.json` (`expo-camera`, `expo-image-picker`, `expo-audio`) — RNF-01
- [ ] T006 Atualizar Expo SDK 54 → 56 seguindo o guia de upgrade da v56 (`npx expo install expo@^56 --fix`), revisar breaking changes e atualizar o AGENTS.md — RNF-01
- [ ] T007 [P] `app.json`: `userInterfaceStyle: "automatic"` para o tema "Sistema" funcionar no nativo — RNF-02

**Checkpoint:** app abre no Expo Go no emulador Android no SDK 56; câmera, fotos e microfone pedem permissão.

## Fase 3 — Camada de dados (princípio IV)

- [x] T008 Fonte única do usuário atual: `useCurrentUser()` em `src/features/auth`, usada em Insights, Tasks, Auria, Mail e Ajustes (feito na 001-login)
- [ ] T009 Expor dados de cada área por hooks/serviços (`src/features/<area>/`) e remover imports diretos de `src/data/*` em telas e componentes, começando pela Auria — princípio IV (Tasks e Insights saíram na spec 003)
- ~~T010 Resumo de tarefas~~ — **sem objeto**: a aba Tasks saiu do app (spec 003).
- [ ] T011 [P] Trocar e-mails, telefones e nomes com aparência real nos mocks por dados claramente fictícios (`example.com`) — RNF-06

**Checkpoint:** `grep "data/" src/screens src/components` só encontra configuração estática (navegação, modelos, templates).

## Fase 4 — Correções pequenas

- [x] T012 "Log out" nos Ajustes volta para a tela de Login — RF-LOG-03 (feito na 001-login)
- [ ] T013 [P] Mover cores soltas para tokens de `src/theme`, começando por `AuriaImageViewer.tsx`, `AuriaCameraView.tsx`, `AuriaVoiceMode.tsx`, `LoginScreen.tsx` — RNF-02
- [ ] T014 [P] Auditar acessibilidade da Auria e do Perfil (labels, roles, alvos de 44 pt) — RNF-04 (Insights, Tasks e Integrations saíram na spec 003)

**Checkpoint:** typecheck, lint e testes verdes; verificação manual no emulador Android sem regressão visual.

## Depois da baseline

Criar as specs do roadmap (spec.md, seção 6) com `/sdd-specify`, começando
pela que as respostas da seção 7 da spec desbloquearem primeiro.
