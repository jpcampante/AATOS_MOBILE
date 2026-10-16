# Plan — 001 Login real

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Rascunho — aguardando decisões D1–D4 |
| Data | 2026-10-16 |

## 1. Resumo técnico

O app vira um **cliente OAuth 2.0 público com PKCE** do MyCEO Authenticator,
igual ao app web `aatos`. O login acontece nas páginas do próprio Authenticator,
abertas numa **Custom Tab do Chrome** (`expo-web-browser`). O Authenticator
devolve um `code` para o app, que troca por tokens JWT. Os tokens ficam no
`expo-secure-store` e são renovados com o `refresh_token`. Nenhuma senha passa
pelo código do app.

## 2. Como o login funciona hoje (levantamento)

### Backend — `D:\REPOS\Backend\myceo-authenticator` (Django + allauth)

| Ponto | Como é | Arquivo |
| --- | --- | --- |
| Hosts | dev `https://authenticator-dev.mydailyceo.com` · prod `https://authenticator.mydailyceo.com` | `myceo/settings.py` |
| Login/cadastro | **Só por páginas HTML** do servidor. Não há API JSON de login ou cadastro | `authentication/urls.py` (TokenLoginView comentada) |
| Fluxo de entrada | E-mail primeiro: o servidor escolhe senha, código por e-mail, Google ou Microsoft (gmail.com → Google, outlook/hotmail/live → Microsoft, SSO de domínio etc.) | `views/discovery.py`, `services/auth_discovery.py` |
| Google/Microsoft | Feitos pelo servidor. Entrar direto em `/accounts/google/login/` dá 403 sem o passo do e-mail. Login por token do Google está fechado (403) | `views/discovery.py` |
| Cadastro | `/accounts/signup/`; verificação de e-mail obrigatória (código, 10 min); pode estar restrito a convidados (`/auth/signup-blocked/`) | `services/signup_access.py` |
| Início do OAuth | `GET /auth/authorize/?client_id&code_challenge&scope&state&requester_url` → `{redirect_url}` (caminho relativo se não logado) | `views/oauth.py` |
| Retorno | `/auth/redirect_app/` faz 302 para `<callback>?code&state`. `requester_url` tem de ser a **origem** de uma `CallbackURL` registrada no `ClientApp` | `views/views.py:85`, `utils.py:28` |
| Troca do code | `POST /auth/token/` `{grant_type:"authorization_code", client_id, code, code_verifier, state}` → `{access_token, refresh_token, token_type, expires_in, scope}` | `views/oauth.py` |
| Renovação | `POST /auth/token/` `{grant_type:"refresh_token", refresh_token}`. Refresh **rotativo** (o antigo morre). Erro 401 `invalid_refresh_token` + `reason` | `views/oauth.py` |
| Tokens | JWT RS256. Access ~4 h (código) · refresh 14 dias. Claims: `user_id`, `public_uid`, `email`, `name`, `given_name`, `family_name`, `picture`, `client_id`, `scope` | `services/tokens.py` |
| Sessão viva? | `GET /auth/session/check/` com Bearer → 200 ou 401 (respeita "sair de todos os dispositivos") | `views/session_epoch.py` |
| Logout | `POST /auth/account/sessions/current/logout/` (Bearer + `{refresh_token}`) | `views/account.py` |
| Segurança extra | Aprovação de **novo dispositivo** por e-mail antes de entregar o code | middleware / `session-pending` |
| Cliente | Cada app é um `ClientApp` com `CallbackURL`s. Cliente público não precisa de `client_secret` | `models/app.py` |
| Origin/CORS | Chamadas com Bearer e `/auth/token/` funcionam sem header `Origin` (bom para app nativo) | `middleware.py` |

### Front web — `D:\REPOS\aatos`

- `src/auth/MyCeoAuth.ts`: PKCE S256, `authorize` → redireciona → `/callback`
  recebe `code` → `/auth/token/` → tokens no `localStorage`.
- Renovação com fila única (evita corrida da rotação) e tolerância a erro
  de rede: só derruba a sessão com 400/401 + `invalid_refresh_token`,
  `invalid_grant` ou `invalid_request`.
- Usuário lido das claims do JWT; perfil completo em
  `GET {settings}/profile/@me`.
- Tratamento de erros em `src/auth/authRecovery.ts` (code expirado, aprovação
  de dispositivo, etc.).

Vamos reproduzir essa mesma lógica no app, trocando o que é de navegador
(`window.location`, `localStorage`, `crypto.subtle`, `BroadcastChannel`).

## 3. O problema central: como o login volta para o app

O Authenticator só redireciona para URLs **http/https**
(`CallbackURL.url` é `URLField` e o `redirect()` do Django recusa outros
esquemas). Um app nativo recebe o retorno por um **deep link**
(`aatos://auth/callback`, ou `exp://127.0.0.1:8081/--/auth/callback` no Expo Go).

### D1 — Opções para o retorno

| | A) Aceitar esquema do app no Authenticator **(recomendada)** | B) Página-ponte https no `aatos` web | C) Android App Links (https verificado) |
| --- | --- | --- | --- |
| Como | Mudar a validação de `CallbackURL` e o redirect para aceitar `aatos://` e `exp://` | Página estática (ex. `https://aatos.mydailyceo.com/mobile/callback.html`) recebe `code&state` e abre o deep link | `https://…/mobile/callback` abre o app direto, verificado por `assetlinks.json` |
| Mudança no backend | Pequena (validador + redirect + testes) | Nenhuma | Nenhuma |
| Outras mudanças | — | Deploy de página no web; o `state` carrega o destino (com allowlist) | `assetlinks.json` no domínio + build próprio do app |
| Funciona no Expo Go | Sim (`exp://127.0.0.1:8081` com `adb reverse`) | Sim | **Não** |
| Padrão do mercado | Sim (RFC 8252, esquema privado + PKCE) | Contorno | Sim, o mais seguro |
| Risco | Baixo | Chrome pode exigir toque para abrir o app → precisa botão "Abrir o AATOS" de reserva | Só serve para produção |

**Recomendação:** A agora; C quando houver build de produção.

### D2 — Tela de entrada (spec, dúvida 1)

O Authenticator não permite um botão que vá direto ao Google ou à Microsoft:
ele sempre pede o e-mail primeiro e decide o provedor.

- **(a) recomendada:** "Entrar" e "Criar conta". Simples, idêntico ao web.
- (b) Campo de e-mail nativo + "Continuar": abre a página já no passo certo
  (`login_hint`). Mais nativo, mais código.

Em ambos: remover "Continue with Apple".

### D3 — Registro do cliente

Criar um `ClientApp` **público** (sem segredo) "AATOS Android" no ambiente
dev, com as `CallbackURL`s da opção D1. Precisa de alguém com acesso de admin
(`/auth/admin/client-apps/` ou Django admin). O `client_id` vai para a
configuração do app (não é segredo).

### D4 — Perfil do usuário

`/auth/@me/` responde 403 sem a permissão `identity:profile:read` concedida
por admin. **Recomendação:** ler nome/e-mail/foto das claims do JWT
(sem depender de permissão) e, numa feature futura, usar
`GET {settings}/profile/@me` como o web.

## 4. Fluxo no app

```text
Tela de entrada ──"Entrar"──▶ AuthService.signIn()
  1. gera code_verifier (32 bytes) + code_challenge S256 + state   (expo-crypto)
  2. GET /auth/authorize/?client_id&code_challenge&scope&state&requester_url
  3. abre {AUTH_URL}{redirect_url} em Custom Tab                     (expo-web-browser)
        ↳ pessoa entra (senha / código / Google / Microsoft / aprova dispositivo)
        ↳ Authenticator 302 → aatos://auth/callback?code&state
  4. Custom Tab fecha; confere state
  5. POST /auth/token/ (authorization_code + code_verifier)
  6. salva tokens no SecureStore; lê usuário das claims
  7. App vai para a fase 'main'

Abertura do app ─▶ lê SecureStore ─▶ sem sessão: tela de entrada
                                   └▶ com sessão: abas + renova se perto de expirar
                                                 + /auth/session/check/ ao voltar ao primeiro plano
```

## 5. Arquitetura (arquivos)

| Arquivo | Papel |
| --- | --- |
| `src/features/auth/config.ts` | `AUTH_URL`, `CLIENT_ID`, `SCOPE`, `REDIRECT_URI` a partir de `EXPO_PUBLIC_*` |
| `src/features/auth/pkce.ts` | verifier, challenge S256, state |
| `src/features/auth/authApi.ts` | chamadas HTTP: authorize, token (code e refresh), session check, logout |
| `src/features/auth/tokenStore.ts` | leitura/gravação no `expo-secure-store` |
| `src/features/auth/jwt.ts` | decodificar claims → `AuthUser` |
| `src/features/auth/session.ts` | estado da sessão (store com `useSyncExternalStore`), renovação com fila única, expiração |
| `src/features/auth/AuthProvider.tsx` + `useAuth()` | `status` (`loading`/`signedOut`/`signedIn`), `user`, `signIn`, `signUp`, `signOut` |
| `src/features/auth/types.ts` | `AuthTokens`, `AuthUser`, `AuthError` |
| `src/features/auth/authFetch.ts` | `fetch` com Bearer e renovação automática (para as próximas features) |
| `App.tsx` | fase `login`/`main` passa a vir de `useAuth().status` |
| `src/screens/LoginScreen.tsx` | botões novos, estados de carregando/erro, remove Apple |
| `src/components/auria/AuriaSettingsModal.tsx` | dados reais + "Log out" chama `signOut` |
| `app.json` | `"scheme": "aatos"` |
| `.env.example` | variáveis `EXPO_PUBLIC_MYCEO_*` (sem valores secretos) |

Dependências novas (todas incluídas no Expo Go, instaladas com `npx expo install`):
`expo-web-browser`, `expo-crypto`, `expo-secure-store`, `expo-linking`.

## 6. Contratos

| Operação | Entrada | Saída | Erros tratados |
| --- | --- | --- | --- |
| `GET /auth/authorize/` | `client_id, code_challenge, scope, state, requester_url` | `{redirect_url}` | rede, 5xx, manutenção |
| `POST /auth/token/` (code) | `grant_type, client_id, code, code_verifier, state` | tokens | `invalid_grant`, `code_expired`, `invalid_code_verifier`, `invalid_client` |
| `POST /auth/token/` (refresh) | `grant_type, refresh_token` | tokens (refresh novo) | 401 `invalid_refresh_token` (`rotated`, `expired…`, `session_epoch`…) → sair; rede/5xx/429 → tentar de novo |
| `GET /auth/session/check/` | Bearer | 200 / 401 | 401 → sessão terminou |
| `POST /auth/account/sessions/current/logout/` | Bearer + `{refresh_token}` | 200 | falha não impede o logout local |

## 7. Verificação da constituição

| Princípio | Atende? | Observação |
| --- | --- | --- |
| I. Spec primeiro | ✅ | Esta spec + plano |
| II. Android primeiro | ✅ | Custom Tabs; funciona no Expo Go com D1-A |
| III. Design system | ✅ | Tela de entrada mantém a identidade atual |
| IV. Dados atrás de uma camada | ✅ | Tudo em `src/features/auth`; telas usam `useAuth()` |
| V. Acessibilidade | ✅ | Rótulos nos botões novos |
| VI. Qualidade verificável | ⚠️ | Depende de T001 (Jest) da baseline; testes de `pkce`, `jwt`, `session` |
| VII. Simplicidade | ✅ | Sem biblioteca de OAuth extra; reaproveita a lógica do web |

## 8. Estratégia de testes

- **Unitários:** PKCE (vetor conhecido da RFC 7636), decodificação do JWT,
  regra "quando derrubar a sessão" do refresh, fila única de renovação.
- **Manual no emulador:** cada critério de aceite da spec — senha, Gmail,
  Outlook, cadastro, cancelar, fechar o app no meio, reabrir conectado,
  logout e entrar com outra conta, sessão encerrada pela web.

## 9. Riscos

- **Aprovação de dispositivo e confirmação da Microsoft por e-mail:** se o
  link do e-mail abrir em outro navegador, a Custom Tab não vê a aprovação.
  Mitigar com texto de ajuda; validar cedo.
- **Logout x cookies da Custom Tab:** o Chrome guarda a sessão do
  Authenticator; sem tratar, "entrar de novo" reentra na mesma conta.
  Solução: no logout, abrir `/auth/sso-logout/` (exige destino https na
  allowlist) ou forçar a tela de login com `prompt`/`login_hint` — validar na
  implementação.
- **Documentação do backend desatualizada** (host `auth.` vs `authenticator.`,
  validade do access 60 min vs 4 h): o app usa `expires_in` da resposta,
  não um valor fixo.
- **Segurança (fora deste app):** `Frontend_Myceo_Example_Authenticator/config.json`
  tem uma `internalServiceKey` commitada. Recomenda-se trocar a chave e
  removê-la do repositório.

## 10. Ordem de implementação (prévia do `tasks.md`)

1. Decisões D1–D4 + registro do `ClientApp` dev.
2. (Se D1-A) PR no `myceo-authenticator` aceitando os esquemas do app.
3. T001 da baseline (Jest) para poder testar a lógica de auth.
4. `src/features/auth` (config, pkce, api, store, jwt, session, provider) com testes.
5. Tela de entrada + `App.tsx` usando a sessão real.
6. Logout e dados do usuário nos Ajustes/Tasks.
7. Verificação manual de todos os critérios no emulador.
