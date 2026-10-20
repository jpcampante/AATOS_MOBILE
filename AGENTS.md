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

## Plataforma: só Android

O produto é **só Android** (decisão de 2026-10-15, princípio II da constituição).

- iOS está fora do escopo: não crie trabalho específico de iOS.
- O web serve só como preview rápido durante o desenvolvimento.
- A verificação que vale é no **emulador Android com Expo Go**.
  Setup da máquina: [docs/android-emulator.md](docs/android-emulator.md).

## Como trabalhamos: Spec-Driven Development

Todo trabalho de feature segue **spec → plano → tarefas → implementação**.
Leia antes de começar:

1. [specs/constitution.md](specs/constitution.md) — princípios não negociáveis.
2. [specs/README.md](specs/README.md) — o fluxo, estrutura de pastas e branches.
3. [specs/000-baseline/spec.md](specs/000-baseline/spec.md) — o que o app faz hoje.
4. [specs/000-baseline/plan.md](specs/000-baseline/plan.md) — mapa da arquitetura e do código.
5. [docs/DECISOES.md](docs/DECISOES.md) — registro de todas as decisões tomadas (acrescente as novas no fim).

Regras para agentes:

- Pedido de feature nova sem spec → crie a spec primeiro (`/sdd-specify`), não o código.
- Implementando uma feature → trabalhe tarefa por tarefa do `tasks.md`, marque
  `[~]`/`[x]` e faça um commit por tarefa.
- Spec ou plano errados → pare, proponha a correção no documento, depois siga.
- Correção de bug pequena ou ajuste visual sem mudança de comportamento pode ir
  direto na `develop`, com commit `fix(…)`.
- Nunca crie branch nova (nem `feature/…` nem `fix/…`): ver [Branches](#branches).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala dependências |
| `emulator -avd Medium_Phone_API_37.0` | Liga o emulador Android |
| `npm run android` | Metro + abre o app no emulador (instala o Expo Go se faltar) |
| `npm start` | Metro + QR para Expo Go num celular Android na mesma rede |
| `npx expo start --tunnel` | Expo Go fora da rede local (4G / hotspot) |
| `npm run web` | Preview no navegador em http://localhost:8083 (só desenvolvimento) |
| `npm run typecheck` | TypeScript sem emitir (obrigatório antes de commitar) |
| `npm test` | Testes (Jest + jest-expo) |

Ainda não há lint nem CI; entram com as tarefas T002–T003 da baseline.

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
docs/                   guias de ambiente (emulador Android)
```

## Convenções

- TypeScript `strict`. Sem `any` novo sem justificativa.
- Cores, fontes, espaçamentos e raios sempre de `src/theme` (`useTheme()`).
- Diferença de plataforma em `*.native.ts` / `*.web.ts` ou `Platform.OS` localizado.
- Controles só com ícone têm `accessibilityLabel` e `accessibilityRole`.
- Commits no estilo Conventional Commits: `feat(auria): …`, `fix(tasks): …`,
  `docs(specs): …`. Com tarefa SDD, termine com o ID: `(T012)`.
- **Commits e PRs sem autoria de IA.** Nunca adicione `Co-Authored-By: Claude …`,
  "Generated with Claude Code" ou qualquer outra atribuição a ferramenta de IA
  em mensagens de commit ou descrições de PR. Isso vale para todos os commits.
- Código e identificadores em inglês; documentação de specs em português.

## Branches

Só existem duas branches: `main` (estável) ← `develop` (trabalho).

- Todo trabalho (features, correções, docs) é feito e commitado na `develop`.
- A `main` só recebe merge da `develop`, quando o que está nela foi verificado.
- Nunca commite direto em `main` e não crie branches de feature ou de correção
  (decisão de 2026-10-20).
