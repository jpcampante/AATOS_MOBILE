# Registro de decisões — AATOS Mobile

Memória fiel das decisões tomadas no projeto, em ordem cronológica. Cada item
diz **o que** foi decidido, **por quê** e **onde** isso está aplicado.
Decisões novas entram no fim, com data.

> Regra: se uma decisão mudar, não apague a antiga — marque como
> **Substituída por D-xx** e registre a nova.

---

## 2026-10-15 — Repositório, processo e plataforma

### D-01 · Histórico do `main` alinhado ao remoto
- **Decisão:** o `main` local tinha divergido do `origin/main` (mesmos commits
  com hashes diferentes). Foi feito `reset --hard origin/main`, depois de
  confirmar que o conteúdo era idêntico.
- **Por quê:** evitar um merge com 86 commits duplicados.

### D-02 · Limpeza de arquivos desnecessários
- **Decisão:** removidos componentes órfãos (`AuriaGlassButton`,
  `AuriaLogoMark`, `PlaceholderModuleScreen`), `assets/splash-icon.png`, notas
  de sessão (`HANDOVER.md`, catálogo do MyCEO), helpers do Expo Go
  (`expo-go-*.html`, `start-expo-*.ps1`, `EXPO_GO_SETUP.md`), referência iOS
  (`IOS-LIQUID-GLASS.md`, `ios-reference/`), `.claude/mobile-preview`, as pastas
  locais `web-reference/` e `CONNECT_PHONE.txt`, o script `start:remote`,
  `web:tunnel` e a dependência `@expo/ngrok`.
- **Commit:** `837db0c`.

### D-03 · Só duas branches permanentes — **Substituída por D-23**
- **Decisão:** `main` (estável) e `develop` (integração). Trabalho em
  `feature/NNN-slug` (a partir de `develop`) ou `fix/…`. Nunca commitar direto
  na `main`.
- **Onde:** [specs/README.md](../specs/README.md), [AGENTS.md](../AGENTS.md).

### D-04 · Spec-Driven Development (SDD)
- **Decisão:** toda feature segue **spec → plano → tarefas → implementação**.
- **Estrutura:** `specs/constitution.md` (princípios), `specs/README.md`
  (fluxo), `specs/templates/`, uma pasta por feature (`specs/NNN-slug/`) e
  `specs/000-baseline/` (o app como era em 15/10).
- **Comandos do Claude Code:** `/sdd-specify`, `/sdd-plan`, `/sdd-tasks`,
  `/sdd-implement` em `.claude/commands/`.
- **Idioma:** specs em português; código e identificadores em inglês.

### D-05 · Documentação do Expo pela versão instalada
- **Decisão:** o AGENTS.md mandava ler a doc do SDK 56, mas o instalado é o
  **SDK 54**. Passou a apontar para a doc da versão instalada; o upgrade para
  56 virou a tarefa T006 da baseline.

### D-06 · Produto só para Android
- **Decisão:** o app é **só Android**. iOS fora do escopo (o desenvolvimento é
  em Windows, sem simulador de iPhone). O web fica só como preview de
  desenvolvimento.
- **Onde:** princípio II da [constituição](../specs/constitution.md) (v2.0.0),
  [AGENTS.md](../AGENTS.md). O script `ios` saiu do `package.json`.

### D-07 · Ambiente Android no Windows
- **Decisão:** Windows Hypervisor Platform ativado; Android Studio em
  `D:\Android`; SDK em `D:\AndroidSdk`; emuladores em `D:\AndroidAvd` (o `C:`
  tem pouco espaço). Emulador padrão: `Medium_Phone_API_37.0` (Android 17,
  Google Play, x86_64, 4 GB de RAM).
- **Onde:** [docs/android-emulator.md](android-emulator.md).

### D-08 · Commits e PRs sem autoria de IA
- **Decisão:** nenhum commit ou PR leva `Co-Authored-By: Claude` ou "Generated
  with Claude Code". Os dois commits antigos que tinham foram reescritos e
  enviados com force push (`main` → `837db0c`, `develop` → `840ba91` na época).
- **Onde:** Convenções do [AGENTS.md](../AGENTS.md) e [CLAUDE.md](../CLAUDE.md).

### D-09 · Comunicação em pt-BR
- **Decisão:** o assistente responde sempre em português do Brasil, inclusive
  nas mensagens de progresso.

---

## 2026-10-16 — Feature 001: login real

Spec, plano e tarefas: [specs/001-login/](../specs/001-login/spec.md).

### D-10 · Login acontece dentro do app, por código de e-mail
- **Decisão:** a pessoa informa o e-mail, recebe um **código de 6 dígitos** e
  digita no app. Sem senha e sem abrir navegador.
- **Alternativa descartada:** OAuth com PKCE abrindo as páginas do
  Authenticator numa aba do Chrome (como o `aatos` web faz).
  **Motivo:** mandar a pessoa para fora do app não é uma boa experiência.
- **Consequência:** o backend não tinha API de login, só páginas HTML. Foram
  criados endpoints novos (D-14).

### D-11 · Gmail e Outlook pessoais recebem código
- **Decisão:** no app, e-mails do Gmail e do Outlook **não** são desviados
  para o Google ou a Microsoft; recebem código como qualquer e-mail.
- **No web nada muda:** lá eles continuam indo para o provedor.

### D-12 · Empresas com SSO obrigatório continuam bloqueadas
- **Decisão:** domínio verificado com SSO obrigatório **não** recebe código
  (resposta `sso_required`). O app mostra "sua empresa exige entrar pela
  Microsoft/Google". Login por SSO no app fica para uma fase futura.
- Contas gerenciadas e desativadas também não recebem código (`not_allowed`).

### D-13 · Cadastro pelo app respeita a regra de convite
- **Decisão:** e-mail sem conta → o app pede o nome → código → a conta é criada
  com o e-mail já verificado. Se o cadastro estiver fechado (whitelist sem
  convite ou aprovação), resposta `signup_closed`.

### D-14 · Endpoints novos no Authenticator, sem mexer no web
- **Decisão:** no `myceo-authenticator` foram criadas duas rotas novas:
  - `POST /auth/mobile/code/request/` `{client_id, email, full_name?}`
  - `POST /auth/mobile/code/verify/` `{client_id, challenge_id, code}` →
    mesmos tokens do `/auth/token/`
- **Só código novo:** modelo `MobileLoginChallenge` (migração `0022`), serviço
  `authentication/services/mobile_code_login.py`, views
  `authentication/views/mobile_code.py`, 25 testes.
- **Reaproveitado sem alterar:** `choose_provider(email, "email")`,
  `signup_is_allowed` / `reserve_signup_authorization`,
  `generate_tokens_for_user_and_app`, `sync_user_session` e o modelo de e-mail
  `account/email/login_code`.
- **Segurança:** só o HMAC do código vai para o banco; o código vale 5 minutos,
  aceita 3 tentativas e é de uso único. O reenvio só é liberado depois de 30
  segundos, com no máximo 5 envios por hora. Há limites por IP e por e-mail,
  com chaves de cache próprias (`mobile-code:*`).
- **O código vale como aprovação do dispositivo:** a `UserSession` do celular
  já nasce verificada, então a renovação e o "sair de todos os dispositivos"
  funcionam como no web.
- **Prova de que o web não mudou:** a suíte do Authenticator tinha 957 testes
  verdes antes e ficou com 982 depois, verde no Django 6.1 e no 5.2.18 (a
  versão da produção).

### D-15 · Fluxo de branches do backend e deploy real
- **Decisão do time:** no `myceo-authenticator` trabalha-se na `dev`, testa-se
  e depois vai para a `main`.
- **Descoberta:** desde 10/10/2026 o endereço
  `authenticator-dev.mydailyceo.com` é servido pelo **mesmo servidor da
  produção**. O push na `dev` não implanta nada; o deploy efetivo é o da
  `main`.
- **Decisão:** com aprovação explícita, levamos para a `main`
  (merge `1597879`, "Merge dev para a main: …").
- **Cuidado:** a cópia local do backend tinha mudanças não commitadas de
  outra pessoa. Todo o trabalho foi feito em worktrees separadas
  (`D:\REPOS\Backend\_wt\mobile-code-login` e `_wt\main-mobile-code`).

### D-16 · Registro do app no Authenticator pelo arquivo canônico
- **Decisão:** o app "AATOS Android" foi registrado em
  `deploy/client_apps.json` do Authenticator, e o deploy cria a app sozinho.
  - `client_id`: `myceo_app_aatos_android` (público, não é segredo);
  - cliente público, sem callbacks e sem client secret;
  - `hidden: true`, para não aparecer no carrossel de apps.
- **No app:** é o valor padrão de `EXPO_PUBLIC_MYCEO_CLIENT_ID`.

### D-17 · Sessão no app
- **Armazenamento:** tokens só no `expo-secure-store`, nunca em
  armazenamento comum.
- **Renovação:** feita com o `refresh_token`, uma por vez, porque o refresh é
  rotativo.
- **Quando a sessão cai:** só com 400/401 + `invalid_refresh_token`,
  `invalid_grant` ou `invalid_request`. Falta de rede, 5xx e 429 **não**
  desconectam ninguém.
- **Ao voltar ao primeiro plano:** `GET /auth/session/check/`. Se der 401, o
  app mostra "Your session ended".
- **Logout:** `POST /auth/account/sessions/current/logout/`, e a sessão local é
  apagada mesmo se a chamada falhar.
- **Dispositivo:** o `User-Agent` é `AATOS-Android/1.0 (<modelo>; Android <versão>) install/<id>`,
  para cada celular ser um dispositivo próprio na lista de sessões.
- **Usuário:** nome, e-mail e foto vêm das *claims* do JWT, sem depender do
  `/auth/@me/`, que exige permissão de admin. A fonte única no app é
  `useCurrentUser()`, que substituiu "Marta" em todo o app.
- **Código:** `src/features/auth/`.

### D-18 · Ambientes do app
- **Decisão:** a URL do Authenticator e o `client_id` vêm de
  `EXPO_PUBLIC_MYCEO_AUTH_URL` e `EXPO_PUBLIC_MYCEO_CLIENT_ID` (ver
  `.env.example`). O padrão é `https://authenticator-dev.mydailyceo.com` +
  `myceo_app_aatos_android`.
- **Para testar contra um Authenticator local:** criar `.env.local` (ignorado
  pelo git) e rodar `adb reverse tcp:<porta> tcp:<porta>`.

### D-19 · Testes no app
- **Decisão:** Jest com `jest-expo` (`npm test`). Testes da lógica pura de auth
  (JWT, sessão, mensagens). Obrigatório: `npm run typecheck` e `npm test`
  verdes antes de commitar.

### D-20 · Textos da interface continuam em inglês
- **Decisão:** a interface já estava em inglês. As telas novas de login
  seguiram o mesmo idioma. A língua final da interface ainda está em aberto
  (seção 7 da [baseline](../specs/000-baseline/spec.md)).

---

## 2026-10-20 — Entrega da 001

### D-21 · 001 verificada em produção
- **Decisão:** a pessoa usuária fez login no emulador com o próprio e-mail,
  contra o Authenticator real; o código chegou e ela entrou no app. A spec
  001 foi marcada como **Implementada**.

### D-22 · PR do app adiado — **Substituída por D-24**
- **Decisão:** a branch `feature/001-login` está no GitHub, mas o PR para a
  `develop` **ainda não** foi aberto, por decisão da pessoa usuária.

---

## 2026-10-20 — Fluxo de branches e planejamento da 002 (Auria real)

### D-23 · Só `develop` e `main`, sem branches de feature
- **Decisão:** não se criam mais branches `feature/…` nem `fix/…`. Todo
  trabalho é commitado na `develop`; a `main` só recebe merge da `develop`.
- **Por quê:** pedido da pessoa usuária; o projeto tem uma pessoa
  desenvolvendo e o PR por feature não estava sendo usado.
- **Onde:** [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md),
  [specs/README.md](../specs/README.md), comandos `/sdd-specify` e
  `/sdd-implement`, modelo de spec (commit `f525d4f`).

### D-24 · 001 mergeada na `develop`
- **Decisão:** a `feature/001-login` foi mergeada direto na `develop` (sem PR),
  com typecheck e 23 testes verdes depois do merge. A branch
  `feature/001-login` fica só como histórico.

### D-25 · Spec 002: Auria real com o mesmo backend da web
- **Decisão:** a Auria do app passa a usar o backend `aatos-auria` (servido pelo
  `aatos-system` em `/auria/...`), o mesmo da web, com o JWT da 001.
  Spec, plano (inventário de 56 endpoints, um a um) e tarefas em
  [specs/002-auria-real/](../specs/002-auria-real/spec.md), status **Rascunho**.
- **Contrato de referência:** o que está em produção — o `aatos-system` `main`
  fixa o `aatos-auria` no commit `6567791` (17/10). A cópia local
  `D:\REPOS\Backend\aatos-auria` (`dev` de 29/09) está desatualizada.
- **Motor:** `POST /auria/system_llm/chat?stream=1` (SSE por POST, com
  ferramentas). O motor antigo `/auria/generate` não é usado.
- **Backend:** nenhuma mudança prevista. O backend não confere `aud` nem
  `client_id` do token, então o token do app deve ser aceito (a confirmar na
  tarefa P002).
- **Interface:** continua em inglês (D-20).
- **Respostas da pessoa usuária (mesmo dia):**
  - servidor de **produção** (`pilarone.mydailyceo.com`, billing em `settings.mydailyceo.com`);
  - seletor de modelo vira Rápido/Profundo; voz e pincel ocultos; modelos de
    documento viram pedidos à Auria;
  - documentos **só leitura** por enquanto;
  - quando os créditos acabam, o app **bloqueia o envio antes** e avisa em inglês (sobe para a P1).
  Detalhes: D-05 a D-08 da [spec 002](../specs/002-auria-real/spec.md).

### D-26 · Spec 002 aprovada, entrega em duas versões
- **Decisão:** a ordem P1 → P2 → P3 foi aprovada. A **v1** (P1 + P2: conversa
  real, trabalho da Auria, histórico, anexos, erros e créditos, tentar de
  novo/editar, busca na web, imagens e documentos só leitura) vai para a
  `main` e para as pessoas. A **v2** (P3: projetos, compartilhar conversas,
  menções, fontes, escopos e biblioteca) vem depois.
- **Consequência:** na v1, os painéis que ainda não têm dados reais
  (Projetos, Galeria, busca simulada) ficam ocultos, para não mostrar dados
  falsos.
- **Onde:** D-09 da [spec 002](../specs/002-auria-real/spec.md) e as fases do
  [tasks.md](../specs/002-auria-real/tasks.md).

### D-27 · Fase 0 da 002: o que já foi provado
- **Servidor de produção aceita o token do app:** `GET pilarone.mydailyceo.com/auth/whoami/` → 200.
  A lista de conversas de conta nova devolve 404 (vira lista vazia). O billing
  (`settings.mydailyceo.com`) aceita o mesmo token.
- **Não mandar `Accept: text/event-stream`** no `system_llm/chat`: o backend só
  tem o renderizador JSON e responde 406.
- **Conta sem plano** recebe 402 `insufficient_units` / `no_active_plan`
  (`subscription: null`, `balance: null` no billing): é o caso que a A044 bloqueia.
- **Pendente:** provar o streaming e o "Parar" (P003) com uma conta que tenha
  plano ativo; a conta de teste `api.tipscode.teste@gmail.com` não tem plano.
- **Biblioteca de Markdown (P004):** `react-native-marked`, escolhida pela
  pessoa usuária (mantida, JS puro, tabelas GFM, roda no Expo Go).

### D-28 · O app é só a Auria (spec 003)
- **Decisão:** saem Insights, Tasks e Integrations (telas, componentes, dados,
  testes). A barra de navegação fica com **Auria** e **Perfil**; o app abre na
  Auria e o voltar do Android leva de volta a ela.
- **Perfil:** só o que funciona: foto/iniciais, nome, e-mail, tema
  (Claro/Escuro/Sistema), interesses do Discover e Log out. O modal de Ajustes
  antigo, cheio de opções simuladas, saiu.
- **Consequências:** baseline T010 sem objeto; T004, T009, T013 e T014 ficaram
  só com a Auria; tarefa A015 da 002 removida.
- **Onde:** [specs/003-app-so-auria/](../specs/003-app-so-auria/spec.md).

---

## Pendências em aberto

| Item | Onde |
| --- | --- |
| Spec 002: provar o streaming (P003) com uma conta que tenha plano; depois seguir a fundação (A001…) | [tasks 002](../specs/002-auria-real/tasks.md) |
| Trocar a `internalServiceKey` commitada em `Frontend_Myceo_Example_Authenticator/config.json` | backend |
| Se a chave RSA do `.env.test` local do backend for usada em algum ambiente real, trocá-la (ela foi exibida por engano numa sessão) | backend |
| Apagar as worktrees `_wt/mobile-code-login` e `_wt/main-mobile-code` e o SQLite de teste delas | máquina local |
| Dúvidas de produto: backend dos dados, idioma da interface, Play Store ou interno (LLM da Auria: respondido pela D-25) | [baseline §7](../specs/000-baseline/spec.md) |
| Tarefas da baseline ainda abertas: ESLint (T002), CI (T003), testes (T004), permissões (T005), SDK 56 (T006), tema automático (T007), camada de dados (T009–T011), tokens de cor (T013), acessibilidade (T014) | [baseline tasks](../specs/000-baseline/tasks.md) |
| Aviso do Expo: `expo@54.0.35`, esperado `~54.0.37` | `package.json` |
| Fase 2 do login: botões nativos Google/Microsoft e SSO empresarial | spec futura |
