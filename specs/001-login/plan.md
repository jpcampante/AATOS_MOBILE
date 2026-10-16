# Plan — 001 Login por código de e-mail

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Rascunho — para revisão |
| Data | 2026-10-16 |

## 1. Resumo técnico

Dois lados:

1. **Backend (`myceo-authenticator`)**: dois endpoints JSON novos,
   `POST /auth/mobile/code/request/` e `POST /auth/mobile/code/verify/`, que
   enviam um código de 6 dígitos por e-mail e trocam o código por tokens. Eles
   reaproveitam, sem alterar, a regra de rota (`choose_provider`), a regra de
   cadastro (`signup_is_allowed`), o emissor de tokens
   (`generate_tokens_for_user_and_app`) e o registro de sessões por dispositivo
   (`sync_user_session`). Renovação e logout usam os endpoints que já existem.
2. **App**: telas nativas de e-mail → (nome) → código, sessão guardada no
   `expo-secure-store` e renovada com o `refresh_token`.

## 2. Garantia: o login web não muda

| O que existe hoje | Mexemos? |
| --- | --- |
| Páginas `/accounts/*` (login, cadastro, códigos, Google, Microsoft) | Não |
| `/auth/authorize/`, `/auth/redirect_app/`, `/auth/token/` | Não |
| `choose_provider`, `_email_code_is_allowed`, `signup_is_allowed` | Não (só chamados) |
| `ACCOUNT_LOGIN_BY_CODE_*` e demais settings do allauth | Não |
| Tabelas existentes | Não (uma tabela **nova**) |
| Limites de tentativa do web | Não (chaves de cache **próprias** do mobile) |

Prova: rodar a suíte completa do Authenticator antes e depois (T-B01 e T-B10).

## 3. Backend — desenho

### 3.1 Onde fica

| Arquivo novo | Papel |
| --- | --- |
| `authentication/models/mobile_code.py` | modelo `MobileLoginChallenge` |
| `authentication/migrations/00xx_mobilelogin_challenge.py` | cria a tabela |
| `authentication/services/mobile_code_login.py` | regras: política, gerar/enviar/verificar código, limites |
| `authentication/views/mobile_code.py` | as duas views DRF |
| `authentication/urls.py` | **acrescenta** 2 rotas |
| `templates/account/email/mobile_login_code*` | e-mail do código (mesma marca dos atuais) |
| `authentication/tests_mobile_code_login.py` | testes |

### 3.2 Modelo `MobileLoginChallenge`

```text
id (uuid, público)        email (normalizado)       client_app (FK ClientApp)
code_hash (sha256+salt)   expires_at (+5 min)       attempts (0..3)
purpose: login | signup   full_name (só signup)     last_sent_at
used_at (nullable)        created_ip
```

### 3.3 Política (a única regra nova)

```python
def mobile_code_route(email) -> Allowed | Blocked(reason):
    # reaproveita a regra do web para o caminho "e-mail explícito":
    # - SSO obrigatório do domínio -> LocalEmailAuthenticationBlocked -> Blocked("sso_required")
    # - não troca Gmail/Outlook por Google/Microsoft (é o que requested_method="email" já faz)
    choose_provider(email, requested_method="email")
    conta gerenciada ou desativada -> Blocked("not_allowed")
    conta ativa -> Allowed(login)
    sem conta  -> signup_is_allowed(email) ? Allowed(signup) : Blocked("signup_closed")
```

### 3.4 Contratos

**`POST /auth/mobile/code/request/`** (sem autenticação)

```json
// entrada
{ "client_id": "myceo_app_…", "email": "ana@empresa.com", "full_name": "Ana Lima" }
// 200 — código enviado
{ "challenge_id": "uuid", "purpose": "login", "expires_in": 300, "resend_after": 30 }
// 200 — precisa do nome (e-mail sem conta, cadastro permitido, full_name ausente)
{ "next": "need_name" }
// 403
{ "error": "sso_required", "provider": "microsoft" }   // ou "google" / "oidc"
{ "error": "signup_closed" }
{ "error": "not_allowed" }
// 400 invalid_request · 401 invalid_client · 429 rate_limited (com retry_after)
```

Reenvio: chamar de novo com o mesmo e-mail; se ainda dentro de `resend_after`,
responde 429 com `retry_after`. Um reenvio invalida o código anterior.

**`POST /auth/mobile/code/verify/`** (sem autenticação)

```json
// entrada
{ "client_id": "myceo_app_…", "challenge_id": "uuid", "code": "482913" }
// 200 — mesmo formato do /auth/token/
{ "access_token": "…", "refresh_token": "…", "token_type": "Bearer", "expires_in": 14400, "scope": [] }
// 400
{ "error": "invalid_code", "attempts_left": 2 }
{ "error": "code_expired" }
{ "error": "too_many_attempts" }
{ "error": "challenge_used" }
```

Ao verificar com sucesso:

1. Revalida a política (a conta ou o domínio podem ter mudado nos 5 min).
2. `purpose=signup`: cria o usuário com e-mail **verificado** (o código prova a
   caixa de e-mail), sem senha utilizável, e consome o convite como o cadastro
   web faz (`reserve_signup_authorization`).
3. Emite tokens com `generate_tokens_for_user_and_app(user, client_app)`.
4. Registra a sessão do aparelho com `sync_user_session(user, request, refresh_jti)`
   já **verificada** (o código vale como aprovação do dispositivo), para que a
   renovação não falhe com `unverified_device` e a sessão apareça na lista de
   dispositivos.
5. Marca o desafio como usado (uso único, dentro de transação com `select_for_update`).

### 3.5 Segurança

- Código de 6 dígitos com `secrets`, guardado só como hash; comparação com
  `hmac.compare_digest`.
- 5 min de validade, 3 tentativas, reenvio após 30 s, no máximo 5 envios por
  e-mail por hora.
- Limite por IP e por e-mail com chaves de cache próprias
  (`mobile_code:ip:…`, `mobile_code:email:…`).
- `client_id` precisa ser de um `ClientApp` ativo, público e não em manutenção.
- Respostas de erro sem detalhes internos; nunca loga o código.
- Endpoints isentos de CSRF (sem cookie) e aceitos sem header `Origin`, como o `/auth/token/`.

### 3.6 Dados do usuário

O token já traz `name`, `given_name`, `family_name`, `email`, `picture`,
`public_uid`. O app lê dali; não depende do `/auth/@me/` (que exige permissão
de admin).

## 4. App — desenho

### 4.1 Telas (dentro da folha preta atual)

```text
[Entrada]  logo + título rotativo
           ┌ Continuar com e-mail ┐
[E-mail]   campo e-mail · Enviar código
[Nome]     (só conta nova) campo nome · Enviar código
[Código]   6 caixas · "Enviamos para ana@…" · Reenviar (contador) · Trocar e-mail
```

Saem os botões Apple, Google, "Sign up" e "Log in" atuais.

### 4.2 Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/features/auth/config.ts` | `EXPO_PUBLIC_MYCEO_AUTH_URL`, `EXPO_PUBLIC_MYCEO_CLIENT_ID` |
| `src/features/auth/types.ts` | `AuthTokens`, `AuthUser`, `AuthError` |
| `src/features/auth/authApi.ts` | `requestCode`, `verifyCode`, `refresh`, `checkSession`, `logout` |
| `src/features/auth/tokenStore.ts` | `expo-secure-store` |
| `src/features/auth/jwt.ts` | claims → `AuthUser` |
| `src/features/auth/session.ts` | estado da sessão, renovação com fila única, regra de quando derrubar |
| `src/features/auth/AuthProvider.tsx` + `useAuth()` | `status`, `user`, `requestCode`, `verifyCode`, `signOut` |
| `src/features/auth/authFetch.ts` | `fetch` com Bearer + renovação (para features futuras) |
| `src/components/auth/CodeInput.tsx` | 6 caixas, colar, `textContentType="oneTimeCode"` / `autoComplete="one-time-code"` |
| `src/screens/LoginScreen.tsx` | passos e-mail → nome → código |
| `App.tsx` | fase `login`/`main` vem de `useAuth().status` |
| `src/components/auria/AuriaSettingsModal.tsx` | dados reais + "Log out" |
| `.env.example` | variáveis `EXPO_PUBLIC_MYCEO_*` |

Dependência nova: `expo-secure-store` (vem no Expo Go). Nada de navegador,
PKCE ou deep link.

### 4.3 Sessão

- Ao abrir: lê o SecureStore. Sem tokens → Entrada. Com tokens → abas; se o
  access expira em menos de 5 min, renova.
- Renovação: `POST /auth/token/ {grant_type:"refresh_token", refresh_token}`.
  Uma renovação por vez (fila única), porque o refresh é rotativo.
- Só derruba a sessão com 400/401 + `invalid_refresh_token`/`invalid_grant`
  (mesma regra do web). Rede, 5xx e 429 → tenta de novo depois.
- Ao voltar ao primeiro plano: `GET /auth/session/check/`; 401 → "Sua sessão terminou".
- Logout: `POST /auth/account/sessions/current/logout/` com o refresh; apaga o
  SecureStore mesmo se a chamada falhar.

## 5. Verificação da constituição

| Princípio | Atende? | Observação |
| --- | --- | --- |
| I. Spec primeiro | ✅ | |
| II. Android primeiro | ✅ | Tudo nativo, funciona no Expo Go |
| III. Design system | ✅ | Mantém a folha preta da entrada; novos elementos com tokens |
| IV. Dados atrás de uma camada | ✅ | `src/features/auth`; telas só usam `useAuth()` |
| V. Acessibilidade | ✅ | Rótulos e autofill do código |
| VI. Qualidade verificável | ⚠️ | App depende de T001 (Jest) da baseline; backend já tem suíte |
| VII. Simplicidade | ✅ | Sem bibliotecas de OAuth; uma dependência nova |

## 6. Testes

**Backend** (`tests_mobile_code_login.py`):
- pedido para conta existente envia e-mail e cria desafio
- Gmail pessoal recebe código; domínio com SSO obrigatório → 403 `sso_required`
- conta gerenciada/desativada → 403; sem conta + cadastro fechado → 403 `signup_closed`
- sem conta + nome → cria usuário verificado só após o código certo
- código errado decrementa tentativas; 3 erros bloqueiam; expirado; uso único
- reenvio respeita o intervalo e invalida o código anterior
- tokens emitidos renovam em `/auth/token/` (sessão verificada, sem `unverified_device`)
- logout global (época) derruba a sessão do app
- `client_id` inválido/inativo → 401; limites → 429
- **suíte completa existente continua verde**

**App** (Jest, após T001): decodificação do JWT, regra de derrubar sessão,
fila única de renovação, máquina de estados da tela de entrada.

**Manual no emulador:** cada critério de aceite da spec.

## 7. Pré-requisitos e riscos

- **Fluxo de branches do backend:** no `myceo-authenticator` trabalha-se
  direto na branch **`dev`**; depois de testado em dev, vai para **`main`**.
  Os commits deste trabalho vão para `origin/dev` (o push dispara o
  `deploy_dev.yml`).
- **Repositório do backend tem mudanças locais não commitadas** em
  `account_serializers.py`, `signup_serializers.py`, `login.py` e um teste, e
  está 9 commits atrás de `origin/dev`. Para não misturar com elas, o trabalho
  é feito numa **worktree separada** sobre o `origin/dev` atualizado e enviado
  para `dev`, sem tocar nessas mudanças.
- Registro do `ClientApp` "AATOS Android" (público) no dev — precisa de admin.
- Deploy do backend em dev (`deploy_dev.yml`) para testar no emulador; antes
  disso, dá para rodar o Authenticator localmente.
- Entrega de e-mail: confirmar que o provedor de e-mail do dev envia de fato.
- Fase 2: botões nativos Google/Microsoft e SSO empresarial pelo navegador.

## 8. Ordem de implementação

| # | Onde | O quê |
| --- | --- | --- |
| 1 | backend | worktree sobre `origin/dev`; rodar a suíte atual (linha de base) |
| 2 | backend | modelo + migração + serviço de política e código, com testes |
| 3 | backend | views, rotas, template de e-mail, testes de ponta a ponta |
| 4 | backend | suíte completa verde; push para `dev` (deploy em dev) |
| 5 | app | T001 da baseline (Jest) |
| 6 | app | `src/features/auth` com testes |
| 7 | app | tela de entrada (e-mail → nome → código) + `App.tsx` |
| 8 | app | logout e dados reais nos Ajustes/Tasks |
| 9 | ambos | teste ponta a ponta no emulador contra o backend em dev |
| 10 | backend | depois de aprovado em dev: levar para `main` |
