# Spec — 001 Login real

| Campo | Valor |
| --- | --- |
| ID | `001-login` |
| Branch | `feature/001-login` |
| Status | Em revisão |
| Data | 2026-10-16 |
| Substitui | RF-LOG-02, RF-LOG-03 da [baseline](../000-baseline/spec.md) |

## 1. Contexto e problema

Hoje a tela de entrada é só visual: qualquer botão entra no app, sem conta e
sem sessão. O AATOS já tem um serviço de contas em produção (o
**MyCEO Authenticator**), usado pelo app web `aatos`, que permite criar conta
com e-mail e senha e entrar com Google ou Microsoft. O app Android precisa usar
essas mesmas contas, para que a pessoa entre no celular com a conta que já
usa na web.

## 2. Objetivos

- O1 — Entrar no app com uma conta MyCEO existente (e-mail e senha, Google ou Microsoft).
- O2 — Criar uma conta nova a partir do app.
- O3 — Manter a pessoa conectada entre aberturas do app, sem pedir login toda vez.
- O4 — Sair da conta.
- O5 — Mostrar o nome e o e-mail reais da pessoa no app.

### Fora de escopo

- Onboarding da empresa (o assistente de 5 passos do web).
- Escolha de empresa / workspace.
- Conectar Gmail ou Outlook para ler e-mails (aba Integrations), que é outra feature.
- Login com Apple (o serviço de contas não oferece).
- Biometria para destravar o app.
- Usar os dados reais nas abas (continua com dados simulados).

## 3. Usuários e cenários

### História 1 — Entrar com conta existente (P1)

Como **pessoa que já usa o AATOS na web**, quero **entrar no app com a mesma
conta** para **ver meus dados no celular**.

**Critérios de aceite:**

1. **Dado** que estou na tela de entrada, **quando** toco em entrar, **então**
   abre a página de login do AATOS dentro do app (aba de navegador do sistema).
2. **Dado** que informei e-mail e senha corretos, **quando** confirmo, **então**
   volto ao app já conectado e vejo a aba Insights.
3. **Dado** que meu e-mail é do Gmail ou do Outlook, **quando** informo o
   e-mail, **então** sou levado ao login do Google ou da Microsoft e, ao
   concluir, volto ao app conectado.
4. **Dado** que estou entrando, **quando** fecho a página de login sem
   concluir, **então** volto à tela de entrada, sem erro e sem travar.
5. **Dado** que é a primeira vez neste aparelho e o serviço pede aprovação
   do dispositivo por e-mail, **quando** aprovo pelo e-mail, **então** consigo
   concluir o login.

### História 2 — Criar conta (P1)

Como **pessoa nova**, quero **criar uma conta pelo app** para **começar a usar o AATOS**.

1. **Dado** que estou na tela de entrada, **quando** toco em criar conta,
   **então** abre a página de cadastro do AATOS.
2. **Dado** que me cadastrei e confirmei o código enviado por e-mail,
   **quando** concluo, **então** volto ao app conectado.
3. **Dado** que o cadastro está restrito (só convidados), **quando** tento me
   cadastrar sem convite, **então** vejo a mensagem do serviço explicando o
   bloqueio e consigo voltar ao app.

### História 3 — Continuar conectado (P1)

1. **Dado** que entrei ontem, **quando** abro o app hoje, **então** vou direto
   para as abas, sem ver a tela de entrada.
2. **Dado** que minha sessão foi encerrada em outro lugar (ex.: "sair de todos
   os dispositivos" na web) ou expirou, **quando** uso o app, **então** volto
   à tela de entrada com o aviso "Sua sessão terminou".
3. **Dado** que estou sem internet ao abrir o app, **quando** já tinha entrado,
   **então** entro normalmente e o app tenta revalidar a sessão quando a
   conexão voltar.

### História 4 — Sair (P1)

1. **Dado** que estou conectado, **quando** toco em "Log out" nos Ajustes,
   **então** volto à tela de entrada e a sessão deixa de valer no servidor.
2. **Dado** que saí, **quando** toco em entrar de novo, **então** posso entrar
   com **outra** conta, sem ser conectado automaticamente na anterior.

### História 5 — Ver meus dados (P2)

1. **Dado** que estou conectado, **quando** abro os Ajustes, **então** vejo meu
   nome, e-mail e foto (ou iniciais) reais.
2. **Dado** que estou conectado, **quando** vejo a saudação em Tasks,
   **então** ela usa meu primeiro nome.

### Casos de borda

- Sem internet ao tocar em entrar: mensagem clara e botão para tentar de novo.
- Serviço de contas fora do ar ou em manutenção: mensagem clara, sem travar.
- O código do login expira (15 min) enquanto a pessoa confirma o e-mail: o
  serviço emite outro sozinho; se falhar, o app pede para tentar de novo.
- O app é fechado no meio do login: ao reabrir, está na tela de entrada.
- Dois pedidos de renovação de sessão ao mesmo tempo não podem derrubar a sessão.
- Botão "voltar" do Android durante o login cancela e volta para a tela de entrada.

## 4. Requisitos funcionais

| ID | Requisito | História |
| --- | --- | --- |
| RF-01 | O app DEVE autenticar exclusivamente pelo MyCEO Authenticator, usando as páginas de login dele num navegador do sistema (não em WebView). | H1, H2 |
| RF-02 | O app DEVE oferecer "Entrar" e "Criar conta" na tela de entrada. [PRECISA ESCLARECER: manter botões "Google" e "Microsoft" separados?] | H1, H2 |
| RF-03 | Login por e-mail/senha, Google e Microsoft DEVEM funcionar pelo mesmo fluxo. | H1 |
| RF-04 | Cancelar o login DEVE voltar à tela de entrada sem erro. | H1 |
| RF-05 | A sessão DEVE ser guardada de forma segura no aparelho e sobreviver ao fechamento do app. | H3 |
| RF-06 | O app DEVE renovar a sessão sozinho antes de expirar, sem interromper a pessoa. | H3 |
| RF-07 | Sessão encerrada no servidor DEVE levar à tela de entrada com aviso. | H3 |
| RF-08 | "Log out" DEVE encerrar a sessão no servidor, apagar os dados de sessão do aparelho e permitir entrar com outra conta. | H4 |
| RF-09 | Nome, e-mail e foto da pessoa DEVEM vir da conta, não de valores fixos. | H5 |
| RF-10 | O botão "Continue with Apple" DEVE ser removido. | — |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Segurança: nenhum segredo de cliente no app; credenciais nunca passam pelo código do app (só pelas páginas do serviço). |
| RNF-02 | Segurança: sessão guardada em armazenamento criptografado do sistema, nunca em armazenamento comum. |
| RNF-03 | Plataforma: Android, funcionando no Expo Go (desenvolvimento) e em build próprio (produção). |
| RNF-04 | Ambientes: o app aponta para o serviço de desenvolvimento ou de produção por configuração, sem mudar código. |
| RNF-05 | Acessibilidade: botões da tela de entrada com rótulos para leitor de tela. |
| RNF-06 | Desempenho: com sessão válida, o app abre direto nas abas em até 1 s após a abertura animada. |

## 6. Entidades

- **Sessão**: credencial de acesso (vale horas), credencial de renovação
  (vale 14 dias e é trocada a cada renovação), data de expiração.
- **Usuário**: identificador público, nome, e-mail, foto.

## 7. Critérios de sucesso

- CS-01 — Uma conta criada na web entra no app Android sem passo extra.
- CS-02 — Depois de entrar, a pessoa não vê a tela de entrada de novo por 14 dias de uso normal.
- CS-03 — Nenhum nome ou e-mail fixo ("Marta") aparece para quem está conectado.

## 8. Dúvidas em aberto

- [ ] [PRECISA ESCLARECER: tela de entrada — (a) um botão "Entrar" + "Criar conta", deixando o serviço decidir Google/Microsoft pelo e-mail (como no web), ou (b) campo de e-mail no próprio app e depois a página do serviço já no passo certo? Botões "Google"/"Microsoft" diretos não são possíveis: o serviço só aceita entrar por eles depois de saber o e-mail.]
- [ ] [PRECISA ESCLARECER: quem registra o app Android como cliente no Authenticator (acesso de admin) e em qual ambiente começamos — dev (`authenticator-dev.mydailyceo.com`)?]
- [ ] [PRECISA ESCLARECER: o retorno do login para o app exige uma de duas mudanças fora deste repositório — ver plano, decisão D1.]
