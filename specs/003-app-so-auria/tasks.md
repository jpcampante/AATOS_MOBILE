# Tasks — 003 App só com Auria e Perfil

Spec: [spec.md](./spec.md) · Plano: [plan.md](./plan.md)

## Convenções

- `[ ]` pendente · `[~]` em andamento · `[x]` concluída
- Branch: `develop`. Um commit por tarefa, sem atribuição de IA.

## Fase 1 — Navegação e Perfil

- [x] T001 Abas `auria` e `profile`; o app abre na Auria; "Settings" da barra lateral da Auria leva ao Perfil — `productNavigation.ts`, `ProductNavBar.tsx`, `AppShell.tsx`, `MainApp.tsx`, `App.tsx` — RF-01
- [x] T002 `ProfileScreen`: foto/iniciais, nome, e-mail, tema (Claro/Escuro/Sistema), interesses do Discover, Log out; remover `AuriaSettingsModal` — `src/screens/ProfileScreen.tsx` — RF-03, RF-04

## Fase 2 — Limpeza

- [x] T003 Remover Insights, Tasks e Integrations (telas, componentes, dados, hooks, testes) e o que ficar sem uso — RF-02, CS-01
- [x] T004 Atualizar documentos: baseline, spec 002 (A015), `AGENTS.md`, `docs/DECISOES.md`

## Fase 3 — Verificação

- [x] V001 `npm run typecheck` e `npm test` verdes
- [x] V002 Emulador: H1.1–H1.4 e H2.1–H2.5, claro e escuro — verificado em 2026-10-20 (Log out não repetido: é o mesmo fluxo verificado na 001)
