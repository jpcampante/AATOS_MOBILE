# Tasks — <NNN> <Nome da feature>

Spec: [spec.md](./spec.md) · Plano: [plan.md](./plan.md)

## Convenções

- `[ ]` pendente · `[~]` em andamento · `[x]` concluída
- `[P]` = pode rodar em paralelo (não toca nos mesmos arquivos de outra `[P]`)
- Cada tarefa cita os requisitos que atende (`RF-xx`, `RNF-xx`) e os arquivos.
- Uma tarefa = um commit pequeno e revisável.

## Fase 1 — Preparação

- [ ] T001 <descrição> — `src/...` — RF-01

## Fase 2 — Fundação (bloqueia as histórias)

- [ ] T002

## Fase 3 — História 1 (P1)

- [ ] T003 [P] Teste: <critério de aceite 1> — `src/.../__tests__/...`
- [ ] T004 Implementar ... — `src/...` — RF-01

**Checkpoint:** História 1 funciona sozinha e passa nos critérios de aceite.

## Fase 4 — História 2 (P2)

- [ ] T005

## Fase final — Acabamento

- [ ] T0xx `npm run typecheck` e `npm test` sem erros
- [ ] T0xx Verificação manual no emulador Android (Expo Go)
- [ ] T0xx Atualizar status da spec para **Implementada**
