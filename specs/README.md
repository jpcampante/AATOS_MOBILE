# Spec-Driven Development (SDD) no AATOS Mobile

Toda feature nasce como especificação, vira plano técnico, é quebrada em
tarefas e só então é implementada. As regras gerais estão na
[constituição](./constitution.md).

## Estrutura

```text
specs/
├── README.md              ← este guia
├── constitution.md        ← princípios não negociáveis
├── templates/             ← modelos de spec, plan e tasks
│   ├── spec-template.md
│   ├── plan-template.md
│   └── tasks-template.md
└── NNN-slug/              ← uma pasta por feature
    ├── spec.md            ← o quê e porquê (produto)
    ├── plan.md            ← como (técnico)
    └── tasks.md           ← passos executáveis
```

A pasta [`000-baseline`](./000-baseline/spec.md) documenta o app **como ele
está hoje** e serve de referência para todas as features seguintes.

## Fluxo

| Etapa | Saída | Quem aprova | Comando no Claude Code |
| --- | --- | --- | --- |
| 1. Especificar | `spec.md` sem `[PRECISA ESCLARECER]` | Produto | `/sdd-specify <descrição>` |
| 2. Planejar | `plan.md` passando na verificação da constituição | Tech lead | `/sdd-plan <NNN>` |
| 3. Quebrar em tarefas | `tasks.md` com fases e checkpoints | Tech lead | `/sdd-tasks <NNN>` |
| 4. Implementar | Código + testes, uma tarefa por commit | Revisão antes do merge `develop` → `main` | `/sdd-implement <NNN>` |

Regras do fluxo:

1. Não pule etapas. Se a implementação mostrar que a spec estava errada,
   volte e corrija a spec primeiro.
2. Numeração sequencial com três dígitos: `001-login-real`, `002-...`.
3. Sem branch por feature: a spec, o plano, as tarefas e o código são
   commitados direto na `develop`, uma tarefa por commit.
4. Release: merge `develop` → `main`.
5. Ao terminar, mude o status da spec para **Implementada**.

## Branches

Só existem duas (decisão de 2026-10-20):

| Branch | Uso |
| --- | --- |
| `main` | Versão estável, só recebe merge de `develop` |
| `develop` | Todo o trabalho: features (uma pasta em `specs/`), correções e docs |

Não se criam branches `feature/…` nem `fix/…`.
