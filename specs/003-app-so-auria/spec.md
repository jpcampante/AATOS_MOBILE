# Spec — 003 App só com Auria e Perfil

| Campo | Valor |
| --- | --- |
| ID | `003-app-so-auria` |
| Branch | `develop` |
| Status | Implementada (2026-10-20) |
| Data | 2026-10-20 |
| Substitui | RF-NAV-*, RF-INS-*, RF-TSK-*, RF-INT-*, RF-SET-01 da [baseline](../000-baseline/spec.md) |

## 1. Contexto e problema

O app nasceu como o "AATOS no celular", com cinco abas: Insights, Auria,
Tasks, Integrations e Settings. Insights, Tasks e Integrations são só
simulação: nenhuma tem backend e todas mostram dados de exemplo.

Decisão de produto (2026-10-20): **o app é a Auria.** As outras telas saem.
A barra de navegação fica com duas abas: **Auria** e **Perfil**. O foco do time
passa a ser só ligar a Auria ao backend real ([spec 002](../002-auria-real/spec.md)).

## 2. Objetivos

- O1 — Abrir o app direto na Auria.
- O2 — Ter um Perfil com os dados reais da pessoa, o tema e a saída da conta.
- O3 — Tirar do app tudo o que é simulado fora da Auria.

### Fora de escopo

- Mudanças dentro da Auria (são da spec 002).
- Opções de Perfil sem backend: memória, apps conectados, plano/assinatura,
  notificações, voz, ajuda (voltam quando tiverem backend).

## 3. Usuários e cenários

### História 1 — Navegação só com Auria e Perfil (P1)

1. **Dado** que entrei no app, **então** vejo a Auria, e a barra de navegação tem só **Auria** e **Perfil**.
2. **Dado** que estou na Auria, **quando** toco em **Perfil**, **então** vejo a tela de Perfil; e volto tocando em **Auria**.
3. **Dado** que saí e entrei de novo, **então** abro na Auria.
4. **Dado** que estou no Perfil, **quando** uso o botão voltar do Android ou o gesto de voltar, **então** volto à Auria.

### História 2 — Perfil (P1)

1. **Dado** que abro o Perfil, **então** vejo minha foto (ou iniciais), meu nome e meu e-mail reais.
2. **Quando** escolho o tema Claro, Escuro ou Sistema, **então** o app muda na hora.
3. **Quando** ajusto os interesses do Discover, **então** o feed da Auria reflete a escolha.
4. **Quando** toco em **Log out**, **então** volto à tela de entrada e a sessão termina no servidor (regra da 001).
5. **Dado** que estou na Auria, **quando** abro "Settings" pela barra lateral, **então** vou para o Perfil.

### Casos de borda

- Nome longo ou e-mail longo: quebra de linha sem sobrepor.
- Sem foto: iniciais.
- Tema escuro: o Perfil segue o tema.

## 4. Requisitos funcionais

| ID | Requisito | História |
| --- | --- | --- |
| RF-01 | A navegação DEVE ter só as abas Auria e Perfil; o app abre na Auria. | H1 |
| RF-02 | Insights, Tasks e Integrations DEVEM sair do app (telas, componentes, dados e testes). | H1 |
| RF-03 | O Perfil DEVE mostrar foto/iniciais, nome e e-mail reais, tema, interesses do Discover e Log out. | H2 |
| RF-04 | O Perfil NÃO DEVE mostrar opções sem funcionamento real. | H2 |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Android, verificado no emulador (Expo Go), claro e escuro. |
| RNF-02 | Controles com `accessibilityRole`/`accessibilityLabel`; alvos de 44 pt. |
| RNF-03 | Cores e fontes de `src/theme`. |

## 6. Critérios de sucesso

- CS-01 — `grep -r "insights\|TasksScreen\|IntegrationsScreen" src` não acha código de tela removida.
- CS-02 — Typecheck e testes verdes.

## 7. Decisões tomadas

- D-01 (2026-10-20) — O app é só a Auria; a barra tem Auria e Perfil (pedido da pessoa usuária).
- D-02 (2026-10-20) — Conteúdo do Perfil: só o que funciona hoje (dados da conta, tema, interesses do Discover, Log out). O modal de Ajustes antigo, cheio de opções simuladas, sai.
