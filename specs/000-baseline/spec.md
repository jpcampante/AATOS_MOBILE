# Spec — 000 Baseline do AATOS Mobile

| Campo | Valor |
| --- | --- |
| ID | `000-baseline` |
| Status | Aprovada (descreve o estado atual) |
| Data | 2026-10-15 |

> Esta spec é diferente das demais: ela **documenta o app como ele está hoje**
> (protótipo funcional só de frontend) e define a visão do produto. Features
> novas partem daqui e citam os requisitos abaixo quando os alteram.

## 1. Visão do produto

O **AATOS Mobile** é o app de bolso do AATOS: um centro de comando para quem
gere uma empresa. Reúne em um só lugar os indicadores da empresa, uma
assistente de IA (**Auria**), as tarefas e a caixa de e-mail, agenda e contatos.
A Auria conecta tudo: sugere tarefas, resume e-mails e responde perguntas sobre
os dados da empresa.

Público: fundadores, gestores e equipes de operação (persona de referência:
**Marta**, gestora que acompanha várias áreas da empresa pelo celular).

Plataforma: **Android** (decisão de 2026-10-15). iOS está fora do escopo; o web
serve só como preview durante o desenvolvimento.

## 2. Estado atual em uma frase

Toda a interface existe e é navegável, mas **não há backend, autenticação nem
persistência**: os dados são simulados e se perdem ao recarregar. A única
fonte de dados real é o feed de notícias do Discover.

## 3. Áreas e comportamento atual

Legenda de status: ✅ funciona de verdade · 🟡 funciona com dados simulados · ❌ só visual

### 3.1 Entrada (Login)

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-LOG-01 | Abertura animada: logo, título rotativo ("Move faster"…) e painel inferior. | ✅ |
| RF-LOG-02 | Entrar com e-mail + código (cadastro pede nome). | ✅ desde a [001-login](../001-login/spec.md) |
| RF-LOG-03 | Sair da conta pelos Ajustes. | ✅ desde a 001-login |

### 3.2 Navegação

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-NAV-01 | Barra inferior flutuante com 5 abas: Insights, Auria, Tasks, Integrations, Settings. | ✅ |
| RF-NAV-02 | "Settings" abre os Ajustes como janela sobre a aba atual. | ✅ |
| RF-NAV-03 | Voltar com gesto da borda esquerda, seguindo o histórico de abas. | ✅ |
| RF-NAV-04 | Outras áreas abrem a Auria já com uma pergunta preenchida. | ✅ |

### 3.3 Insights (início)

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-INS-01 | Explorador de métricas: escopo (empresa/equipe/eu), período (semana/mês/trimestre), métrica e comparação de duas métricas no gráfico. | 🟡 8 métricas simuladas |
| RF-INS-02 | Resumo executivo: saudação, maiores variações, principal bloqueio e nota de saúde da empresa com detalhamento. | 🟡 |
| RF-INS-03 | "Precisa de você": sinais filtráveis (precisa de você / riscos / todos), cada um com ações que levam a outra aba ou à Auria. | 🟡 7 sinais simulados |
| RF-INS-04 | Impacto da Auria: taxa de aceite das sugestões e tempo economizado. | 🟡 taxa de aceite é real dentro da sessão |
| RF-INS-05 | Personalizar o início: reordenar cartões arrastando, ocultar seções, fixar gráficos de métricas, restaurar padrão. | 🟡 não persiste |
| RF-INS-06 | Todo número mostra de onde vem (amostra, estimado, local, ao vivo). | ✅ |

### 3.4 Auria (assistente de IA)

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-AUR-01 | Conversa com resposta em streaming, raciocínio ("Thinking") com etapas e fontes, chips de fontes. | 🟡 respostas prontas escolhidas por palavra-chave |
| RF-AUR-02 | Ações na mensagem: copiar, ler em voz alta, compartilhar, tentar de novo, pensar mais, buscar na web, ramificar em nova conversa. | ✅ copiar/ler/compartilhar · 🟡 demais |
| RF-AUR-03 | Escolher o modelo de IA (Claude, GPT, Gemini). | ❌ não muda a resposta |
| RF-AUR-04 | Anexar foto da câmera, fotos da galeria e arquivos. | ✅ captura · 🟡 o anexo não é processado |
| RF-AUR-05 | Criar documento a partir de 8 modelos (contrato, NDA, proposta…) e editar com formatação. | 🟡 edição só local |
| RF-AUR-06 | Criar e editar imagem (proporção, remover com pincel). | ❌ sempre a mesma imagem de exemplo |
| RF-AUR-07 | Modo de voz com visualização do microfone e transcrição ao vivo. | ✅ microfone · ❌ transcrição não funciona no Android (só no web) · 🟡 respostas roteirizadas |
| RF-AUR-08 | Histórico de conversas, busca e conversas fixadas na barra lateral. | 🟡 |
| RF-AUR-09 | Galeria de arquivos e imagens: enviar, buscar, ordenar, renomear, mover para projeto, apagar. | 🟡 não persiste; links de compartilhamento fictícios |
| RF-AUR-10 | Projetos: criar (nome, ícone, descrição, visibilidade, fontes), filtrar, compartilhar, apagar. | 🟡 |
| RF-AUR-11 | Discover: notícias por categoria, resumo expandido com fontes, ouvir, curtir, seguir perguntando, preferências de tópicos que reordenam o feed. | ✅ notícias reais (RSS BBC/Guardian) · 🟡 resumo montado a partir de artigos vizinhos |
| RF-AUR-12 | Ajustes da Auria: tema claro/escuro/sistema, status do Liquid Glass, preferências do feed. | ✅ tema (não persiste) |

### 3.5 Tasks

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-TSK-01 | Resumo das tarefas feito pela Auria, com atalho para revisar sugestões. | 🟡 |
| RF-TSK-02 | Filtrar por área (AATOS, Finance, Legal, Sales) e por estado (hoje, atrasadas, sugeridas pela IA, aguardando). | 🟡 |
| RF-TSK-03 | Cartão de tarefa com prioridade, estado, prazo, origem, progresso e motivo do bloqueio; marcar como feita / desfazer. | 🟡 |
| RF-TSK-04 | Criar tarefa (título, descrição, área, prioridade). | 🟡 não persiste |
| RF-TSK-05 | Revisar sugestões de tarefas da Auria e aceitar, o que alimenta RF-INS-04. | 🟡 |
| RF-TSK-06 | Ver o detalhe de uma tarefa. | ❌ não existe |

### 3.6 Integrations (e-mail, agenda, contatos)

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-INT-01 | Caixa de entrada com pastas, busca, estrela, e gestos: arrastar para arquivar ou apagar, com desfazer. | 🟡 |
| RF-INT-02 | Ler e-mail: arquivar, apagar, marcar não lido, reações, responder. | 🟡 a maioria do menu "mais" só mostra aviso |
| RF-INT-03 | Escrever e-mail com "Help me write"; enviar coloca na pasta Enviados. | 🟡 nada é enviado de fato |
| RF-INT-04 | Agenda mensal com eventos do dia. | 🟡 |
| RF-INT-05 | Contatos com busca. | 🟡 |
| RF-INT-06 | Conectar contas reais (Gmail, Outlook, calendário). | ❌ não existe |

### 3.7 Ajustes (aba Settings)

| ID | Comportamento | Status |
| --- | --- | --- |
| RF-SET-01 | Perfil, plano, personalização, memória, apps, notificações, voz, dados, ajuda. | ❌ quase tudo só visual |

## 4. Requisitos não funcionais (vigentes)

| ID | Requisito | Situação hoje |
| --- | --- | --- |
| RNF-01 | Funciona no Android e abre no Expo Go. | ✅ verificado no emulador (Android 17) |
| RNF-02 | Tema claro e escuro em todas as telas. | 🟡 Login fixo em branco/preto; `app.json` força modo claro no nativo |
| RNF-03 | ~~Liquid Glass nativo no iOS 26+~~ — fora do escopo (iOS removido). No Android vale a superfície alternativa. | — |
| RNF-04 | Controles só com ícone são acessíveis por leitor de tela. | 🟡 revisado na Auria; demais áreas não auditadas |
| RNF-05 | Preferências do usuário (tema, layout do início, feed) sobrevivem ao reinício do app. | ❌ |
| RNF-06 | Nenhum dado pessoal real ou segredo no código. | ❌ há e-mail e telefone com aparência real em mocks |
| RNF-07 | Mudanças verificadas por typecheck e testes automatizados. | 🟡 só typecheck |

## 5. Entidades do domínio

- **Usuário**: nome, e-mail, plano. Hoje fixo ("Marta"), com inconsistências entre áreas.
- **Métrica**: série por escopo e período, unidade, direção boa, fonte do dado.
- **Sinal**: alerta de uma área (tarefas, e-mail, Auria, agenda, projetos), com severidade e ações.
- **Conversa / Mensagem**: papel, texto, anexos, artefato (documento ou imagem), raciocínio, fontes.
- **Projeto**: nome, ícone, descrição, visibilidade, conversas e arquivos.
- **Item da galeria**: arquivo ou imagem com tipo, tamanho, origem.
- **Artigo (Discover)**: título, resumo, tópicos, fontes.
- **Tarefa**: título, estado, prioridade, prazo, origem, responsável, área, progresso, sugestão da IA.
- **E-mail**: remetente, assunto, pasta, lido, estrela, rótulos.
- **Evento** e **Contato**.

## 6. Roadmap de specs (próximas features)

Cada item vira uma pasta `specs/NNN-slug` com `/sdd-specify`. A ordem é uma
proposta e depende das dúvidas da seção 7.

| Nº sugerido | Feature | Resolve |
| --- | --- | --- |
| 001 | Autenticação real e sessão do usuário | RF-LOG-02, RF-LOG-03, entidade Usuário |
| 002 | Persistência local de preferências | RNF-05 |
| 003 | Backend de tarefas (CRUD + detalhe da tarefa) | RF-TSK-*, RF-TSK-06 |
| 004 | Auria com LLM real (via backend próprio) | RF-AUR-01, RF-AUR-03, RF-AUR-04 |
| 005 | Integração de e-mail e agenda (OAuth) | RF-INT-* |
| 006 | Insights com dados reais | RF-INS-01..04 |
| 007 | Ajustes funcionais | RF-SET-01 |

## 7. Dúvidas em aberto

Estas respostas definem as specs 001–007; a baseline em si não depende delas.

- [ ] [PRECISA ESCLARECER: qual backend? O app web do AATOS já tem um (os dados citam Supabase)? O mobile deve usar a mesma API?]
- [ ] [PRECISA ESCLARECER: autenticação — quais provedores no lançamento (Apple, Google, e-mail)?]
- [ ] [PRECISA ESCLARECER: a Auria chama o LLM por um backend próprio? Quais modelos ficam de fato disponíveis?]
- [ ] [PRECISA ESCLARECER: idioma da interface — inglês (atual), português, ou os dois?]
- [ ] [PRECISA ESCLARECER: o lançamento é na Play Store ou interno (APK / teste interno)?]
