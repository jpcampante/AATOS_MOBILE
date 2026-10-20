# Spec — 002 Auria real (paridade com a web)

| Campo | Valor |
| --- | --- |
| ID | `002-auria-real` |
| Branch | `develop` (sem branch de feature; depois `develop` → `main`) |
| Status | Aprovada (2026-10-20) — entrega em duas versões: v1 = P1 + P2, v2 = P3 |
| Data | 2026-10-20 |
| Substitui | RF-AUR-01, RF-AUR-02, RF-AUR-03, RF-AUR-04, RF-AUR-05, RF-AUR-06, RF-AUR-08, RF-AUR-09, RF-AUR-10 da [baseline](../000-baseline/spec.md) (item 004 do roadmap) |
| Depende de | [001-login](../001-login/spec.md) (sessão real) mergeada na `develop` |

> A spec descreve **o quê** e **porquê**. Endpoints, arquivos e bibliotecas
> estão no [plan.md](./plan.md).

## 1. Contexto e problema

O AATOS Mobile existe para levar a **Auria**, a IA do produto, para o celular.
Hoje a Auria do app é uma simulação: as respostas são textos prontos escolhidos
por palavra-chave, as conversas não são salvas, os anexos nunca saem do
celular e a imagem gerada é sempre a mesma.

Na web (`aatos`), a Auria já funciona de verdade, sobre o backend `aatos-auria`
(servido pelo `aatos-system`). Ela responde em tempo real, usa ferramentas
(tarefas, e-mail, agenda, contatos, documentos, busca na web, memória), salva
as conversas, aceita anexos, gera imagens e cria documentos.

Desde a 001 a pessoa entra no app com a mesma conta da web. Falta a Auria do
app conversar com o **mesmo backend**: a mesma conversa deve aparecer nos dois
lugares, com o mesmo resultado.

## 2. Objetivos

- O1 — Conversar com a Auria real, com a resposta aparecendo enquanto é gerada.
- O2 — Ver e continuar no celular as mesmas conversas da web, e vice-versa.
- O3 — Enviar fotos, fotos da câmera e arquivos para a Auria analisar.
- O4 — Ver o que a Auria está fazendo (pensando, usando ferramentas, buscando na web) e as fontes que usou.
- O5 — Gerar imagens e documentos pela Auria e abri-los no celular.
- O6 — Organizar conversas como na web: renomear, fixar, apagar, projetos e compartilhamento.
- O7 — Entender claramente por que algo falhou (sem créditos, sem permissão, sem rede, serviço fora) e o que fazer.

### Fora de escopo

- Importar conversas do ChatGPT (arquivo .zip).
- Biblioteca "Essentials" (Docs/Sheets/Slides fora do chat, pastas, lixeira).
- Notícias pelo backend `/news` (o Discover do app continua como está; vira spec própria).
- Cartão de rascunho de e-mail e envio de e-mail pelo chat (depende da spec de integrações).
- Compromissos (commitments), relatórios de pesquisa, widgets "embeds" e tela de memória.
- Notificações push no celular (o backend só tem Web Push; precisa de trabalho no backend).
- Comando de voz e transcrição (o backend não tem endpoint; na web o microfone também não funciona).
- Edição de imagem (remover com pincel) — não existe no backend.
- Escopos de módulo de Vendas (`/sales`) e atalhos de formulários de Vendas.
- Edição manual de documentos e "pedir mudança" num trecho (D-07).
- Escolha de modelo de IA (Claude/GPT/Gemini): o backend não permite; fica só Rápido/Profundo (D-06).

## 3. Usuários e cenários

Persona: **pessoa usuária do AATOS** (já usa a web, tem conta e empresa).

### História 1 — Conversar com a Auria (P1)

Como **pessoa usuária**, quero **mandar uma mensagem e ver a resposta sendo
escrita** para **trabalhar com a Auria no celular como faço na web**.

1. **Dado** que estou na Auria sem conversa aberta, **quando** envio uma mensagem,
   **então** uma conversa nova é criada no servidor e a resposta começa a aparecer em poucos segundos, pedaço por pedaço.
2. **Dado** que a resposta tem listas, títulos, negrito, tabelas, código ou links,
   **então** ela aparece formatada (não como texto cru com `**` ou `#`).
3. **Dado** que a Auria está respondendo, **quando** toco em "Parar",
   **então** a resposta para, o texto já recebido fica na tela com a marca "interrompida", e posso enviar outra mensagem.
4. **Dado** que a Auria está respondendo, **então** não consigo enviar outra mensagem na mesma conversa até ela terminar ou eu parar.
5. **Dado** que escolhi o modo **Rápido** ou **Profundo**, **quando** envio,
   **então** a Auria responde no modo escolhido, e a escolha fica salva para as próximas mensagens.
6. **Dado** que a resposta terminou, **então** posso copiar, ouvir em voz alta e compartilhar o texto.
7. ~~"Ask Auria" vindo de Insights~~ — removido: Insights saiu do app (spec 003).

### História 2 — Ver o trabalho da Auria (P1)

Como **pessoa usuária**, quero **ver o que a Auria está fazendo enquanto
responde** para **confiar no resultado e entender a demora**.

1. **Dado** que a Auria está respondendo, **então** vejo o estado atual ("Pensando", "Usando Tarefas", "Buscando na web"…) e há quanto tempo ela está trabalhando.
2. **Dado** que a Auria usou ferramentas, **quando** abro o detalhe, **então** vejo a lista de etapas (ferramenta, serviço — Gmail, Outlook, Agenda… — e se deu certo).
3. **Dado** que a resposta já terminou ou reabri a conversa depois, **quando** toco em "Pensamento", **então** vejo o raciocínio salvo.

### História 3 — Histórico de conversas (P1)

Como **pessoa usuária**, quero **ver minhas conversas da web no celular** para
**continuar de onde parei em qualquer lugar**.

1. **Dado** que abro a barra lateral, **então** vejo minhas conversas, as fixadas primeiro e as demais da mais recente para a mais antiga, carregando mais ao rolar.
2. **Dado** que toco numa conversa, **então** vejo as últimas mensagens dela e posso carregar as anteriores.
3. **Dado** que continuo uma conversa no celular, **quando** abro a mesma conversa na web, **então** vejo as mensagens novas, e vice-versa.
4. **Dado** que nunca conversei com a Auria, **então** vejo um estado vazio amigável, não um erro.
5. **Dado** que estou numa conversa, **quando** renomeio, fixo/desafixo ou apago (com confirmação), **então** a mudança vale também na web.
6. **Dado** que reabro o app, **então** volto para a última conversa aberta.

### História 4 — Anexos (P1)

Como **pessoa usuária**, quero **mandar fotos, fotos da câmera e arquivos** para
**a Auria analisar o conteúdo**.

1. **Dado** que escolhi uma foto da galeria, tirei uma foto ou escolhi um arquivo (PDF, TXT, MD, CSV, DOCX, XLSX, JSON),
   **quando** envio a mensagem, **então** o arquivo é enviado ao servidor e a Auria responde considerando o conteúdo.
2. **Dado** que um anexo está sendo enviado, **então** vejo o progresso e posso removê-lo antes de mandar a mensagem.
3. **Dado** que o arquivo tem mais de 20 MB ou um tipo não aceito, **então** vejo a mensagem do limite e ele não é enviado.
4. **Dado** que abro uma conversa com imagens anexadas (inclusive pela web), **então** vejo as imagens, e posso abrir os arquivos.

### História 5 — Erros, créditos e permissões (P1)

Como **pessoa usuária**, quero **saber por que a Auria não respondeu e o que
fazer** para **não ficar sem saída**.

1. **Dado** que os créditos da empresa acabaram (ou não há plano ativo), **quando** abro a Auria ou tento enviar, **então** o envio fica bloqueado **antes** de ir ao servidor e vejo um aviso em inglês de que os créditos acabaram, com "Comprar créditos na web" ou "Peça a quem administra a empresa", conforme meu papel.
1a. **Dado** que o servidor recusar por falta de créditos mesmo assim (saldo mudou no meio), **então** vejo o mesmo aviso.
2. **Dado** que caí sem internet no meio da resposta, **então** o texto recebido fica, vejo "Conexão perdida" e "Tentar de novo".
3. **Dado** que a conversa é só leitura para mim, **então** o campo de mensagem fica desabilitado com o motivo.
4. **Dado** que o serviço está indisponível, demorou demais ou a conversa ficou longa demais, **então** vejo a mensagem específica (e "Nova conversa" quando for o caso).
5. **Dado** que não tenho acesso à Auria na empresa, **então** vejo a explicação em vez de uma tela quebrada.

### História 6 — Tentar de novo e editar (P2)

1. **Dado** uma resposta da Auria, **quando** toco em "Tentar de novo", **então** uma nova resposta substitui a anterior.
2. **Dado** uma mensagem minha, **quando** edito e confirmo, **então** a Auria responde de novo a partir da mensagem editada.
3. **Dado** que existem várias versões de uma resposta, **então** posso alternar entre elas (`< 2/3 >`).
4. **Dado** uma resposta, **quando** marco "gostei", **então** a marca fica salva.

### História 7 — Busca na web e fontes (P2)

1. **Dado** que a busca na web está ligada para a conversa, **quando** a Auria busca, **então** vejo o andamento da busca e, no fim, os cartões das fontes (título, site, data, imagem).
2. **Dado** que a resposta tem marcas de citação, **então** elas viram chips tocáveis que abrem a fonte.
3. **Dado** que desligo a busca na web, **então** a escolha fica salva para aquela conversa (também na web).
4. **Dado** que a empresa desligou a busca na web, **então** a opção aparece desabilitada com o motivo.

### História 8 — Criar imagens (P2)

1. **Dado** que estou no modo "Criar imagem", **quando** envio a descrição, **então** a imagem gerada aparece na conversa.
2. **Dado** uma imagem gerada, **então** posso abri-la em tela cheia, salvar e compartilhar.
3. **Dado** que reabro a conversa, **então** a imagem gerada continua lá.

### História 9 — Documentos da Auria (P2)

1. **Dado** que peço "crie um documento / planilha / apresentação", **então** a Auria cria o arquivo e um cartão dele aparece na resposta.
2. **Dado** um cartão de documento, **quando** toco, **então** abro o documento para leitura no celular (texto, tabela de planilha ou slides).
3. **Dado** que a Auria propõe uma mudança num documento, **então** vejo a proposta e posso **Aplicar** ou **Rejeitar**.
4. **Dado** uma conversa, **então** vejo a lista dos documentos criados nela.
5. **Dado** um documento aberto, **então** ele é só leitura: não há edição manual nem "pedir mudança" no leitor (para mudar, peço à Auria na conversa).

> **Histórias 10 a 12 são da segunda versão (v2)** — D-09. Na v1, os painéis
> correspondentes ficam ocultos.

### História 10 — Projetos (P3)

1. **Dado** que abro Projetos, **então** vejo os projetos da web com suas conversas.
2. **Quando** crio, renomeio, mudo a visibilidade (privado/empresa) ou apago um projeto, **então** a mudança vale na web.
3. **Quando** adiciono ou tiro uma conversa de um projeto, **então** ela aparece/some do projeto.
4. **Quando** convido ou removo pessoas de um projeto privado, **então** elas ganham/perdem acesso.

### História 11 — Compartilhar conversas (P3)

1. **Dado** que sou dono de uma conversa, **quando** mudo a visibilidade (privada/empresa), **então** a mudança vale na web.
2. **Quando** compartilho com uma pessoa da empresa como leitor ou editor, **então** ela passa a ver a conversa; e posso remover o acesso.
3. **Dado** que perdi o acesso a uma conversa aberta, **então** ela some da lista e é fechada com um aviso.

### História 12 — Contexto da conversa (P3)

1. **Quando** menciono um colega com `@`, **então** a Auria responde com foco nessa pessoa e a menção aparece na mensagem.
2. **Quando** escolho documentos indexados da empresa como fontes da conversa, **então** a Auria usa esses documentos.
3. **Quando** escolho um escopo (`/tasks`, `/calendar`, `/mail`, `/contacts`), **então** a Auria trabalha só naquele módulo.
4. **Quando** abro a Biblioteca, **então** vejo todos os arquivos que enviei à Auria, com filtro por tipo e "Ir para a conversa".

### Casos de borda

- **Sem rede ao abrir a Auria:** a lista mostra o último estado conhecido (se houver) e um aviso; enviar fica bloqueado com "Sem conexão".
- **App vai para segundo plano no meio de uma resposta:** ao voltar, a conversa é recarregada do servidor e mostra a resposta salva (se o servidor terminou).
- **Sessão expira no meio do uso:** a renovação é transparente; se a sessão cair, vale a regra da 001 ("Sua sessão terminou").
- **Conversa enorme:** só as últimas mensagens carregam; as anteriores sob demanda.
- **Resposta muito longa / tabela larga:** rola sem quebrar o layout; tabela rola na horizontal.
- **Botão voltar do Android:** fecha folhas e painéis abertos antes de sair da Auria; durante uma resposta, não a interrompe.
- **Permissões negadas** (câmera/fotos): mensagem com atalho para os ajustes do Android.
- **Duas mensagens seguidas rápido:** a segunda espera; não pode duplicar a conversa nem a mensagem.
- **Conversa criada na web com outro motor** (ChatGPT/Claude importado): abre para leitura com o selo de origem.

## 4. Requisitos funcionais

| ID | Requisito | História |
| --- | --- | --- |
| RF-01 | O app DEVE enviar mensagens à Auria real do AATOS, com a mesma conta da 001, e exibir a resposta em streaming. | H1 |
| RF-02 | O app DEVE criar a conversa no servidor no primeiro envio e adotar o identificador recebido. | H1, H3 |
| RF-03 | A resposta DEVE ser renderizada como Markdown (GFM: títulos, listas, negrito, itálico, código, tabelas, links). | H1 |
| RF-04 | A pessoa DEVE poder parar uma resposta; o texto recebido é mantido. | H1 |
| RF-05 | A pessoa DEVE poder escolher o modo Rápido/Profundo; a escolha persiste no aparelho. | H1 |
| RF-06 | O app DEVE mostrar o progresso do trabalho (estado, ferramentas, serviço, raciocínio) durante a resposta, e o raciocínio salvo depois. | H2 |
| RF-07 | O app DEVE listar as conversas do servidor, paginadas, com fixadas primeiro, e abrir as mensagens com paginação. | H3 |
| RF-08 | A pessoa DEVE poder renomear, fixar/desafixar e apagar conversas. | H3 |
| RF-09 | O app DEVE lembrar a última conversa aberta. | H3 |
| RF-10 | O app DEVE enviar anexos (imagem, câmera, PDF, TXT, MD, CSV, DOCX, XLSX, JSON até 20 MB) ao servidor e referenciá-los na mensagem. | H4 |
| RF-11 | O app DEVE exibir anexos privados (imagens e arquivos) das mensagens, inclusive os enviados pela web. | H4 |
| RF-12 | O app DEVE traduzir cada código de erro do servidor em mensagem e ação (tentar de novo, nova conversa, comprar créditos na web, pedir ao responsável). | H5 |
| RF-12a | O app DEVE consultar plano e saldo e bloquear o envio antes de chamar a Auria quando os créditos tiverem acabado, com aviso em inglês. | H5 |
| RF-13 | O app DEVE bloquear o envio em conversa somente leitura e explicar por quê. | H5 |
| RF-14 | A pessoa DEVE poder gerar de novo uma resposta, editar a própria mensagem, alternar versões e curtir respostas. | H6 |
| RF-15 | O app DEVE respeitar a preferência de busca na web (empresa, pessoa, conversa) e mostrar andamento, fontes e citações. | H7 |
| RF-16 | A pessoa DEVE poder gerar imagens; a imagem fica na conversa e pode ser salva e compartilhada. | H8 |
| RF-17 | O app DEVE mostrar os documentos criados pela Auria (texto, planilha, apresentação), abri-los só para leitura e aplicar/rejeitar as propostas de mudança que a Auria fizer na conversa. | H9 |
| RF-18 | A pessoa DEVE poder gerenciar projetos (criar, editar, apagar, membros, adicionar/remover conversas). | H10 |
| RF-19 | O dono DEVE poder mudar a visibilidade da conversa e compartilhá-la com pessoas da empresa. | H11 |
| RF-20 | O app DEVE reagir à perda de acesso a conversas e projetos. | H11 |
| RF-21 | A pessoa DEVE poder mencionar colegas, vincular documentos indexados, escolher escopo de módulo e ver a biblioteca de arquivos. | H12 |
| RF-22 | Recursos da Auria sem backend (D-06) DEVEM ser ocultados ou trocados pelo equivalente real, nunca simular um resultado falso. | todas |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Primeiro pedaço da resposta visível em até 3 s após o servidor começar a transmitir; a rolagem acompanha o texto sem travar (60 fps no emulador). |
| RNF-02 | Acessibilidade: controles só com ícone com `accessibilityLabel`/`accessibilityRole`; alvos de 44 pt; o texto em streaming não é relido inteiro pelo leitor de tela a cada pedaço. |
| RNF-03 | Plataforma: Android, verificado no emulador com Expo Go. Sem módulo nativo fora do Expo Go. |
| RNF-04 | Segurança: só o token de acesso da 001 vai para o servidor; nenhum segredo no app; arquivos privados nunca ficam em URL pública nem em cache compartilhado. |
| RNF-05 | Dados atrás de uma camada: telas consomem hooks da área Auria; nenhuma tela chama a rede direto (princípio IV). |
| RNF-06 | Testes automatizados para o leitor do streaming, o mapeamento de mensagens e o mapeamento de erros. |
| RNF-07 | Temas claro e escuro em todas as telas novas. |
| RNF-08 | Mesmo resultado da web: uma conversa iniciada num lugar continua no outro sem perda. |

## 6. Entidades

- **Conversa**: id, título, origem (Auria, ChatGPT, Claude…), visibilidade, dono, fixada, última atividade, total de mensagens, projeto.
- **Mensagem**: id, papel (pessoa/Auria), conteúdo (Markdown), anexos, menções, raciocínio, resultado da busca na web, versão (n de m), curtida, data.
- **Anexo**: id, nome, tipo, tamanho, conversa, acesso privado.
- **Execução** (só durante a resposta): estado, rodada, ferramentas usadas, raciocínio, texto parcial.
- **Documento da Auria**: id, título, formato (texto, planilha, apresentação), versão, conteúdo, propostas de mudança.
- **Projeto**: id, nome, visibilidade, dono, membros, conversas.
- **Pessoa da empresa**: id público, nome, e-mail, papel.

## 7. Critérios de sucesso

- CS-01 — Uma conversa começada no celular aparece na web com as mesmas mensagens, e vice-versa.
- CS-02 — Nenhuma resposta da Auria no app vem de texto pronto/mock (todas as fontes de mock da Auria saem do caminho de execução).
- CS-03 — Uma foto enviada pelo celular é descrita corretamente pela Auria.
- CS-04 — Os 13 códigos de erro do servidor têm mensagem própria no app.
- CS-05 — Todas as histórias P1 aprovadas no emulador Android antes de começar as P2.
- CS-06 — A v1 (P1 + P2) vai para a `main` antes de qualquer história P3 começar.

## 8. Decisões tomadas

- D-01 (2026-10-20) — A fonte da verdade do contrato é o que está **em produção**: `aatos-system` `main` fixa o `aatos-auria` no commit `6567791` (17/10). A cópia local do backend (`dev` local, 29/09) está desatualizada e não deve ser usada como referência.
- D-02 (2026-10-20) — O motor de conversa do app é o mesmo da web: a Auria com ferramentas e streaming. O motor antigo sem ferramentas não é usado.
- D-03 (2026-10-20) — A interface continua em inglês (D-20 da 001); as mensagens de erro também.
- D-04 (2026-10-20) — Sem branches de feature: só existem `develop` e `main`. O trabalho é feito e commitado na `develop` e depois mergeado na `main`. Substitui a parte de branches da D-03 do registro geral.
- D-05 (2026-10-20, dúvida 1) — O app usa o servidor de **produção** da Auria (`pilarone.mydailyceo.com`) e o billing de produção (`settings.mydailyceo.com`), coerente com o login, que já usa o Authenticator de produção.
- D-06 (2026-10-20, dúvida 2) — O seletor de modelo (Claude/GPT/Gemini) vira o seletor **Rápido/Profundo**; modo de voz e editor de imagem com pincel ficam **ocultos** até terem spec própria; os modelos de documento deixam de montar texto local e viram pedidos à Auria; o painel de busca passa a buscar nas conversas e projetos reais.
- D-07 (2026-10-20, dúvida 3) — Documentos **só leitura** por enquanto. Sem edição manual e sem "pedir mudança" no leitor. Aplicar/Rejeitar uma proposta que a Auria fez na conversa continua, porque é a confirmação que a própria Auria pede para concluir o pedido.
- D-08 (2026-10-20, dúvida 4) — O app **bloqueia o envio antes** quando os créditos acabaram e mostra o aviso em **inglês** (sobe para P1).
- D-09 (2026-10-20, dúvida 5) — A ordem P1 → P2 → P3 está aprovada. A entrega é em **duas versões**: a **v1** (P1 + P2) vai para a `main` e para as pessoas; a **v2** (P3: Projetos, Compartilhar, Contexto) vem depois. Na v1, os painéis que só ganham dados reais na v2 (Projetos, Galeria, busca simulada) ficam ocultos, para não mostrar dados falsos.

## 9. Dúvidas em aberto

A spec só passa para **Aprovada** quando esta lista estiver vazia.

- [x] 1. Servidor → produção (D-05).
- [x] 2. Recursos sem backend → como proposto (D-06).
- [x] 3. Documentos → só leitura por enquanto (D-07).
- [x] 4. Créditos → bloquear antes e avisar, em inglês (D-08).
- [x] 5. Ordem P1 → P2 → P3 aprovada; P3 fica para a v2 (D-09).
