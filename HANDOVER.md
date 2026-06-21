# Handover — AATOS Mobile (sessão anterior)

> Cola este ficheiro no próximo chat. Resume tudo o que foi feito e o estado atual.

## 1. Projeto

- **App:** AATOS Mobile — Expo SDK 54 / React Native 0.81, em
  `/Users/joaocampante/Downloads/REPOS/AATOS_REBRANDING_MOBILE`
- **Repo:** `github.com/jpcampante/AATOS_REBRANDING_MOBILE`, branch `main`.
- ⚠️ A sessão do Claude Code está enraizada noutra pasta
  (`/Users/joaocampante/Downloads/REPOS/myceo_auth_receiver`), por isso comandos
  precisam de caminhos absolutos para o AATOS.
- Há 3 pastas "aatos" em REPOS: só `AATOS_REBRANDING_MOBILE` é a app mobile.
  `aatos` e `AATOS_NEW_BRAND` são apps web (Vite) antigas — ignorar.

## 2. Como correr (conhecimento ganho à força)

### Painel web do Claude (preview)
- O preview do Claude lê `.claude/launch.json` da **pasta da SESSÃO**
  (`myceo_auth_receiver/.claude/`), NÃO da pasta do AATOS. Config usado lá:
  `runtimeExecutable:"sh"`, args `["-c","cd <ABS_AATOS> && exec npx expo start --web --localhost --port 8083"]`, port 8083.
  Depois `preview_start("aatos-mobile-web")`.
- O preview MCP é instável: por vezes "perde" o servidor (diz "No running servers")
  mesmo com o processo expo vivo. Verificar com `lsof -i tcp:8083`.
- O `.claude/launch.json` DENTRO do AATOS está em port 8084 (editado pelo user) —
  não reverter; é separado do que o preview da sessão usa.

### Expo Go no telemóvel (o que o user realmente usa)
- Telemóvel em **4G / hotspot do iPhone** → descoberta LAN do Expo Go NÃO funciona.
  **Usar sempre `--tunnel`**: `cd <ABS_AATOS> && npx expo start --tunnel --port 8082 --clear`
- Em modo headless o Expo NÃO imprime o URL `exp://…exp.direct`. Obter via ngrok:
  `curl -s http://localhost:4040/api/tunnels`
- Gerar QR scannável: `npx --yes qrcode -t svg -o /tmp/qr.svg "exp://…"` e mostrar
  inline com a tool de visualização.
- O Expo Go acumula "Recently opened" (vários "AATOS Mobile") — entradas velhas/
  túneis mortos. Dizer ao user para **CLEAR** e fazer scan só do QR vivo.

## 3. Gotchas críticos (causas-raiz que já custaram tempo)

1. **"App mostra versão antiga / não sincronizado"** → PRIMEIRO verificar git:
   `git fetch && git status -sb` + `git log HEAD..origin/main`. Numa sessão o local
   estava **30 commits atrás** de origin/main — não era cache nenhuma.
   Fast-forward: `git stash` (o expo escreve `bundleIdentifier` no app.json) →
   `git merge --ff-only origin/main` → `npm install` → reiniciar Metro.
2. Antes de "limpar cache" do lado do telemóvel, descartar a hipótese git acima.
3. `expo-audio` é dependência (voice mode) e está incluída no Expo Go.

## 4. Tarefa em curso — redesenho do composer (estilo Claude)

**Estado: implementado e revisto, mas NÃO commitado.**

Objetivo: input da Auria igual ao Claude iOS — 2 linhas (texto em cima, ações por
baixo), pílula de modelo que abre sheet "Select model" com LLMs OpenAI/Claude/Gemini,
cantos iguais.

Feito:
- `src/data/auriaModels.ts` (NOVO) — catálogo: Claude (Opus 4.8 default, Sonnet 4.6,
  Haiku 4.5, Fable 5 indisponível-no-fim), OpenAI (GPT-5.1, GPT-5, GPT-5 mini),
  Gemini (Gemini 3 Pro, 3 Flash, 2.5 Pro).
- `src/components/auria/AuriaModelSheet.tsx` (NOVO) — sheet agrupado por marca,
  check azul (`ds.auriaBlue`), linha "Currently unavailable", footer Effort:Max +
  More models. Espelha o padrão de `AuriaGallerySheets.tsx`.
- `src/components/auria/AuriaComposer.tsx` — layout em coluna (2 linhas), pílula de
  modelo + tag de effort, botões circulares (+, mic, send). Outer radius
  `MYCEO_CORNER_RADIUS.panel` (28).
- `src/components/auria/auriaLayout.ts` — `AURIA_COMPOSER_TOOLBAR_HEIGHT` 52 → 92.
- `src/features/auria/useAuriaWorkspace.ts` — estado `selectedModel` no reducer
  (action `set-model`, default `DEFAULT_MODEL_ID`, setter `setSelectedModel`).
- `src/screens/AuriaScreen.tsx` — `modelPickerOpen`, `activeModel`, props no
  `<AuriaComposer>` e render do `<AuriaModelSheet>`.

Verificação: `npx tsc --noEmit` = 0 erros (no AATOS). Revisão adversarial (workflow)
corrigiu: Fable 5 movido para o fim; press da pílula usa `ds.gray200`; `borderCurve`
no topo do sheet; chevron menor.

Não resolvido / opções abertas:
- Botão de envio usa `ds.offBlack` → inverte em dark mode (app arranca em light;
  é a convenção existente). Tornar fixo em ambos os modos se o user quiser.
- Verificação VISUAL ficou por fazer: o preview web não passa do Login (cliques
  sintéticos não disparam `onPress` do react-native-web; o MCP perde o servidor).
  Validado por typecheck + revisão de código. Confirmar no telemóvel.

## 5. Estado runtime AGORA (pode mudar)

- git AATOS: HEAD `e103035` (= origin/main). Working tree com as mudanças do composer
  (4 ficheiros M + 2 novos), **por commitar**. Existe `git stash@{0}` (auto bundleId/lock).
- Porta 8083 (web) viva; **túnel 8082 está DOWN** (precisa novo `npx expo start --tunnel`).

## 6. Próximos passos sugeridos

1. Reabrir o túnel e confirmar o composer no telemóvel (Auria tab → input → tocar na
   pílula do modelo → sheet).
2. Se aprovado: `git add` dos ficheiros do composer + commit (NÃO commitar HANDOVER.md
   nem o stash). Push para `main` só com OK do user.
3. Ajustar modelos em `auriaModels.ts` se necessário (são só dados).
