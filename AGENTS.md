# AGENTS.md — AATOS Mobile

Instruções para agentes de código (Claude Code, Cursor, Codex…) e para quem
desenvolve neste repositório.

## Expo

Expo HAS CHANGED. Antes de escrever código que usa Expo, leia a documentação
**da versão do SDK instalada**, não de memória.

- Versão instalada hoje: **SDK 54** (`expo` 54.0.x, React Native 0.81, React 19.1).
  Docs: https://docs.expo.dev/versions/v54.0.0/
- Confirme com `node -p "require('expo/package.json').version"`.
- Upgrade para o SDK 56 é a tarefa T006 de `specs/000-baseline/tasks.md`.
  Depois dele, use https://docs.expo.dev/versions/v56.0.0/

## Como trabalhamos: Spec-Driven Development

Todo trabalho de feature segue **spec → plano → tarefas → implementação**.
Leia antes de começar:

1. [specs/constitution.md](specs/constitution.md) — princípios não negociáveis.
2. [specs/README.md](specs/README.md) — o fluxo, estrutura de pastas e branches.
3. [specs/000-baseline/spec.md](specs/000-baseline/spec.md) — o que o app faz hoje.
4. [specs/000-baseline/plan.md](specs/000-baseline/plan.md) — mapa da arquitetura e do código.

Regras para agentes:

- Pedido de feature nova sem spec → crie a spec primeiro (`/sdd-specify`), não o código.
- Implementando uma feature → trabalhe tarefa por tarefa do `tasks.md`, marque
  `[~]`/`[x]` e faça um commit por tarefa.
- Spec ou plano errados → pare, proponha a correção no documento, depois siga.
- Correção de bug pequena ou ajuste visual sem mudança de comportamento pode ir
  direto, em branch `fix/…`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala dependências |
| `npm run web` | App no navegador em http://localhost:8083 |
| `npm start` | Metro + QR para Expo Go na mesma rede (LAN) |
| `npx expo start --tunnel` | Expo Go fora da rede local (4G / hotspot) |
| `npm run typecheck` | TypeScript sem emitir (obrigatório antes de commitar) |

Ainda não há testes automatizados nem lint; eles entram com as tarefas T001–T003
da baseline.

## Estrutura do código

```text
App.tsx                 login → MainApp (lazy) e histórico de abas
src/MainApp.tsx         shell com as abas do produto
src/screens/            uma tela por aba (Home, Auria, Tasks, Integrations, Login)
src/components/<area>/  componentes por área: auria, insights, tasks, integrations
src/components/ui/      componentes base reutilizáveis
src/components/icons/   ícones
src/features/<area>/    hooks, estado, serviços e tipos de domínio
src/data/               dados mock e configuração estática
src/theme/              tokens de design, tema light/dark, tipografia, movimento
specs/                  documentação SDD
```

## Convenções

- TypeScript `strict`. Sem `any` novo sem justificativa.
- Cores, fontes, espaçamentos e raios sempre de `src/theme` (`useTheme()`).
- Diferença de plataforma em `*.native.ts` / `*.web.ts` ou `Platform.OS` localizado.
- Controles só com ícone têm `accessibilityLabel` e `accessibilityRole`.
- Commits no estilo Conventional Commits: `feat(auria): …`, `fix(tasks): …`,
  `docs(specs): …`. Com tarefa SDD, termine com o ID: `(T012)`.
- Código e identificadores em inglês; documentação de specs em português.

## Branches

`main` (estável) ← `develop` (integração) ← `feature/NNN-slug` / `fix/…`.
Nunca commite direto em `main`.
