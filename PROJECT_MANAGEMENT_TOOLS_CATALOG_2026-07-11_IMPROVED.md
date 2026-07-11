# MyCEO Projects — Catálogo de Ferramentas (versão melhorada)

**Base analisada:** `PROJECT_MANAGEMENT_TOOLS_CATALOG_2026-07-11.md`  
**Data da análise:** 2026-07-11  
**Âmbito:** 57 ferramentas de gestão de projetos

## 1. Resumo executivo

O catálogo original é uma excelente auditoria técnica: identifica maturidade, persistência, dependências e integrações. O principal problema é que descreve muito bem o estado atual, mas não transforma os achados numa sequência de produto. Esta versão acrescenta essa camada de decisão.

### Diagnóstico geral

1. **A base funcional é forte:** a maioria das ferramentas já tem CRUD, filtros, exportação e persistência local.
2. **O maior risco é arquitetural:** existem muitas chaves `localStorage`, formatos duplicados e ferramentas que leem dados de outra ferramenta sem um contrato comum.
3. **A maior perda de valor é integração:** riscos, issues, decisões, stakeholders, RACI, recursos, formulários e comunicação não estão ligados de forma consistente às entidades reais do projeto.
4. **A maior dívida de confiança é identidade:** há utilizadores hardcoded, owners em texto livre, approvers fictícios e dados de demonstração em várias ferramentas.
5. **A maior limitação comercial é colaboração:** sem backend, autenticação, sincronização multiutilizador, uploads reais e notificações reais, o produto comporta-se como uma aplicação local avançada.
6. **Há um risco de segurança explícito:** o catálogo regista credenciais GitHub/PAT em `localStorage` e em plaintext.

## 2. Melhorias prioritárias

| Prioridade | Problema | Melhoria funcional | Ferramentas abrangidas | Critério de aceitação |
|---|---|---|---|---|
| P0 | PAT GitHub em plaintext | Remover segredo do browser; usar vault/backend e rotação | Source, Settings | Nenhum token sensível em `localStorage`, logs ou exportações |
| P0 | Estado apenas local | Criar API de sincronização por projeto com autenticação e controlo de versão | Todas | Dois utilizadores veem a mesma alteração sem refresh manual |
| P0 | Identidade hardcoded | Centralizar `currentUser`, membros, roles e permissões | Approvals, Milestones, Changelog, Issues, Risks, RACI, Resources | Owner/approver selecionado de membros reais; auditoria com utilizador real |
| P1 | Contratos de dados fragmentados | Criar entidades canónicas: Task, Member, Milestone, Risk, Issue, Decision, File, Event | Todas | Uma alteração numa entidade propaga-se para as ferramentas consumidoras |
| P1 | Eventos incompletos | Event bus/audit append-only com eventos para criação, edição, remoção e relações | Tasks, Kanban, Timeline, Activity, Audit, Insights | Toda alteração importante aparece no Activity/Audit com antes/depois |
| P1 | Dependências isoladas | Escrever dependências no modelo de Task, com lag e validação de ciclos | Dependencies, Timeline, Calendar, Sprints | Dependência criada numa ferramenta aparece nas restantes |
| P1 | Formulários sem runtime/persistência | Persistir builder, publicar formulário, aceitar respostas e disparar ações | Forms, Tasks, Approvals, Changelog | Resposta real cria a ação configurada e fica auditada |
| P1 | Partilha fictícia | Implementar portal autenticado, links revogáveis, permissões e comentários | Clients, Client Portal, Files, Documents | Link partilhado abre conteúdo autorizado e pode ser revogado |
| P2 | Recursos/workload heurísticos | Ligar capacidade a disponibilidade, skills, férias, rate e calendário | HR Capacity, Workload, Resources, Time Tracking | Capacidade calculada por membro e explicável por fonte |
| P2 | Demo seed misturado com produção | Separar fixtures de demonstração, onboarding e dados reais | Approvals, Discussion, Roadmap, Documents | Ambiente vazio não recebe dados fictícios silenciosamente |
| P2 | Exportações frágeis | Biblioteca comum para CSV/ICS/PDF com escaping, timezone e esquema | Roadmap, Procurement, Calendar, Reports | CSV suporta aspas, vírgulas, acentos e round-trip sem perda |

## 3. Arquitetura funcional recomendada

### 3.1 Fonte única de verdade

Substituir a escrita direta de `localStorage` por uma camada de repositórios:

```text
UI → domínio/hooks → repositories → API/cache local → event log
```

Cada repositório deve ter `list`, `get`, `create`, `update`, `delete`, `subscribe` e `schemaVersion`. O `localStorage` pode continuar como cache/offline, mas deixa de ser a base de negócio.

### 3.2 Entidades e relações mínimas

- `Project` contém membros, ferramentas ativas e configurações.
- `Task` suporta assignee, dependencies, milestone, sprint, deliverable, issue, goal e time entries.
- `Member` é a única fonte para owner, approver, responsável e capacidade.
- `Event` regista autor, timestamp, entidade, operação, valores anterior/novo e origem.
- `File` tem armazenamento real, versões, permissões e links expirados.
- `Decision`, `Risk`, `Issue` e `Change` devem aceitar links reais para tarefas e entregáveis.

### 3.3 Segurança e confiança

- autenticação e autorização no servidor;
- segregação por workspace/projeto;
- RBAC aplicado no backend, não apenas ocultando botões;
- validação de payloads e migrações versionadas;
- auditoria imutável para ações sensíveis;
- remoção de tokens e segredos do browser;
- classificação visual clara entre **real**, **preview**, **demo** e **não disponível**.

## 4. Melhorias por domínio

### Execution

**Tasks, Kanban, Calendar, Timeline, Dependencies, Sprints, Milestones, Deliverables, Workload e Time Tracking** devem operar sobre o mesmo modelo de tarefa. Prioridade imediata: corrigir toggles visuais do Kanban, persistir estados de layout, passar `projectId` corretamente ao Calendar, ligar dependências ao Task, substituir o critical path heurístico por CPM partilhado e permitir timesheets por membro real.

### Strategy

**Approvals, Change Log, Decisions, Goals, Issues, Risks, Roadmap, Scope, Stakeholders, RACI e Resources** precisam de relações reais. Prioridade imediata: owners/approvers via membros, histórico de alterações, board com drag-and-drop quando anunciado, links task/milestone e persistência de Resources/Stakeholders/Forms.

### Collaboration

**Clients, Client Portal, Discussion, Documents, Files, Knowledge, Media, Meetings e Forms** devem sair do modo single-browser. Prioridade imediata: backend de ficheiros, versionamento binário, comentários sincronizados, portal autenticado, respostas de formulários e notificações reais.

### Intelligence e reporting

**Activity, AI Report, Audit, Insights, Workflow Intelligence, Standup, Burndown, PDF Report e Timeline Replay** devem consumir o mesmo event log. O AI Report deve manter a honestidade atual: primeiro dados completos e rastreáveis, depois IA com indicação de fontes e confiança.

## 5. Roadmap recomendado

### Onda 1 — Fundação e segurança

- corrigir encoding e normalizar documentação;
- remover PAT/segredos do `localStorage`;
- criar schemas e migrações;
- implementar `currentUser`, membros e RBAC real;
- definir repositórios e event log;
- eliminar dados demo silenciosos.

### Onda 2 — Operação integrada

- API para Tasks, Members, Milestones, Risks, Issues e Files;
- dependências partilhadas com CPM único;
- Activity/Audit com before/after;
- owners e links reais em todas as ferramentas;
- sincronização e tratamento de conflitos.

### Onda 3 — Colaboração e cliente

- portal autenticado;
- comentários e menções em tempo real;
- uploads/versionamento reais;
- Forms com publicação, respostas e automações;
- notificações e email transacional.

### Onda 4 — Inteligência e escala

- capacidade por membro, calendário e time tracking;
- forecasts baseados em histórico real;
- AI Report com fontes, explicações e aprovação humana;
- analytics cross-project;
- testes de carga, observabilidade e retenção de dados.

## 6. Definition of Done transversal

Uma ferramenta só deve ser marcada como **real** quando:

- os dados sobrevivem a reload, logout/login e mudança de dispositivo;
- o estado é validado por schema e tem migração;
- permissões são verificadas no servidor;
- alterações relevantes geram evento auditável;
- relações com entidades partilhadas são bidirecionais;
- não depende de dados fictícios para mostrar o estado normal;
- exportações preservam acentos, timezone e relações;
- existe teste de unidade, integração e fluxo crítico;
- o estado offline e conflitos têm comportamento definido.

## 7. Métricas de sucesso

- 0 segredos em `localStorage`;
- 100% das ações sensíveis auditadas com utilizador real;
- ≥95% das ferramentas operacionais ligadas a entidades canónicas;
- 0 owners/approvers em texto livre onde existe membro elegível;
- sincronização visível entre dois clientes em menos de 2 segundos;
- 0 dados demo em projetos de produção;
- exportações CSV/ICS/PDF validadas com round-trip;
- cobertura de testes dos fluxos P0/P1 ≥80%.

## 8. Conclusão

O produto não precisa principalmente de mais ferramentas. Precisa de transformar as 57 ferramentas existentes num sistema coerente: uma fonte única de verdade, identidade real, eventos completos, colaboração multiutilizador e integrações sem mocks. A sequência correta é segurança e fundação, depois integração operacional, depois portal/colaboração e só então inteligência avançada.

O catálogo original deve permanecer como evidência detalhada. Este documento deve ser usado como camada de decisão para backlog, arquitetura e priorização.
