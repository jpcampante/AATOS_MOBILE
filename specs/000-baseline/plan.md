# Plan — 000 Baseline: arquitetura atual

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Aprovado (retrato do código em 2026-10-15) |

> Mapa técnico do código como ele está. Use como ponto de partida para os
> `plan.md` das features novas.

## 1. Stack

| Item | Versão |
| --- | --- |
| Expo SDK | 54 (`expo` 54.0.x) |
| React Native | 0.81.5 |
| React | 19.1 |
| react-native-web | 0.21 |
| TypeScript | 5.9, `strict` |
| Módulos Expo | audio, camera, clipboard, document-picker, glass-effect, haptics, image-picker, speech, status-bar |
| Outros | react-native-svg, react-native-safe-area-context |

Sem biblioteca de navegação, de estado global, de testes ou de lint. ~26,7 mil
linhas em `src/`.

## 2. Inicialização e navegação

```text
index.ts → App.tsx
  ├─ fase 'login' → LoginScreen
  └─ fase 'main'  → MainApp (lazy)
                     └─ AppShell (barra inferior, gesto de voltar)
                          ├─ insights      → HomeScreen
                          ├─ auria         → AuriaScreen
                          ├─ tasks         → TasksScreen
                          ├─ integrations  → IntegrationsScreen
                          └─ settings      → abre AuriaSettingsModal
```

- Navegação própria: aba ativa + pilha de histórico em `App.tsx`.
  Abas definidas em `src/data/productNavigation.ts`.
- `NavigateFn(tab, { prompt })` permite abrir a Auria com pergunta pronta.
- Telas carregadas com `lazy()`; transição entre abas em
  `src/components/navigation/ProductTabTransition.tsx`.

## 3. Estado e dados por área

| Área | Estado | Fonte dos dados |
| --- | --- | --- |
| Login | `useState` local | — |
| Insights | stores de módulo com `useSyncExternalStore` (`src/data/insights/homeLayout.ts`, `auriaAcceptance.ts`) + seletores puros (`selectors.ts`) | mocks em `src/data/insights/` |
| Auria | reducer em `src/features/auria/useAuriaWorkspace.ts` | mocks em `src/data/auria*.ts`; notícias reais em `src/features/auria/newsService.ts` |
| Discover | `useDiscoverFeed.ts` (cache por categoria), `discoverPrefsStore.ts` | RSS BBC/Guardian → Spaceflight News API → `auriaDiscoverFallback.ts`. No web usa o proxy público `corsproxy.io` |
| Tasks | `useState` em `TasksScreen.tsx` (overrides sobre o mock) | `src/data/tasksMockData.ts` |
| Integrations | `src/features/integrations/useMailbox.ts` | `src/data/integrationsMockData.ts`, `mailWorkspaceMockData.ts` |
| Tema | `src/theme/ThemeContext.tsx` (`light`/`dark`/`system`) | — |

Nada é persistido: não há AsyncStorage nem localStorage.

## 4. Design system

- Tokens: `src/theme/aatosTheme.ts` (cores light/dark, sombras), `spacing.ts`,
  `typography.ts`, `auriaTypography.ts`, `motion.ts`, `myceoCornerRadius.ts`,
  `auriaIconTokens.ts`. Acesso via `useTheme()` → `theme`, `ds`, `insights`, `isDark`.
- Liquid Glass: `src/theme/liquidGlass.ts` + `src/components/ui/LiquidGlassSurface.tsx`.
  Nativo só no iOS 26+ (`expo-glass-effect`); CSS com blur no web; cor sólida no resto.
- Fonte: sistema no iOS/Android, DM Sans no web (`src/theme/webFont.ts`).
- Ícones SVG próprios em `src/components/icons/`.

## 5. Código específico de plataforma

| Onde | O quê |
| --- | --- |
| `src/features/auria/useMicLevel.native.ts` / `useMicLevel.ts` | nível do microfone: expo-audio vs Web Audio |
| `src/features/auria/useWebSpeech.ts` | transcrição de voz, só web (`pt-PT`) |
| `src/features/auria/newsService.ts` | proxy CORS só no web |
| `src/utils/haptics.ts` | expo-haptics no nativo, `navigator.vibrate` no web |
| `src/theme/liquidGlass.ts` | detecção do Liquid Glass |

## 6. Verificação da constituição (situação atual)

| Princípio | Atende? | Desvio | Tarefa |
| --- | --- | --- | --- |
| I. Spec primeiro | — | Código anterior às specs | Esta baseline |
| II. Multiplataforma | 🟡 | Voz só transcreve no web; `app.json` sem textos de permissão de câmera/fotos | T005, spec futura |
| III. Design system | 🟡 | ~170 cores hexadecimais fora de `src/theme` (TaskCard, Auria camera/voz/imagem, Mail) e Login fora do tema | T013 |
| IV. Dados atrás de uma camada | ❌ | ~38 arquivos de tela/componente importam `src/data/*` direto | T009–T011 |
| V. Acessibilidade | 🟡 | Auria revisada; Insights, Tasks e Mail não | T014 |
| VI. Qualidade verificável | ❌ | Sem testes, lint ou CI | T001–T004 |
| VII. Simplicidade | 🟡 | 11 arquivos com mais de 500 linhas (maior: `AuriaNewProjectModal.tsx`, 858) | dividir quando a feature tocar o arquivo |

## 7. Riscos conhecidos

- **Proxy público no web** (`corsproxy.io`): dependência de terceiro sem SLA;
  some quando houver backend próprio de notícias.
- **Dados pessoais com aparência real** em `AuriaSettingsModal.tsx` e
  `integrationsMockData.ts` (RNF-06).
- **Identidade inconsistente**: "Marta" na maior parte do app, outro nome e
  e-mail no Compose.
- **AGENTS.md citava docs do SDK 56** com o SDK 54 instalado; corrigido para
  apontar à versão instalada até o upgrade (T006).
