# Tasks — 002 Auria real (paridade com a web)

Spec: [spec.md](./spec.md) · Plano: [plan.md](./plan.md)

## Convenções

- `[ ]` pendente · `[~]` em andamento · `[x]` concluída
- `[P]` = pode rodar em paralelo com outras `[P]` da mesma fase (não toca nos mesmos arquivos)
- `E01…E56` = endpoints do inventário ([plan.md §3](./plan.md))
- IDs: `P` pré-requisito/spike · `A` app · `V` verificação
- Branch: **`develop`** (sem branch de feature); depois `develop` → `main`
- Um commit por tarefa, sem atribuição de IA: `feat(auria): … (A010)`
- Backend: **nenhuma mudança prevista**. Se surgir, só com aprovação explícita
  e numa worktree separada.
- Antes de marcar `[x]`: `npm run typecheck` e `npm test` verdes; mudança
  visual conferida no emulador.

> **Status:** aprovado em 2026-10-20 (D-05 a D-09 da spec).
> **v1** = P1 + P2 (Fases 0–10 e o fechamento da v1). **v2** = P3 (Fases 12–14).

## Fase 0 — Pré-requisitos e spikes (bloqueia tudo)

- [x] P001 Mergear a `feature/001-login` na `develop`. O cliente da Auria usa o token e a renovação de `src/features/auth`. Feito em 2026-10-20 (D-24 do registro), com typecheck e 23 testes verdes.
- [x] P002 Conferir host de produção e token (D-05):
  - com o token do app logado no emulador, chamar `GET https://pilarone.mydailyceo.com/auth/whoami/` (E54) e `GET /auria/chat_importer/chats/visualizer` (E07); o esperado é 200, ou 404 se a conta nunca conversou, nunca 401 nem 403;
  - chamar `GET https://settings.mydailyceo.com/billing/subscription/?app=aatos` (E51) com o mesmo token;
  - descobrir se `POST /auth/callback/` é necessário no primeiro login;
  - registrar o resultado no plano §2.
  - **Resultado (2026-10-20):** `whoami` 200; conversas 404 (conta nova, vira lista vazia); billing 200 com o mesmo token. O `/auth/callback/` não é necessário: sem ele, o acesso já funciona.
- [ ] P003 Spike de streaming no emulador (Expo Go):
  - `expo/fetch` com `POST /auria/system_llm/chat?stream=1` (E01): os eventos chegam aos poucos (sem buffer) e o `abort()` corta a conexão;
  - se falhar, provar o plano B (`XMLHttpRequest` com `onprogress`);
  - gravar um stream real, sem dados pessoais, como fixture.
- [x] P004 Spike de Markdown: renderizar uma resposta real com tabela, lista, código e link nos dois candidatos (plano §6.3), em tema claro e escuro; escolher e registrar no plano. **Resultado (2026-10-20):** `react-native-marked` (escolhida pela pessoa usuária: mantida, JS puro, tabelas GFM, peer `react-native-svg` já instalado). A renderização é conferida no emulador na A012.

**Checkpoint:** token aceito, stream incremental provado e biblioteca de Markdown escolhida.

## Fase 1 — Fundação (bloqueia as histórias)

- [x] A001 `EXPO_PUBLIC_AURIA_API_URL` (padrão `https://pilarone.mydailyceo.com`) e `EXPO_PUBLIC_SETTINGS_URL` (padrão `https://settings.mydailyceo.com`) no `.env.example`; `config.ts` com os padrões — `src/features/auria/api/config.ts` — RF-01, RF-12a
- [x] A002 [P] `routes.ts` com todos os caminhos usados (E01–E53), incluindo a barra final de `add_chat/`/`remove_chat/` — `src/features/auria/api/routes.ts`
- [x] A003 [P] Testes, depois `errors.ts`: lê os 3 formatos de corpo de erro e mapeia cada código/status para mensagem e ação (plano §5) — `src/features/auria/api/errors.ts`, `__tests__/errors.test.ts` — RF-12
- [x] A004 `http.ts`: JSON (`get`/`post`/`patch`/`del`) com Bearer, uma renovação em 401 e timeout; `upload` multipart via XHR com progresso — `src/features/auria/api/http.ts` — RNF-04
- [x] A005 [P] Testes, depois `sse.ts`, leitor puro de SSE. Casos:
  - frame partido entre chunks;
  - vários frames num chunk;
  - UTF-8 multibyte;
  - evento desconhecido ignorado.

  Arquivos: `src/features/auria/api/sse.ts`, `__tests__/sse.test.ts` — RNF-06
- [ ] A006 `streamChat.ts`:
  - `expo/fetch` (ou o plano B da P003) + `sse.ts`;
  - eventos tipados (plano §4), `AbortSignal` e `connection_lost`;
  - token fresco antes de abrir.

  Arquivo: `src/features/auria/api/streamChat.ts`. Endpoint E01 — RF-01, RF-04
- [ ] A007 [P] Testes com fixtures reais, depois `types.ts` + `mappers.ts`:
  - conversa, mensagem (texto, imagem, multimodal) e anexos extraídos do markdown;
  - versões e curtida.

  Arquivos: `src/features/auria/types.ts`, `mappers.ts`, `__fixtures__/`. Endpoints E07, E16 — RF-07, RF-11
- [ ] A008 [P] Testes, depois `runReducer.ts`: eventos → estado da execução. Casos:
  - `delta` e `delta_reset` (code points → UTF-16, com emoji);
  - `reasoning`, `tool`, `status`, `canvas`, `web_status`;
  - `done`/`saved`;
  - erro com texto parcial.

  Arquivo: `src/features/auria/runReducer.ts` — RF-06, RNF-06
- [ ] A009 Adicionar `@react-native-async-storage/async-storage`; `prefs.ts` (modo Rápido/Profundo, última conversa) — `src/features/auria/prefs.ts` — RF-05, RF-09

**Checkpoint:** `npm test` cobre `sse`, `runReducer`, `mappers` e `errors`; nenhuma tela mudou ainda.

## Fase 2 — História 1: Conversar com a Auria (P1)

- [ ] A010 `useAuriaConversation`:
  - envio com `chat_id: null` na primeira mensagem;
  - adota o id real em `chat`/`saved`;
  - uma resposta por vez e `client_operation_id`;
  - parar;
  - título da conversa depois do primeiro turno (E11).

  Arquivo: `src/features/auria/useAuriaConversation.ts`. Endpoints E01, E11 — RF-01, RF-02, RF-04
- [ ] A011 Tirar a simulação do caminho de execução: `buildAssistantReply`, `AURIA_CONVERSATION_MOCKS` e o `setTimeout` de `useAuriaWorkspace`. `AuriaScreen`/`AuriaChatView` passam a usar o hook — `src/features/auria/useAuriaWorkspace.ts`, `src/screens/AuriaScreen.tsx`, `src/components/auria/AuriaChatView.tsx` — RF-01, CS-02
- [ ] A012 `AuriaMarkdown`:
  - tokens do tema, tabela com rolagem horizontal, código, links;
  - renderização em streaming (só o último bloco; link pela metade mostra o rótulo);
  - "pacer" de 40–200 caracteres/s no lugar do `useTypewriter`.

  Arquivo: `src/components/auria/AuriaMarkdown.tsx` — RF-03, RNF-01, RNF-07
- [ ] A013 Seletor **Rápido/Profundo** no composer, enviado como `mode` e salvo em `prefs` — `AuriaComposer.tsx`, `AuriaModelSheet.tsx` (sai a lista Claude/GPT/Gemini, D-06) — RF-05, RF-22
- [ ] A014 Ações da mensagem:
  - copiar, ouvir e compartilhar usam o texto sem markdown;
  - "Branch", "Search the web" e "Use Thinking" ficam ocultos até H6/H7;
  - modo de voz e "Talk to teammate AI" ocultos no menu "+" (D-06).

  Arquivos: `AuriaMessageActions.tsx`, `AuriaCreateMenu.tsx`, `AuriaComposer.tsx` — RF-22
- ~~A015 "Ask Auria" vindo de Insights~~ — **removida**: Insights saiu do app ([spec 003](../003-app-so-auria/spec.md)). O ID fica reservado.

**Checkpoint (emulador):** H1.1–H1.6. A mesma conversa aparece na web (CS-01).

## Fase 3 — História 2: Ver o trabalho da Auria (P1)

- [ ] A016 Painel "Trabalhando há Ns":
  - estado, rodada, etapas de ferramenta com rótulo e ícone do `service`, raciocínio ao vivo;
  - leitor de tela só anuncia o fim.

  Arquivos: `src/components/auria/AuriaWorkPanel.tsx` (adapta `AuriaReasoningBlock`/`AuriaThinkingSheet`) — RF-06, RNF-02
- [ ] A017 "Pensamento" salvo: mostrar `reasoning` das mensagens do histórico (E16) — `AuriaReasoningBlock.tsx` — RF-06

**Checkpoint (emulador):** H2.1–H2.3 com uma pergunta que usa ferramentas (ex.: "quais minhas tarefas de hoje?").

## Fase 4 — História 3: Histórico de conversas (P1)

- [ ] A018 `useAuriaChats`:
  - paginação de 30;
  - 404 vira lista vazia;
  - fixadas primeiro;
  - recarregar.

  Arquivo: `src/features/auria/useAuriaChats.ts`. Endpoint E07 — RF-07
- [ ] A019 Barra lateral com conversas reais, rolagem infinita e estado vazio; sem import de `src/data/auriaMockData` — `AuriaSidebar.tsx` — RF-07, RNF-05
- [ ] A020 Abrir conversa:
  - página 1 para saber o `count`, depois as duas últimas;
  - "Carregar anteriores";
  - abrir por id salvo.

  Endpoints E10, E16 — RF-07
- [ ] A021 [P] Renomear, fixar/desafixar e apagar (com confirmação), de forma otimista com rollback — `useAuriaChats.ts`, menu da conversa na barra lateral. Endpoints E11, E12, E13 — RF-08
- [ ] A022 Lembrar a última conversa (`prefs`). Recarregar a conversa ao voltar do segundo plano. Conversa importada (ChatGPT/Claude) abre só para leitura, com selo de origem — RF-09, casos de borda

**Checkpoint (emulador):** H3.1–H3.6, conferindo renomear, fixar e apagar também na web.

## Fase 5 — História 4: Anexos (P1)

- [ ] A023 [P] Plugins e permissões Android de câmera e fotos no `app.json` (tarefa T005 da baseline, se ainda aberta) — `app.json` — RF-10
- [ ] A024 Testes da validação (20 MB, tipos), depois o serviço de anexos: upload com progresso e remoção. Endpoints E24, E27 — `src/features/auria/api/attachments.ts`, `useAuriaAttachments.ts` — RF-10
- [ ] A025 Fila de anexos no composer (galeria, câmera, arquivos):
  - envia `attachment_uuids` + markdown do anexo, como o web;
  - só anexo, sem texto: grava a mensagem sem IA;
  - criar conversa antes do primeiro anexo, se preciso.

  Arquivos: `AuriaComposer.tsx`, `AuriaCreateMenu.tsx`, `AuriaScreen.tsx`. Endpoints E09, E17, E24 — RF-10
- [ ] A026 Exibir anexos privados:
  - imagens com `headers` de Bearer;
  - arquivos baixados com Bearer e abertos/compartilhados (dependências `expo-file-system` + `expo-sharing`).

  Endpoint E26 — RF-11, RNF-04

**Checkpoint (emulador):** H4.1–H4.4. Uma foto enviada pelo celular é descrita pela Auria (CS-03), e uma imagem enviada pela web aparece no celular.

## Fase 6 — História 5: Erros, créditos e permissões (P1)

- [ ] A027 `AuriaErrorNotice` acima do composer:
  - mensagem e ação por código: tentar de novo, nova conversa, ver planos na web, pedir ao responsável;
  - composer desabilitado em conversa só leitura e sem rede.

  Arquivo: `src/components/auria/AuriaErrorNotice.tsx` — RF-12, RF-13, CS-04
- [ ] A028 Resposta interrompida (parar, `connection_lost`, `error` com parcial):
  - o texto fica com a marca "interrompida";
  - depois do erro, a conversa é relida do servidor para pegar o aviso que ele salvou.

  Requisito: RF-04, RF-12
- [ ] A044 Bloqueio por créditos (D-08), movido para a P1:
  - testes da regra, depois `billing.ts` + `useAuriaCredits`: restante = `(spendable_units ?? available_units) × tokens_per_unit`; bloqueia se ≤ 0, abaixo de `turn_estimates.auria`, plano inativo ou erro na consulta;
  - consulta ao abrir a Auria e depois de cada resposta;
  - composer bloqueado com aviso em inglês ("You're out of credits…") e a ação conforme `can_manage_billing`: "Buy credits on the web" ou "Ask your workspace owner"; mostra a data de renovação (`next_reset_at`) quando houver;
  - o mesmo aviso para o 402 `insufficient_units` vindo do servidor.

  Arquivos: `src/features/auria/api/billing.ts`, `src/features/auria/useAuriaCredits.ts`, `AuriaErrorNotice.tsx`. Endpoint E51 — RF-12, RF-12a

**Checkpoint P1:** typecheck e testes verdes.
- [ ] V001 Roteiro manual P1 no emulador (H1–H5, casos de borda de rede, voltar e segundo plano), conferido também na web. Registrar data e versão do backend.

## Fase 7 — História 6: Tentar de novo e editar (P2)

- [ ] A029 [P] "Tentar de novo" → `regenerate` e recarga — E19 — RF-14
- [ ] A030 [P] Editar mensagem da pessoa (mantém o markdown dos anexos) → `edit` e recarga — E20 — RF-14
- [ ] A031 Alternar versões `< 2/3 >` com `activate`; ligar o "Branch" atual a isso ou removê-lo — E21 — RF-14
- [ ] A032 [P] Curtir resposta — E22 — RF-14

**Checkpoint (emulador):** H6.1–H6.4.

## Fase 8 — História 7: Busca na web e fontes (P2)

- [ ] A033 `useWebSearchPreference`:
  - lê e grava a preferência por conversa;
  - `revision_conflict` → reler;
  - antes de cada envio, confere o estado e manda `web_mode`/`web_policy_version`.

  Endpoints E48, E49 — RF-15
- [ ] A034 Botão de busca na web no composer ou no menu "+", no lugar do "Search the web" simulado; desabilitado com motivo quando a empresa desligou — RF-15
- [ ] A035 Evento `web_status` e o resultado de `done.web`/`web_result`: andamento, até 4 cartões de fonte, lista expandível e chips de citação `[n]` — `AuriaWebEvidence.tsx`, `AuriaCitationChip.tsx` — RF-15
- [ ] A036 Imagens dos cartões de fonte via `web-image` autenticado — E28 — RF-15

**Checkpoint (emulador):** H7.1–H7.4.

## Fase 9 — História 8: Criar imagens (P2)

- [ ] A037 Modo "Criar imagem" → `generate/image`:
  - proporções 1:1 → `1024x1024`, paisagem → `1792x1024`, retrato → `1024x1792`;
  - progresso e erros de créditos.

  Endpoint E06 — RF-16
- [ ] A038 Mensagem `content_type:"image"` renderizada; visualizador em tela cheia; compartilhar (e salvar, se funcionar no Expo Go). Remover `assets/auria-image-mock.jpg` e ocultar a ferramenta de pincel (D-06) — `AuriaImageArtifact.tsx`, `AuriaImageViewer.tsx` — RF-16, RF-22

**Checkpoint (emulador):** H8.1–H8.3, e a imagem aparece também na web.

## Fase 10 — História 9: Documentos da Auria (P2)

- [ ] A039 Cartões de documento vindos de `canvas` e `saved.canvas_documents`; lista de documentos da conversa — E29 — RF-17
- [ ] A040 Leitor de documento, **só leitura** (D-07):
  - `markdown`/`plain` nativo;
  - `html` em WebView (`react-native-webview`);
  - `sheet-json` em tabela, `deck-json` em slides;
  - o editor local atual (`AuriaDocEditor`) sai do caminho dos documentos reais.

  Arquivo: `AuriaDocumentReader.tsx`. Endpoint E31 — RF-17
- [ ] A041 Propostas: cartão Aplicar/Rejeitar a partir de `canvas_proposal` e da lista pendente; em 409, recarregar — `AuriaProposalCard.tsx`. Endpoints E34, E35 — RF-17
- ~~A042 "Pedir mudança" num trecho~~ — **fora de escopo** (D-07: documentos só leitura). O ID fica reservado.
- [ ] A043 Menu "+" → criar documento, planilha ou apresentação manda `create: doc|sheet|slides`. Modelos de documento viram pedidos à Auria; sai o HTML local (D-06) — `AuriaCreateMenu.tsx`, `AuriaDocTemplatesModal.tsx` — RF-17, RF-22

**Checkpoint (emulador):** H9.1–H9.5.

**Checkpoint P2:** typecheck e testes verdes; roteiro manual de H6–H9 no emulador.

## Fase 11 — (vazia)

A044 (bloqueio por créditos) subiu para a Fase 6, na P1 (D-08).

## Fechamento da v1 (P1 + P2)

- [ ] A056 Remover os mocks mortos da Auria (`auriaMockData` de conversas, galeria e busca; `auriaModels`, D-06). **Ocultar na v1** o que só ganha backend na v2 (D-09, RF-22): painel de Projetos e a seção de projetos da barra lateral, Galeria e painel de busca simulado. Conferir que `grep "data/auria" src/screens src/components` só acha configuração estática ou código oculto da v2 — RNF-05, CS-02
- [ ] V002 `npm run typecheck` e `npm test` sem erros
- [ ] V003 Regressão completa da v1 no emulador Android (Expo Go), claro e escuro, com conferência cruzada na web. Registrar a versão do backend testada
- [ ] V004 Spec → **Implementada (v1)**; decisões novas no fim de `docs/DECISOES.md`; merge `develop` → `main` quando aprovado

---

# Segunda versão (v2) — P3

> Decisão D-09: H10–H12 ficam para depois de a v1 estar nas mãos das
> pessoas. Começam só depois da V004.

## Fase 12 — História 10: Projetos (P3 · v2)

- [ ] A045 `useAuriaProjects`: lista e detalhe reais (404 vira lista vazia); `AuriaProjectsPanel`/`AuriaProjectDetail` sem mocks — E39, E41 — RF-18, RNF-05
- [ ] A046 Criar, editar (nome, visibilidade) e apagar projeto; 409 de projeto privado com conversas pergunta se apaga as conversas — E40, E41 — RF-18
- [ ] A047 Adicionar e tirar conversa de projeto (barra final) — E43 — RF-18
- [ ] A048 Membros do projeto (pessoas da empresa) — E42, E44 — RF-18

**Checkpoint (emulador):** H10.1–H10.4, conferidas na web.

## Fase 13 — História 11: Compartilhar conversas (P3 · v2)

- [ ] A049 [P] Visibilidade privada/empresa (só o dono) — E11 — RF-19
- [ ] A050 Folha de compartilhamento: pessoas da empresa; adicionar como leitor/editor; remover — `AuriaShareSheet.tsx`. Endpoints E14, E15, E44 — RF-19
- [ ] A051 WebSocket:
  - `chat.access_revoked` e `project.access_revoked` tiram da lista e fecham com aviso;
  - reconexão, e fechamento 4401 renova o token;
  - header `Origin`.

  Arquivo: `src/features/auria/api/realtime.ts`. Endpoint E53 — RF-20

**Checkpoint (emulador):** H11.1–H11.3, com uma segunda conta na web.

## Fase 14 — História 12: Contexto da conversa (P3 · v2)

- [ ] A052 Menções com `@`: seletor de pessoas da empresa → `mentions` + `subject_user_public_uid`; chips na mensagem — `AuriaMentionPicker.tsx`. Endpoint E44 — RF-21
- [ ] A053 Fontes da conversa: catálogo de documentos indexados, vincular e desvincular (fila antes de a conversa existir); departamento ("Buscar em…") → `department_id` — E45, E46, E52 — RF-21
- [ ] A054 Escopos `/tasks`, `/calendar`, `/mail` e `/contacts`:
  - descoberta com cache de 5 min;
  - `module_scope` + `scope_policy_version`;
  - abortar se `status.started` não ecoar o escopo;
  - escopo desliga a busca na web.

  Endpoints E04, E01 — RF-21
- [ ] A055 Biblioteca: últimos anexos com filtro por tipo e "Ir para a conversa", no lugar da galeria simulada. O painel de busca passa a buscar localmente nas conversas e projetos carregados — `AuriaGalleryPanel.tsx`, `AuriaSearchPanel.tsx`. Endpoint E25 — RF-21, RNF-05

**Checkpoint (emulador):** H12.1–H12.4.

## Fechamento da v2

- [ ] A057 Reexibir os painéis ocultos na v1 (Projetos, Biblioteca, busca), já ligados aos dados reais; remover o que restar de `auriaMockData` — RNF-05
- [ ] V005 `npm run typecheck` e `npm test` sem erros; regressão de H10–H12 no emulador com conferência na web
- [ ] V006 Spec → **Implementada**; decisões novas no fim de `docs/DECISOES.md`; merge `develop` → `main` quando aprovado

## Cobertura dos requisitos

| Requisito | Tarefas |
| --- | --- |
| RF-01, RF-02 | A001, A006, A010, A011 |
| RF-03 | A012 |
| RF-04 | A006, A010, A028 |
| RF-05 | A009, A013 |
| RF-06 | A008, A016, A017 |
| RF-07 | A007, A018, A019, A020 |
| RF-08 | A021 |
| RF-09 | A009, A022 |
| RF-10 | A023, A024, A025 |
| RF-11 | A007, A026 |
| RF-12, RF-13 | A003, A027, A028, A044 |
| RF-12a | A001, A044 |
| RF-14 | A029–A032 |
| RF-15 | A033–A036 |
| RF-16 | A037, A038 |
| RF-17 | A039, A040, A041, A043 |
| RF-18 (v2) | A045–A048 |
| RF-19, RF-20 (v2) | A049–A051 |
| RF-21 (v2) | A052–A055 |
| RF-22 | A013, A014, A038, A043, A056, A057 |
| RNF-01..08 | A004, A005, A008, A012, A016, A019, A026, A045, A056, V001, V003, V005 |

Todos os requisitos da spec estão cobertos. Os endpoints marcados **Fora** ou
**Não usar** no [plano §3](./plan.md) ficam conscientemente de fora.
