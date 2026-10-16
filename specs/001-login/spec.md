# Spec — 001 Login por código de e-mail

| Campo | Valor |
| --- | --- |
| ID | `001-login` |
| Branch | `feature/001-login` (app) · `feature/mobile-code-login` (backend) |
| Status | Em revisão |
| Data | 2026-10-16 |
| Substitui | RF-LOG-02, RF-LOG-03 da [baseline](../000-baseline/spec.md) |

## 1. Contexto e problema

Hoje a tela de entrada é só visual: qualquer botão entra no app, sem conta e
sem sessão. O AATOS já tem um serviço de contas (o **MyCEO Authenticator**),
usado pelo app web `aatos`. A pessoa precisa entrar no app Android com a mesma
conta da web.

Decisão de produto (2026-10-16): **o login acontece inteiro dentro do app**,
sem abrir navegador. A pessoa informa o e-mail, recebe um código por e-mail e
digita o código no app. Isso funciona para qualquer e-mail, inclusive Gmail e
Outlook.

## 2. Objetivos

- O1 — Entrar no app com uma conta MyCEO existente usando um código enviado por e-mail.
- O2 — Criar uma conta nova pelo app, com o mesmo código.
- O3 — Continuar conectado entre aberturas do app.
- O4 — Sair da conta.
- O5 — Mostrar nome, e-mail e foto reais da pessoa.

### Fora de escopo

- Login com senha no app.
- Botões nativos "Entrar com Google" / "Entrar com Microsoft" (fase 2).
- Login de empresas que exigem SSO (fase 2, pelo navegador).
- Onboarding da empresa, escolha de workspace, conectar Gmail/Outlook para ler e-mails.
- Login com Apple.

## 3. Usuários e cenários

### História 1 — Entrar com código (P1)

Como **pessoa que já usa o AATOS**, quero **entrar no app com um código que
chega no meu e-mail** para **não precisar de senha nem sair do app**.

**Critérios de aceite:**

1. **Dado** que estou na tela de entrada, **quando** toco em "Continuar com e-mail",
   **então** vejo um campo de e-mail dentro do app.
2. **Dado** que informei um e-mail com conta, **quando** toco em "Enviar código",
   **então** vejo a tela do código e recebo um e-mail com um código de 6 dígitos.
3. **Dado** que digitei o código certo dentro da validade, **então** entro no app
   e vejo a aba Insights.
4. **Dado** que meu e-mail é Gmail ou Outlook pessoal, **quando** peço o código,
   **então** recebo o código como qualquer outro e-mail.
5. **Dado** que errei o código, **então** vejo "Código incorreto" e quantas
   tentativas restam; depois de 3 erros o código deixa de valer e preciso pedir outro.
6. **Dado** que o código expirou (5 min), **quando** tento usá-lo, **então** vejo
   "Código expirado" e um botão para reenviar.
7. **Dado** que não recebi o e-mail, **quando** passa o tempo de espera,
   **então** posso tocar em "Reenviar código".
8. **Dado** que estou na tela do código, **quando** toco em "Trocar e-mail" ou no
   botão voltar do Android, **então** volto ao campo de e-mail.

### História 2 — Criar conta (P1)

1. **Dado** que informei um e-mail sem conta, **quando** toco em "Enviar código",
   **então** o app pede meu nome antes de enviar o código.
2. **Dado** que confirmei o código, **então** minha conta é criada já com o
   e-mail verificado e entro no app.
3. **Dado** que o cadastro está restrito a convidados e não tenho convite,
   **quando** informo meu e-mail, **então** vejo "O cadastro está fechado. Peça
   um convite a quem administra sua empresa" e nenhuma conta é criada.

### História 3 — Bloqueios de política (P1)

1. **Dado** que meu e-mail é de uma empresa que exige SSO, **quando** peço o
   código, **então** vejo "Sua empresa exige entrar pela Microsoft/Google. Use o
   AATOS na web por enquanto" e nenhum código é enviado.
2. **Dado** que minha conta está desativada ou é gerenciada, **então** vejo uma
   mensagem genérica de que não é possível entrar com este e-mail.

### História 4 — Continuar conectado (P1)

1. **Dado** que entrei antes, **quando** abro o app, **então** vou direto às abas.
2. **Dado** que minha sessão foi encerrada (ex.: "sair de todos os dispositivos"
   na web) ou expirou, **quando** uso o app, **então** volto à tela de entrada
   com o aviso "Sua sessão terminou".
3. **Dado** que estou sem internet ao abrir o app e já tinha entrado, **então**
   entro normalmente e a sessão é revalidada quando a conexão voltar.

### História 5 — Sair (P1)

1. **Dado** que estou conectado, **quando** toco em "Log out" nos Ajustes,
   **então** volto à tela de entrada e a sessão deixa de valer no servidor.
2. **Dado** que saí, **então** posso entrar com outra conta.

### História 6 — Ver meus dados (P2)

1. **Dado** que estou conectado, **quando** abro os Ajustes, **então** vejo meu
   nome, e-mail e foto (ou iniciais) reais.
2. **Dado** que estou conectado, **então** a saudação em Tasks usa meu primeiro nome.

### Casos de borda

- Sem internet ao pedir ou confirmar o código: mensagem clara e "Tentar de novo".
- Muitos pedidos seguidos: "Muitas tentativas. Tente de novo em alguns minutos."
- Colar o código copiado do e-mail preenche os 6 campos de uma vez.
- O app é fechado na tela do código: ao reabrir, volta à tela de entrada e a
  pessoa pede um código novo.
- E-mail com espaços ou maiúsculas é normalizado.
- Dois pedidos de renovação de sessão ao mesmo tempo não podem derrubar a sessão.

## 4. Requisitos funcionais

| ID | Requisito | História |
| --- | --- | --- |
| RF-01 | O app DEVE autenticar pelo MyCEO Authenticator com e-mail + código de 6 dígitos, sem abrir navegador. | H1 |
| RF-02 | O código DEVE valer 5 minutos, aceitar no máximo 3 tentativas e permitir reenvio após um intervalo. | H1 |
| RF-03 | E-mails pessoais Gmail/Outlook DEVEM poder usar código. | H1 |
| RF-04 | E-mail sem conta DEVE levar ao cadastro (nome + código), respeitando a regra de convite do serviço. | H2 |
| RF-05 | Contas de empresas que exigem SSO, contas gerenciadas e contas desativadas NÃO DEVEM receber código. | H3 |
| RF-06 | A sessão DEVE ser guardada em armazenamento criptografado e sobreviver ao fechamento do app. | H4 |
| RF-07 | O app DEVE renovar a sessão sozinho antes de expirar. | H4 |
| RF-08 | Sessão encerrada no servidor DEVE levar à tela de entrada com aviso. | H4 |
| RF-09 | "Log out" DEVE encerrar a sessão no servidor e apagar a sessão do aparelho. | H5 |
| RF-10 | Nome, e-mail e foto DEVEM vir da conta. | H6 |
| RF-11 | Os botões "Continue with Apple" e "Continue with Google" DEVEM sair da tela de entrada. | — |
| RF-12 | A sessão do app DEVE aparecer na lista de dispositivos da conta e respeitar "sair de todos os dispositivos". | H4, H5 |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Segurança: código guardado só como hash; comparação em tempo constante; limite de pedidos por e-mail e por IP. |
| RNF-02 | Segurança: nenhum segredo no app (cliente público). |
| RNF-03 | **Compatibilidade: nenhuma mudança no comportamento do login web.** Toda a suíte de testes do Authenticator continua passando. |
| RNF-04 | Plataforma: Android, funcionando no Expo Go. |
| RNF-05 | Ambientes: dev ou produção por configuração, sem mudar código. |
| RNF-06 | Acessibilidade: campos com rótulos; o código aceita preenchimento automático. |
| RNF-07 | O e-mail do código segue a identidade visual dos e-mails atuais do AATOS. |

## 6. Entidades

- **Desafio de código**: e-mail, hash do código, validade, tentativas usadas,
  momento do último envio, se é cadastro (com nome), app cliente, usado ou não.
- **Sessão**: credencial de acesso (horas), credencial de renovação (14 dias,
  trocada a cada renovação), expiração.
- **Usuário**: identificador público, nome, e-mail, foto.

## 7. Critérios de sucesso

- CS-01 — Uma conta criada na web entra no app Android só com o código.
- CS-02 — Entrar leva menos de 1 minuto, contando a chegada do e-mail.
- CS-03 — Depois de entrar, a pessoa não vê a tela de entrada por 14 dias de uso normal.
- CS-04 — Nenhum teste existente do Authenticator quebra.

## 8. Decisões tomadas

- D-01 — Login por código de e-mail, dentro do app (2026-10-16).
- D-02 — Gmail/Outlook pessoais recebem código também (2026-10-16).
- D-03 — Empresas com SSO obrigatório continuam bloqueadas para código (2026-10-16).
- D-04 — Cadastro pelo app respeita a regra de convite do serviço (2026-10-16).
- D-05 — Endpoints novos no Authenticator implementados neste trabalho, sem mudar o fluxo web (2026-10-16).

## 9. Dúvidas em aberto

- [ ] [PRECISA ESCLARECER: quem tem acesso de admin para registrar o cliente "AATOS Android" no Authenticator de dev?]
