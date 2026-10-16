# Tasks — 001 Login por código de e-mail

Spec: [spec.md](./spec.md) · Plano: [plan.md](./plan.md)

## Convenções

- `[ ]` pendente · `[~]` em andamento · `[x]` concluída
- `[P]` = pode rodar em paralelo com outras `[P]` da mesma fase
- Backend: `D:\REPOS\Backend\myceo-authenticator`, branch `dev` (worktree separada)
- App: este repositório, branch `feature/001-login`
- Um commit por tarefa, sem atribuição de IA

## Fase 1 — Backend: preparação

- [ ] B001 Worktree sobre `origin/dev` atualizado; ambiente Python; rodar a suíte atual e registrar a linha de base — RNF-03

## Fase 2 — Backend: núcleo

- [ ] B002 Modelo `MobileLoginChallenge` + migração (tabela nova) — `authentication/models/mobile_code.py` — RF-02
- [ ] B003 Serviço `mobile_code_login`: política (`choose_provider(..., "email")`, conta gerenciada/desativada, `signup_is_allowed`), gerar/hash/verificar código, limites por IP/e-mail com chaves próprias — `authentication/services/mobile_code_login.py` — RF-02..RF-05, RNF-01
- [ ] B004 Testes do serviço: política (conta, Gmail, SSO obrigatório, gerenciada, desativada, cadastro aberto/fechado), código (certo, errado, expirado, 3 tentativas, uso único, reenvio) — `authentication/tests_mobile_code_login.py`

**Checkpoint:** testes do serviço verdes.

## Fase 3 — Backend: API

- [ ] B005 E-mail do código com a marca atual — `templates/account/email/mobile_login_code*` — RNF-07
- [ ] B006 Views `request` e `verify` + 2 rotas; emissão de tokens com `generate_tokens_for_user_and_app`; sessão de dispositivo verificada via `sync_user_session`; criação de conta no cadastro — `authentication/views/mobile_code.py`, `authentication/urls.py` — RF-01, RF-04, RF-12
- [ ] B007 Testes de API ponta a ponta: contratos e erros, `client_id` inválido, 429, tokens renovam em `/auth/token/` sem `unverified_device`, logout global derruba a sessão

**Checkpoint:** suíte completa do Authenticator verde (linha de base + testes novos).

## Fase 4 — Backend: entrega em dev

- [ ] B008 Push para `origin/dev` (deploy dev) — com aprovação do usuário
- [ ] B009 Registrar o `ClientApp` público "AATOS Android" no dev — precisa de admin

## Fase 5 — App: fundação

- [ ] T001 Jest com `jest-expo` + script `npm test` (tarefa T001 da baseline)
- [ ] A001 `expo-secure-store`; `.env.example` com `EXPO_PUBLIC_MYCEO_AUTH_URL` e `EXPO_PUBLIC_MYCEO_CLIENT_ID` — `src/features/auth/config.ts`
- [ ] A002 [P] `types.ts`, `jwt.ts` (claims → `AuthUser`) com testes — RF-10
- [ ] A003 [P] `authApi.ts` (`requestCode`, `verifyCode`, `refresh`, `checkSession`, `logout`) — RF-01
- [ ] A004 `tokenStore.ts` + `session.ts` (renovação com fila única, regra de derrubar sessão) com testes — RF-06..RF-08
- [ ] A005 `AuthProvider` + `useAuth()`; `authFetch.ts`

**Checkpoint:** testes de jwt e sessão verdes.

## Fase 6 — App: telas

- [ ] A006 `CodeInput` (6 caixas, colar, autofill) — `src/components/auth/CodeInput.tsx` — RNF-06
- [ ] A007 `LoginScreen`: Continuar com e-mail → e-mail → (nome) → código; mensagens de erro; remove Apple/Google — RF-01..RF-05, RF-11
- [ ] A008 `App.tsx` com fase vinda de `useAuth().status`; aviso "Sua sessão terminou" — RF-06..RF-08
- [ ] A009 Ajustes: nome/e-mail/foto reais e "Log out"; saudação de Tasks com o primeiro nome — RF-09, RF-10

## Fase 7 — Verificação

- [ ] V001 Emulador contra o backend dev: todos os critérios de aceite da spec (H1–H6)
- [ ] V002 `npm run typecheck` e `npm test` verdes; spec → **Implementada**
- [ ] V003 Backend: levar `dev` → `main` depois do seu ok
