# Constituição — AATOS Mobile

Versão 2.0.0 · Ratificada em 2026-10-15

| Versão | Mudança |
| --- | --- |
| 2.0.0 | Princípio II redefinido: de "multiplataforma" para "Android primeiro"; iOS fora do escopo, web só para desenvolvimento |
| 1.0.0 | Versão inicial |

Estes princípios valem para todo o código e para toda spec, plano e tarefa.
Quando um plano precisar violar um deles, a violação é registrada na seção
"Exceções à constituição" do `plan.md`, com a justificativa.

## I. Spec primeiro

Nenhuma feature nova ou mudança de comportamento começa pelo código.
O fluxo é sempre **spec → plano → tarefas → implementação**
(ver [specs/README.md](./README.md)). Correções pequenas de bug e ajustes
visuais sem mudança de comportamento podem ir direto, com commit descritivo.

## II. Android primeiro

O produto é **só Android** (decisão de 2026-10-15). O app precisa abrir no
**Expo Go** e é verificado no emulador Android
(ver [docs/android-emulator.md](../docs/android-emulator.md)).

- **iOS está fora do escopo.** Não se cria trabalho específico de iOS; o código
  de iOS que já existe (ex.: Liquid Glass) pode ficar, mas não é requisito nem
  é testado.
- **Web é só ferramenta de desenvolvimento** (preview rápido). Não é plataforma
  do produto: uma feature está pronta quando funciona no Android, mesmo que
  degrade no web.
- Toda API de dispositivo (câmera, microfone, voz, haptics, pickers) precisa
  funcionar no Android.
- Diferenças de plataforma ficam em arquivos `.native.ts` / `.web.ts` ou em
  checagens `Platform.OS` localizadas, nunca espalhadas pelas telas.
- Módulos nativos fora do Expo Go só entram com decisão registrada no plano.

## III. Design system é a fonte da verdade

- Cores, tipografia, espaçamento, raios e movimento vêm de `src/theme`.
  Nada de cor hexadecimal solta em componente.
- Light e dark mode funcionam em toda tela nova.
- Componentes reutilizáveis ficam em `src/components/ui`; ícones em
  `src/components/icons`.

## IV. Dados atrás de uma camada

- Telas e componentes não importam mocks diretamente: consomem hooks ou
  serviços da área (`src/features/<area>`).
- Tipos de domínio ficam em `types.ts` da área.
- Trocar mock por API real não pode exigir mudança nas telas.
- Segredos (chaves de API) nunca vão para o repositório nem para o bundle do app.

## V. Acessibilidade

- Todo controle só com ícone tem `accessibilityLabel` e `accessibilityRole`.
- Alvos de toque têm no mínimo 44×44 pt.
- Texto respeita contraste WCAG AA nos dois temas.

## VI. Qualidade verificável

- `npm run typecheck` sem erros é obrigatório antes de qualquer commit.
- Toda regra de negócio nova (reducers, seletores, formatação, lógica pura)
  tem teste unitário.
- Cada critério de aceite da spec é verificado: por teste automatizado ou por
  um passo manual descrito em `tasks.md`.
- Uma tarefa só é marcada `[x]` depois de verificada.

## VII. Simplicidade

- Resolver com o que o Expo SDK e o React Native já oferecem antes de adicionar
  dependência. Toda dependência nova é justificada no plano.
- Sem abstração especulativa: só generalizar quando houver o segundo uso real.
- Componentes acima de ~400 linhas são candidatos a divisão.

## Governança

- Esta constituição prevalece sobre preferências individuais e sobre specs.
- Emendas: PR que altera este arquivo, com o motivo e o impacto nas specs
  existentes. Versão segue SemVer: princípio removido ou redefinido = MAJOR,
  princípio novo = MINOR, redação = PATCH.
- Revisões de PR verificam conformidade com estes princípios.
