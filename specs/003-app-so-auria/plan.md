# Plan — 003 App só com Auria e Perfil

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Aprovado (2026-10-20) |
| Data | 2026-10-20 |

## 1. Resumo técnico

`ProductTabId` passa a ser `'auria' | 'profile'`. A aba `settings`, que abria um
modal, vira a aba `profile`, com uma tela própria (`ProfileScreen`). As telas
`HomeScreen` (Insights), `TasksScreen` e `IntegrationsScreen` saem, junto com
seus componentes, dados, hooks e testes.

## 2. Arquivos

| Ação | Arquivos |
| --- | --- |
| Alterar | `src/data/productNavigation.ts`, `src/components/navigation/ProductNavBar.tsx`, `src/components/navigation/AppShell.tsx`, `src/MainApp.tsx`, `App.tsx` (aba inicial `auria`) |
| Criar | `src/screens/ProfileScreen.tsx` |
| Remover | `src/screens/{HomeScreen,TasksScreen,IntegrationsScreen}.tsx`; `src/components/{insights,tasks,integrations}/`; `src/data/insights/` (com o teste); `src/data/{tasksMockData,integrationsMockData,mailWorkspaceMockData}.ts`; `src/features/integrations/`; `src/components/auria/AuriaSettingsModal.tsx`; utilitários e ícones que ficarem sem uso |
| Manter | `AuriaScreen` e o deep link `initialPrompt` (sem uso por ora; a spec 002 decide) |

## 3. Verificação da constituição

| Princípio | Atende? | Observação |
| --- | --- | --- |
| I. Spec primeiro | ✅ | Esta spec |
| II. Android primeiro | ✅ | Verificado no emulador |
| III. Design system | ✅ | `ProfileScreen` só com tokens de `src/theme` |
| IV. Dados atrás de uma camada | ✅ | Perfil usa `useCurrentUser`, `useAuth`, `useTheme`, `discoverPrefsStore` |
| V. Acessibilidade | ✅ | Roles e labels; alvos de 44 pt |
| VI. Qualidade verificável | ✅ | Typecheck, testes; roteiro manual |
| VII. Simplicidade | ✅ | Remove código; nenhuma dependência nova |

## 4. Impacto em outros documentos

- Baseline: as tarefas T004 (partes de Insights/Tasks), T009–T011, T013 (`TaskCard`) e T014 (Insights/Tasks/Integrations) perdem o objeto.
- Spec 002: a tarefa A015 ("Ask Auria" vindo de Insights) sai.
- `AGENTS.md`: estrutura do código.
