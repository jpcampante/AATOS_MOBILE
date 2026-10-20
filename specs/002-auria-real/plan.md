# Plan — 002 Auria real (paridade com a web)

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Rascunho (depende das respostas da seção 9 da spec) |
| Data | 2026-10-20 |

> Fontes deste plano, lidas em 2026-10-20:
> - Backend `D:\REPOS\Backend\aatos-auria`, **no commit `6567791`**: é o que o
>   `aatos-system` `main` instala em produção. O checkout local está na `dev`
>   de 29/09, desatualizado, e não serve de referência.
>   Doc de apoio: `aatos-auria/AURIA_API.md`. Em permissões, a doc está desatualizada.
> - Web `D:\REPOS\aatos`: `src/services/importer/api.ts`,
>   `src/services/auria/*` e `src/components/chat-interface/*`. Na prática, o web é o contrato vivo.
> - App: `src/features/auria`, `src/components/auria` e `src/features/auth` (da 001).

## 1. Resumo técnico

O app passa a falar com o mesmo backend da web: `aatos-system` em
`/auria/...`, com o mesmo JWT do Authenticator que a 001 já guarda.

O coração é o `POST /auria/system_llm/chat?stream=1`, um SSE por **POST**.
Por isso o app não usa `EventSource`: usa `fetch` com corpo em stream
(`expo/fetch`) e um leitor de SSE próprio, testado. O resto é REST simples.

Todo acesso à rede fica em `src/features/auria/api/`. O estado vive em hooks
da área (`useAuriaConversation`, `useAuriaChats`…). As telas atuais são
reaproveitadas e deixam de importar mocks (princípio IV).

**Backend:** nenhuma mudança é necessária para P1–P3. Push nativo ficaria
para uma spec futura com backend (seção 7).

## 2. Ambiente e autenticação

| Item | Valor | Fonte |
| --- | --- | --- |
| Host da API (dev) | `https://pilarone-dev.mydailyceo.com` | `.env` do web; `ALLOWED_HOSTS` |
| Host da API (prod) | `https://pilarone.mydailyceo.com` | `AURIA_API.md`, `settings.py` |
| Variável nova no app | `EXPO_PUBLIC_AURIA_API_URL` (padrão: dúvida 1 da spec) | `.env.example` |
| Billing (P2) | `https://settings-dev.mydailyceo.com` / `settings.mydailyceo.com` → `EXPO_PUBLIC_SETTINGS_URL` | `aatos/src/config/settingsService.ts` |
| WebSocket (P3) | `wss://<host>/ws/`, subprotocolo `["myceo-jwt", <token>]` | `aatos-system/aatos/ws_auth.py` |

**Como o backend valida o token** (`myceo_auth_receiver`):
- Exige `Authorization: Bearer <jwt>`. A assinatura RS256 é verificada offline com `AUTH_PUBLIC_KEY`.
- **Não confere `aud` nem `client_id`.** Por isso o token do app (`myceo_app_aatos_android`) deve ser aceito.
- As claims obrigatórias são `public_uid` e `email`.
- Em seguida, o servidor resolve a **empresa principal** da pessoa. Sem empresa, devolve `403 no_business_access`.
- Cada ação exige uma permissão: `auria.read` para ler e `auria.write` para escrever. A permissão vem do papel na empresa.
- O app manda sempre o Bearer e nunca cookie. Assim, a checagem de `Origin` e o CSRF não se aplicam.

**A conferir na P002:**
- (a) O host escolhido aceita o token do Authenticator que o app usa (D-15: o `authenticator-dev` é o servidor de produção).
- (b) Se o `POST /auth/callback/`, que o web chama no primeiro login, é necessário para quem só usa o app.

## 3. Inventário de endpoints, um a um

Legenda da coluna **Fase**:
- **P1/P2/P3**: entra nesta spec, na tarefa indicada.
- **Fora**: fora de escopo. O motivo está na coluna Observação.
- **Não usar**: existe, mas o web não usa ou não serve ao app.

### 3.1 Conversa (motor)

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E01 | `POST /auria/system_llm/chat?stream=1` | Turno da Auria com ferramentas, em SSE | P1 | A006, A010 | Corpo: `message`, `chat_id` (null = cria), `mode`, `attachment_uuids`, `web_mode`, `web_policy_version`, `client_operation_id`, `mentions`, `subject_user_public_uid`, `create`, `open_document_id`, `module_scope`, `scope_policy_version`, `department_id`. Exige `auria.write`. |
| E02 | `POST /auria/system_llm/chat` (sem stream) | Mesmo turno, resposta única | Não usar | — | Turnos longos (até 8 rodadas) podem estourar o timeout do proxy. |
| E03 | `POST /auria/system_llm/chat` com `list_pending_sends`, `confirm_pending_send` ou `cancel_pending_send` | Confirma ou cancela o envio de e-mail proposto pela Auria | Fora | — | A confirmação também funciona conversando ("sim"). O cartão de envio fica para a spec de e-mail. |
| E04 | `GET /auria/system_llm/scope` | Descobre quais escopos de módulo e versões de política de web o servidor aceita | P3 | A054 | Cache de 5 min, como no web. |
| E05 | `POST /auria/generate` | Motor antigo, sem ferramentas e sem stream | Não usar | — | Decisão D-02 da spec. Devolve 500 para `chat_id` desconhecido. |
| E06 | `POST /auria/generate/image` | Gera uma imagem | P2 | A037 | `{prompt, size: 1024x1024 \| 1792x1024 \| 1024x1792, quality, chat_id}`. O servidor **salva** a mensagem de imagem (`content_type:"image"`). A URL em `/media/...` é pública. |

### 3.2 Conversas

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E07 | `GET /auria/chat_importer/chats/visualizer?page&limit=30` | Lista paginada de conversas | P1 | A018 | `{count, next, results[]}` com `id_chat, title, provider, visibility, owner_public_uid, is_pinned, last_activity, message_count`. **Devolve 404 para quem nunca conversou** (tratar como lista vazia). |
| E08 | `GET /auria/chat_importer/chats` | Lista sem paginação | Não usar | — | O E07 basta. |
| E09 | `POST /auria/chat_importer/chats` | Cria uma conversa | P1 | A025 | Só para o caso "anexo antes da primeira mensagem". Fora isso, a conversa nasce no E01 com `chat_id:null`. |
| E10 | `GET /auria/chat_importer/chats/{id}` | Detalhe da conversa | P1 | A020 | Para abrir uma conversa pelo id salvo. |
| E11 | `PATCH /auria/chat_importer/chats/{id}` | Renomeia; muda visibilidade (só o dono) | P1 / P3 | A021, A049 | **Não enviar `provider`**, que é imutável. |
| E12 | `DELETE /auria/chat_importer/chats/{id}` | Apaga a conversa (só o dono) | P1 | A021 | 204. |
| E13 | `POST` / `DELETE /auria/chat_importer/chats/{id}/pin` | Fixa ou desafixa, por pessoa | P1 | A021 | Otimista, com rollback se falhar. |
| E14 | `GET`/`POST /auria/chat_importer/chats/{id}/members` | Lista e adiciona membros (`viewer`/`editor`) | P3 | A050 | Só o dono adiciona. |
| E15 | `DELETE /auria/chat_importer/chats/{id}/members/{uid}` | Remove um membro | P3 | A050 | Idempotente. |

### 3.3 Mensagens

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E16 | `GET /auria/chat_importer/messages/{chatId}/visualizer?page&limit` | Mensagens do ramo ativo, em ordem cronológica e paginada | P1 | A020 | Páginas de 20 em ordem crescente. Carregar a página 1 para saber o `count`, depois as duas últimas; "anteriores" desce a página (igual ao `auriaMessagePages.ts` do web). Campos: `uuid, author_role, content_type, content, created_time, reasoning, mentions, attachments, web_result, execution_policy, liked, version_index, version_count, parent_uuid`. |
| E17 | `POST /auria/chat_importer/messages/{chatId}` | Grava uma mensagem sem chamar a IA | P1 | A025 | Envio só de anexos, como o web faz ("silent send"). |
| E18 | `GET`/`PATCH`/`DELETE /auria/chat_importer/messages/{uuid}` | Edição de baixo nível de uma mensagem | Não usar | — | O web também não usa. |
| E19 | `POST …/messages/{uuid}/regenerate` | Nova resposta (cria versão) | P2 | A029 | Devolve 201. Depois, recarregar as mensagens. |
| E20 | `PATCH …/messages/{uuid}/edit` | Edita a mensagem da pessoa e gera nova resposta | P2 | A030 | `{content, mode, web_*}`. Manter o markdown dos anexos. |
| E21 | `POST …/messages/{uuid}/activate` | Troca a versão ativa (`< 2/3 >`) | P2 | A031 | O web não usa. O app usa porque a baseline já tem o "ramificar". |
| E22 | `POST …/messages/{uuid}/like` | Curtir ou descurtir | P2 | A032 | O web não usa; o app usa. |
| E23 | `POST …/messages/{uuid}/send-to-rag` | Salva a resposta como documento indexado | Fora | — | O web não usa. |

### 3.4 Anexos

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E24 | `POST /auria/chat/attachments` (multipart `file`, `chat_id`) | Envia um anexo | P1 | A024 | Até 20 MB. Tipos: jpeg, png, gif, webp, pdf, txt, md, csv, docx, xlsx, json. Erros: 413, 415. Devolve `{uuid, filename, mime_type, url}`. |
| E25 | `GET /auria/chat/attachments` | Últimos 50 anexos | P3 | A055 | Biblioteca. |
| E26 | `GET /auria/chat/attachments/{uuid}` | Baixa o binário, com Bearer | P1 | A026 | Nunca é URL pública. Imagens: `Image` com `headers`. Arquivos: download autenticado. |
| E27 | `DELETE /auria/chat/attachments/{uuid}` | Apaga um anexo | P1 | A025 | Quando a pessoa remove da fila um anexo já enviado. |
| E28 | `GET /auria/web-image/?u=&s=` | Imagem de fonte da web, assinada e autenticada | P2 | A036 | Usada pelos cartões de fonte. |

### 3.5 Documentos da Auria (canvas)

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E29 | `GET /auria/chats/{chatId}/canvas` | Documentos da conversa | P2 | A039 | `{documents[]}`. |
| E30 | `POST /auria/chats/{chatId}/canvas` | Cria um documento a partir de um modelo, sem IA | Não usar | — | O app pede o documento à Auria (`create:"doc"`) em vez de montar HTML local. Ver dúvida 2. |
| E31 | `GET /auria/chats/{c}/canvas/{d}` ou `GET /auria/canvas/{d}` | Documento com conteúdo e `ETag` | P2 | A040 | Formatos: `markdown`, `html`, `plain`, `sheet-json`, `deck-json`. |
| E32 | `PATCH /auria/chats/{c}/canvas/{d}` | Edita (`expected_version`, 409 em conflito) | P2 / Fora | A042 | Só via reescrita nesta spec; edição manual depende da dúvida 3. |
| E33 | `DELETE /auria/chats/{c}/canvas/{d}` | Apaga o documento | Fora | — | O web não oferece no chat. |
| E34 | `GET /auria/chats/{chatId}/canvas/proposals` | Propostas pendentes | P2 | A041 | |
| E35 | `POST /auria/canvas/{doc}/proposals/{id}/apply\|reject` | Aplica ou rejeita uma proposta | P2 | A041 | `{revision}`. Em 409 vem o documento e a proposta atuais. |
| E36 | `POST /auria/canvas/{doc}/rewrite` | Reescreve um trecho (IA) | P2 | A042 | `{text, instruction}` → `{rewritten}`. Limite de 20/min. Erros de IA e billing. |
| E37 | `…/canvas/{d}/versions`, `…/versions/{n}`, `…/versions/{n}/restore`, `…/export` | Histórico e exportação | Fora | — | Ficam para a spec de edição de documentos. |
| E38 | `GET`/`POST /auria/canvas`, `/canvas/{id}/trash`, `/restore`, `/placement`, `/members`, `/attachments/{uuid}`; `/auria/essentials/*` | Biblioteca Essentials (Docs/Sheets/Slides) | Fora | — | Exceção: `GET /auria/canvas/{doc}/attachments/{uuid}` (imagem dentro de documento) entra no A040 se aparecer no conteúdo. |

### 3.6 Projetos, organização e contexto

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E39 | `GET /auria/chat_importer/projects` | Lista projetos com as conversas | P3 | A045 | 404 para quem não tem conversas: tratar como lista vazia. |
| E40 | `POST /auria/chat_importer/projects` | Cria um projeto | P3 | A046 | `{name, visibility}`. |
| E41 | `GET`/`PATCH`/`DELETE /auria/chat_importer/projects/{id}` | Detalhe, edição e exclusão | P3 | A046 | Projeto privado com conversas devolve 409, a menos que venha `?delete_chats=true`. |
| E42 | `GET`/`POST /auria/chat_importer/projects/{id}/members`; `DELETE …/members/{uid}` | Membros do projeto | P3 | A048 | |
| E43 | `POST …/projects/{id}/add_chat/` e `…/remove_chat/` | Põe ou tira uma conversa do projeto | P3 | A047 | **A barra final é obrigatória.** Sem ela, o Django redireciona e perde o corpo. |
| E44 | `GET /auria/organization/members` | Pessoas da empresa e o meu `public_uid` | P3 | A050, A052 | Usado para compartilhar, mencionar e montar membros de projeto. |
| E45 | `GET /auria/chat_importer/rag/documents?only_indexed=true` | Catálogo de documentos indexados | P3 | A053 | |
| E46 | `GET`/`PATCH`/`DELETE /auria/chat_importer/chats/{id}/rag/documents` | Vincula documentos à conversa | P3 | A053 | `PATCH {add, remove}`. Documentos escolhidos antes de a conversa existir entram numa fila e são vinculados depois. |
| E47 | `PUT …/rag/documents`, `POST …/rag/search`, `GET …/rag/preview` | Substituir, buscar, depurar | Não usar | — | O web não usa. |
| E48 | `GET /auria/web-search/settings[?chat_id]` | Preferências de busca na web (empresa, pessoa, conversa) | P2 | A033 | |
| E49 | `PUT /auria/web-search/preference` | Liga ou desliga por conversa | P2 | A033 | `{mode, revision, chat_id}`. Em 409 `revision_conflict`, reler. |
| E50 | `PUT /auria/web-search/company` | Política da empresa (admin) | Fora | — | Administração. |

### 3.7 Fora do `/auria`, mas usados pela tela Auria do web

| # | Método e caminho | O que faz | Fase | Tarefa | Observação |
| --- | --- | --- | --- | --- | --- |
| E51 | `GET {SETTINGS}/billing/subscription/?app=aatos` | Plano e saldo, para bloquear o envio antes | P2 | A044 | Depende da dúvida 4. |
| E52 | `GET /docs/departments/` | Lista de departamentos ("Buscar em…") | P3 | A053 | Vai como `department_id`. |
| E53 | `wss://<host>/ws/` | Eventos ao vivo (`chat.access_revoked`, `project.access_revoked`) | P3 | A051 | O servidor exige o header `Origin`. Se o React Native não mandar, passar `Origin: https://<host>`. Fecha com 4401 quando o token expira. |
| E54 | `GET /auth/whoami/`, `POST /auth/callback/` (no host do aatos) | Conferir o token; registro do primeiro login | P0 | P002 | Ver a seção 2. |
| E55 | `GET /tasks/team-members` | Seletor de @menção do web | Não usar | — | O E44 cobre. |
| E56 | `/integrations/mail`, `/news/*`, `/notifications/*`, push | E-mail, notícias e notificações | Fora | — | Specs próprias. O push precisa de backend, porque hoje só existe Web Push. |

### 3.8 Fora de escopo, sem uso no app

| Grupo | Endpoints | Motivo |
| --- | --- | --- |
| Importador do ChatGPT | `/auria/chat_importer` (POST/DELETE), `upload/init\|chunk\|complete`, `jobs`, `jobs/{id}`, `files/visualizer` | Fora de escopo na spec |
| Memória | `GET`/`POST /auria/memory`, `DELETE /auria/memory/{key}` | O web não tem tela; a memória é salva pela própria Auria na conversa |
| Compromissos | `/auria/commitments*` | O web não usa |
| Pesquisa | `/auria/research/*`, `/auria/company-research/*` | Onboarding e admin |
| Embeds | `/auria/embeds/*` | Widgets de outras telas do web |

## 4. Contrato do streaming (E01)

O formato de cada evento é `event: <nome>\ndata: <json>\n\n`. Não há keep-alive, e a resposta HTTP é sempre 200, mesmo quando há erro.

| Evento | Dados | O que o app faz |
| --- | --- | --- |
| `chat` | `{chat_id, user_message_uuid}` | Adota o id real **na hora**: troca o id temporário e salva como "última conversa". |
| `status` | `{phase: started\|thinking\|streaming, round?, mode?, scope?}` | Avança o painel de trabalho. Com escopo, `started` precisa ecoar `scope`; se não ecoar, aborta (A054). |
| `reasoning` | `{content, source: model\|preamble\|tool, tool?}` | Acrescenta ao raciocínio. Pedaços `model` se concatenam; os outros abrem linha nova. |
| `tool` | `{name, status: running\|done, ok?, service?}` | Etapa no painel. O rótulo e o ícone vêm de `service` (gmail, outlook, google-calendar…). |
| `delta` | `{content}` | Texto da resposta, em pedaços (o markdown chega parcial). |
| `delta_reset` | `{chars, reason}` | Apaga os últimos `chars` caracteres. Eles vêm **contados em code points do Python**: converter para UTF-16 antes de cortar a string em JS. |
| `web_status` | snapshot v2 (`execution_id`, `seq`, …) | Junta por `execution_id` e `seq`; mostra o andamento da busca. |
| `canvas` | `{action: created\|updated, document}` | Cartão de documento na resposta. |
| `canvas_proposal` | proposta | Cartão Aplicar/Rejeitar. |
| `assignment` | pessoas `needs_confirmation`/`assigned` | Chips de atribuição (só na sessão). |
| `done` | `{response, reasoning, canvas_documents, web, model, tokens…}` | Texto final, que é o que vale. |
| `saved` | `{chat_id, canvas_documents, canvas_proposals, user_message_uuid, assistant_message_uuid}` | Encerra a espera. O resto da conexão é drenado em segundo plano. |
| `error` | `{message, code, chat_id, partial, reason_code, required_tokens, stopped_reason, …}` | Mantém o texto parcial e mostra o erro do código (A003). |

- Se o stream terminar sem `done` nem `error`, é `connection_lost`.
- **Parar** é `AbortController.abort()`. O servidor não é avisado, e ações já feitas por ferramentas ficam feitas. O texto recebido fica com a marca "interrompida".

## 5. Erros (A003)

Corpos de erro possíveis:
- Auria: `{status, message, code, reason_code}`
- DRF: `{detail, code}`
- Integração: `{error}`

| HTTP / `code` | Mensagem no app | Ação |
| --- | --- | --- |
| 402 `insufficient_units` + `reason_code` (`pool_exhausted`, `no_active_plan`, `member_limit`, `billing_not_configured`) | Uma mensagem por `reason_code` | "Ver planos na web" ou "Peça a quem administra" |
| 503 `billing_unavailable`, 409 `billing_reservation_inactive` | Cobrança indisponível | Tentar de novo |
| 409 `reservation_conflict` / `operation_in_progress` / `operation_already_sent` | Auria ainda respondendo | Recarregar a conversa, sem reenviar |
| 504 `provider_timeout`, 429 `provider_rate_limited`, 502 `provider_unavailable`, 503 `ai_service_unavailable`, 502 `empty_response`, 500 `internal_error` | Mensagem específica | Tentar de novo |
| 400 `context_too_long` | Conversa longa demais | Nova conversa |
| 400 `content_blocked` | Conteúdo bloqueado | — |
| 422 `tool_limit_reached` | Limite de ferramentas | Tentar de novo |
| 403 `no_business_access` | Sem acesso à empresa | — |
| 403 "read-only" (conversa ou projeto) | Só leitura | Campo desabilitado |
| 401 | Renova uma vez; se falhar, vale a regra da 001 | — |
| 413 / 415 | Limite de 20 MB / tipos aceitos | — |
| 429 com `Retry-After` | Muitas ações seguidas | Esperar |
| Rede / `connection_lost` | Sem conexão / conexão perdida | Tentar de novo |

## 6. Arquitetura no app

> **Pré-requisito:** a `feature/001-login` mergeada na `develop` (P001). O cliente usa `sessionManager.getAccessToken()` e a renovação de
> `src/features/auth`, que só existem na `feature/001-login`.

### 6.1 Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/features/auria/api/config.ts` | `AURIA_API_URL`, `SETTINGS_URL`, timeouts |
| `src/features/auria/api/routes.ts` | Todos os caminhos da seção 3 (barra final do E43) |
| `src/features/auria/api/errors.ts` | `AuriaApiError {status, code, reasonCode, message}` + mapa código → mensagem/ação (seção 5) |
| `src/features/auria/api/http.ts` | `getJson`/`postJson`/`patchJson`/`del` e `upload` (XHR, para ter progresso). Bearer + uma renovação em 401, reaproveitando `src/features/auth` |
| `src/features/auria/api/sse.ts` | Leitor de SSE puro: bytes → eventos, com frames partidos entre chunks e UTF-8 multibyte |
| `src/features/auria/api/streamChat.ts` | `expo/fetch` + `sse.ts`; eventos tipados; `AbortSignal`; `connection_lost` |
| `src/features/auria/api/{chats,messages,attachments,canvas,projects,webSearch,org,rag,billing,realtime}.ts` | Um serviço por grupo da seção 3 |
| `src/features/auria/types.ts` | Tipos de domínio (substitui os atuais e os tipos espalhados em `src/data/auriaMockData.ts`) |
| `src/features/auria/mappers.ts` | API → domínio: mensagem, anexos extraídos do markdown, conversa e projeto |
| `src/features/auria/runReducer.ts` | Eventos do stream → estado da execução (texto, `delta_reset`, raciocínio, ferramentas, canvas, web) |
| `src/features/auria/prefs.ts` | Preferências no aparelho: modo Rápido/Profundo, última conversa |
| `src/features/auria/useAuriaConversation.ts` | Mensagens da conversa aberta, envio, parar, retry/edit, paginação |
| `src/features/auria/useAuriaChats.ts` | Lista de conversas, paginação, renomear/fixar/apagar |
| `src/features/auria/useAuriaAttachments.ts` | Fila de anexos do composer (validação, upload, progresso) |
| `src/features/auria/useAuriaProjects.ts`, `useWebSearchPreference.ts`, `useAuriaDocuments.ts` | P2/P3 |
| `src/features/auria/useAuriaWorkspace.ts` | Fica só com o estado de UI (painel, composer, modal). **Sai o roteador de respostas prontas** e saem os mocks de conversa |
| `src/components/auria/AuriaMarkdown.tsx` | Markdown com tokens do tema; tabela com rolagem horizontal; links; código |
| `src/components/auria/AuriaWorkPanel.tsx` | Painel "Trabalhando há Ns" (adapta `AuriaReasoningBlock` / `AuriaThinkingSheet`) |
| `src/components/auria/AuriaErrorNotice.tsx` | Aviso de erro acima do composer, com ação |
| `src/components/auria/AuriaWebEvidence.tsx`, `AuriaCitationChip.tsx` | P2 |
| `src/components/auria/AuriaDocumentReader.tsx`, `AuriaProposalCard.tsx` | P2 |
| `src/components/auria/AuriaShareSheet.tsx`, `AuriaMentionPicker.tsx`, `AuriaSourcesSheet` (RAG) | P3 |
| Telas existentes | `AuriaScreen`, `AuriaChatView`, `AuriaComposer`, `AuriaSidebar`, `AuriaCreateMenu`, `AuriaGalleryPanel`, `AuriaProjects*` passam a consumir os hooks |

### 6.2 Regras de estado

- **Uma resposta por vez.** Enquanto houver execução, o envio fica bloqueado. Cada turno leva um `client_operation_id` (uuid) para o servidor não duplicar.
- **Ids temporários.** A mensagem da pessoa aparece na hora com id local. `chat` e `saved` trocam pelos ids reais.
- **Ritmo do texto.** Um "pacer" revela o texto em 40–200 caracteres/s, como o web (`textPacer.ts`). Ele substitui o `useTypewriter` para mensagens reais.
- **Markdown em streaming.** Só o último bloco é re-renderizado. Um link pela metade mostra só o rótulo.
- **Segundo plano.** Ao voltar ao primeiro plano depois de uma resposta interrompida, a conversa é recarregada do servidor (E16).
- **Recarga depois de ações.** Depois de `regenerate`/`edit`, o app recarrega as mensagens; o servidor é a fonte da verdade.

### 6.3 Dependências novas (princípio VII)

| Pacote | Por quê | Alternativa rejeitada |
| --- | --- | --- |
| `react-native-markdown-display` (ou `react-native-marked`, decidido na P004) | A resposta é GFM: tabelas, listas e código. Escrever um renderizador é muito trabalho. Os dois são JS puro e rodam no Expo Go. | Renderizador próprio |
| `@react-native-async-storage/async-storage` | Preferências que sobrevivem ao reinício (modo, última conversa). Está no Expo Go. | `expo-secure-store`, que é para segredos e tem limite de tamanho |
| `expo-file-system` + `expo-sharing` | Baixar um anexo privado com Bearer e abrir ou compartilhar o arquivo. Estão no Expo Go. | Abrir uma URL no navegador, que não manda o Bearer |
| `react-native-webview` (só P2, A040) | Documentos em formato `html`. Está no Expo Go. | Converter HTML para nativo, que perde a formatação |
| `expo/fetch` | Já vem no `expo`; dá corpo em stream no Android. | `react-native-sse`, que só faz GET |

Sem módulo nativo fora do Expo Go.

## 7. Riscos e alternativas

| Risco | Mitigação |
| --- | --- |
| `expo/fetch` entregar o stream em blocos grandes (buffer) no Android/Expo Go | Spike P003 antes de tudo. Plano B: `XMLHttpRequest` com `onprogress` (lê `responseText` incremental). |
| O token do app não ser aceito pelo host escolhido (chave pública diferente entre dev e prod) | P002 confere com `GET /auth/whoami/`. Se falhar, escolher o host que casa com o Authenticator de produção. |
| Conta sem empresa ou sem `auria.write` | P002 mostra; o app trata 403 com mensagem (A027). |
| `delta_reset` cortar errado com emoji ou acentos | Conversão de code points para UTF-16 com teste dedicado (A008). |
| Componente `AuriaScreen` (566 linhas) e o reducer atual ficarem grandes demais | Dividir ao ligar os hooks (princípio VII). |
| O web muda o contrato (eventos novos) | O leitor ignora evento desconhecido; registrar a versão do backend testada na V003. |
| Salvar imagem na galeria pelo Expo Go (limites do `expo-media-library` no Android) | Nesta spec: compartilhar (o Android oferece "Salvar"). Salvar direto, só se funcionar no Expo Go. |
| Push de "imagem pronta" e lembretes | Fora de escopo: precisa de registro FCM no backend, porque hoje só há Web Push. |

## 8. Verificação da constituição

| Princípio | Atende? | Observação |
| --- | --- | --- |
| I. Spec primeiro | ✅ | Spec 002, com dúvidas abertas antes de implementar |
| II. Android primeiro | ✅ | Tudo no Expo Go; spikes P003/P004 no emulador |
| III. Design system | ✅ | Markdown, painéis e avisos com tokens de `src/theme`; claro e escuro |
| IV. Dados atrás de uma camada | ✅ | `src/features/auria/api` + hooks; as telas deixam de importar `src/data/auria*` (A019, A045, A055, A056) |
| V. Acessibilidade | ✅ | Labels nos controles novos; o texto em streaming não é relido a cada pedaço (anunciar só no fim) |
| VI. Qualidade verificável | ✅ | Testes de `sse`, `runReducer`, `mappers`, `errors` e validação de anexos; passos manuais por história |
| VII. Simplicidade | ⚠️ | Quatro dependências novas, justificadas em 6.3 |

## 9. Estratégia de testes

- **Unitário (Jest):**
  - `sse.ts`: frames partidos, várias mensagens num chunk, UTF-8 multibyte, evento desconhecido.
  - `runReducer.ts`: sequência real gravada de um turno, `delta_reset` com emoji, erro com parcial, `saved`.
  - `mappers.ts`: mensagem de texto, imagem, multimodal, anexos no markdown.
  - `errors.ts`: os três formatos de corpo e todos os códigos da seção 5.
  - Validação de anexos: tamanho e tipo.
- **Fixtures:** respostas e um stream reais gravados do servidor de dev, sem dados pessoais, em `src/features/auria/__fixtures__/`.
- **Manual (emulador, Expo Go):** um roteiro por história (V001, V003), incluindo conferir na web a mesma conversa.

## 10. Ordem de implementação

| # | Etapa | Saída |
| --- | --- | --- |
| 0 | P001–P004 | `feature/001-login` mergeada na `develop`; host e token confirmados; streaming e markdown provados no emulador |
| 1 | Fundação (A001–A009) | Cliente HTTP, SSE, erros, tipos, reducer, com testes |
| 2 | P1: H1, H2, H3, H4, H5 (A010–A028) | Auria real conversando, histórico e anexos → V001 |
| 3 | P2: H6, H7, H8, H9, gate (A029–A044) | Paridade de conteúdo com a web |
| 4 | P3: H10, H11, H12 (A045–A055) | Organização e contexto |
| 5 | Acabamento (A056, V002–V004) | Mocks removidos, spec Implementada |
