/**
 * Sample conversations shown only by the Projects panel, which is a v2 feature
 * (spec 002, D-09) and stays hidden in v1. Not used by the real chat.
 */
import type { AuriaChatMessage, AuriaDocumentArtifact, AuriaImageArtifact } from '../features/auria/types';

function buildDocumentArtifact(text: string): AuriaDocumentArtifact {
  const brief = text.match(/Brief:\s*(.+)$/i)?.[1]?.trim();
  const requestedType = text.match(/Create a ([^.]+)\./i)?.[1]?.trim() ?? 'document';
  const title =
    brief && !brief.toLowerCase().startsWith('ask me')
      ? brief.replace(/[.!?]+$/, '')
      : `${requestedType.charAt(0).toUpperCase()}${requestedType.slice(1)} draft`;

  return {
    kind: 'document',
    title,
    body: `Purpose
This working draft turns the request into a clear, editable structure that can be reviewed and refined with the team.

Executive summary
The recommended approach is to define the desired outcome first, align the document with its audience, and keep every section focused on a decision or next action.

Proposed structure
1. Context and objective
2. Key findings and considerations
3. Recommended direction
4. Risks and dependencies
5. Next actions and owners

Next step
Review the structure, then tell Auria which section should be expanded or rewritten.`,
  };
}

export const auriaDocumentMock: AuriaChatMessage = {
  id: 'document-mock',
  role: 'assistant',
  text: 'Here is a working document draft.',
  artifact: buildDocumentArtifact('Create a document. Brief: Product strategy working draft'),
};

function buildImageArtifact(text: string): AuriaImageArtifact {
  const ratio = text.match(/aspect ratio\s+(\d+):(\d+)/i);
  const width = Number(ratio?.[1] ?? 1);
  const height = Number(ratio?.[2] ?? 1);
  const prompt =
    text.match(/Image brief:\s*(.+)$/i)?.[1]?.trim() ??
    'A floating garden pavilion above a calm lake at sunset.';

  return {
    kind: 'image',
    title: 'Floating garden pavilion',
    prompt,
    aspectRatio: width / height,
  };
}

export const auriaImageMock: AuriaChatMessage = {
  id: 'image-mock',
  role: 'assistant',
  text: 'I created an image mock from the selected brief.',
  artifact: buildImageArtifact(
    'Create an image with aspect ratio 1:1. Image brief: A floating garden pavilion above a calm lake at sunset.',
  ),
};

/* ---- Separate preview conversations: each one showcases ONE capability ---- */

/** Document only — a rewrite that produces an editable document artifact. */
const documentMockConversation: AuriaChatMessage[] = [
  { id: 'doc-u1', role: 'user', text: 'Reescreve os nossos Termos de Serviço de forma mais clara.' },
  {
    id: 'doc-a1',
    role: 'assistant',
    text: 'Reescrevi os Termos de Serviço num rascunho editável. Podes copiá-lo ou abri-lo em ecrã cheio.',
    artifact: buildDocumentArtifact('Create a document. Brief: Terms of Service — plain-language rewrite'),
  },
];

/** Reasoning only — a collapsible chain-of-thought above the answer. */
const reasoningMockConversation: AuriaChatMessage[] = [
  { id: 'rea-u1', role: 'user', text: 'Resume o pipeline do Q2 e diz-me onde estamos a perder negócios.' },
  {
    id: 'rea-a1',
    role: 'assistant',
    reasoning: {
      durationSec: 14,
      steps: [
        {
          kind: 'reasoning',
          title: 'Planning the pipeline analysis',
          body: "The user wants a Q2 summary and where deals are lost. I'll load the export, group deals by stage, compute the stage-to-stage conversion, and compare against Q1 to spot the biggest drop.",
        },
        {
          kind: 'search',
          title: 'Searching the pipeline export and CRM',
          queries: [
            'Q2 pipeline conversion by stage',
            'Proposal → Negotiation drop-off Q2 vs Q1',
            'average days in Proposal stage',
            'win rate by deal size Q2',
            'time to first response sales Q2',
            'lost reason analysis Q2',
            'forecast vs actual close Q2',
          ],
          sources: [
            {
              label: 'pipeline-export.csv',
              kind: 'doc',
              docType: 'sheet',
              excerpt:
                'Stage,Deals,Conv%\nQualify,148,72\nProposal,96,38\nNegotiation,37,64\nClosed Won,24,100\n\nAvg days in Proposal: 9.4 (Q1: 5.1).',
            },
            { label: 'crm.aatos.app', kind: 'web' },
            { label: 'looker.aatos.app', kind: 'web' },
          ],
        },
        {
          kind: 'reasoning',
          title: 'Isolating the biggest leak',
          body: 'Conversion from Proposal to Negotiation is only 38%, well below the 61% in Q1. The likely cause is proposal turnaround exceeding 9 days. I will recommend shortening it to under 4 days.',
        },
      ],
    },
    text:
      'Resumo do pipeline Q2:\n\n• Volume total +12% vs Q1.\n• A maior perda está na passagem de "Proposta" → "Negociação" (só 38% avançam).\n• Causa provável: propostas a demorarem >9 dias a sair.\n\nRecomendo encurtar o tempo de proposta para <4 dias.',
  },
];

/** Image only — a generated cover image with edit/share. */
const imageMockConversation: AuriaChatMessage[] = [
  { id: 'img-u1', role: 'user', text: 'Gera uma imagem de capa para o board update.' },
  {
    id: 'img-a1',
    role: 'assistant',
    text: 'Aqui está uma capa gerada a partir do briefing. Podes editá-la ou partilhá-la.',
    artifact: buildImageArtifact(
      'Create an image with aspect ratio 16:9. Image brief: Calm minimal cover for a board update, soft blue gradient',
    ),
  },
];

/** Sources only — consulted-document chips that open the document. */
const sourcesMockConversation: AuriaChatMessage[] = [
  { id: 'src-u1', role: 'user', text: 'Que documentos sustentam o plano de onboarding de clientes?' },
  {
    id: 'src-a1',
    role: 'assistant',
    text: 'Baseei o plano nestes documentos do teu workspace — toca para veres o que consultei:',
    sources: [
      {
        id: 'on-1',
        title: 'Customer onboarding deck.pptx',
        kind: 'doc',
        meta: 'Sales workspace · 3.1 MB',
        excerpt:
          'Onboarding em 4 fases: Kickoff (semana 1), Setup técnico (semana 2-3), Treino (semana 4), Revisão de sucesso (dia 60).',
      },
      {
        id: 'on-2',
        title: 'Customer interview notes.md',
        kind: 'doc',
        meta: 'Research chat · 84 KB',
        excerpt:
          'Clientes pedem um único ponto de contacto e um checklist claro nos primeiros 30 dias. Fricção maior: setup técnico.',
      },
      {
        id: 'on-3',
        title: 'Pipeline export.csv',
        kind: 'sheet',
        meta: 'Sales workspace · 1.1 MB',
        excerpt: 'Tempo médio até primeiro valor: 21 dias. Contas com kickoff na semana 1 ativam 35% mais rápido.',
      },
    ],
  },
];

/** Reasoning + sources together — the legal review. */
const legalMockConversation: AuriaChatMessage[] = [
  { id: 'leg-u1', role: 'user', text: 'Revê o contrato e aponta os riscos principais.' },
  {
    id: 'leg-a1',
    role: 'assistant',
    reasoning: {
      durationSec: 22,
      steps: [
        {
          kind: 'search',
          title: 'Searching trademarks for “AATOS” and related terms',
          queries: [
            '"AATOS" "Aatos Legal Technology Oy" trademark OR tr…',
            '"AATOS" "Aatos Legal Technology Oy" EUIPO OR TMvi…',
            '"AATOS" "2901500-3" trademark',
            '"AATOS" "Bind" "Aatos Legal Technology" trademark',
            '"AATOS" trademark Finland registration number',
            '"Aatos Legal Technology" EUIPO filing status',
            'site:euipo.europa.eu "AATOS"',
            'site:wipo.int "Aatos Legal Technology"',
            '"AATOS" tavaramerkki rekisteröinti',
            '"Aatos Legal Technology Oy" Y-tunnus 2901500-3',
            '"AATOS" Bind legal documents trademark class 45',
            '"Aatos" legal tech Helsinki trademark Nice class',
          ],
          sources: [
            { label: 'en.wikipedia.org' },
            { label: 'tavaramerkkitietopalvelu.prh.fi' },
            { label: 'www.wipo.int' },
            { label: 'www.euipo.europa.eu' },
            { label: 'www.prh.fi' },
          ],
        },
        {
          kind: 'reasoning',
          title: 'Reviewing research options and citation needs',
          body: "The user wants a re-check of research, but I've already reviewed it and found no official results. The browser tool seems unavailable now, so I'll switch to using web search to gather reliable sources and citations. I might also try querying Aatos with national databases for further confirmation.",
        },
        {
          kind: 'search',
          title: 'Searching official sources for Aatos Legal Technology',
          queries: [
            'site:prh.fi "Aatos Legal Technology Oy"',
            'site:prh.fi "AATOS" "tavaramerkki"',
            'site:tavaramerkkitietopalvelu.prh.fi "AATOS"',
            'site:tavaramerkkitietopalvelu.prh.fi "Aatos Legal Techno…',
          ],
        },
        {
          kind: 'reasoning',
          title: 'Considering a search for the company',
          body: "I think I'll try a more general search for the company. This could help me cast a wider net and pick up relevant details more efficiently. Let me see what shows up, and I'll adjust if necessary.",
        },
        {
          kind: 'search',
          title: 'Searching for information on Aatos Legal Technology Oy',
          queries: [
            'Aatos Legal Technology Oy 2901500-3',
            'Aatos Legal Technology Oy Bind terms 2901500-3',
            'Aatos Legal Technology Oy Deloitte Fast 50',
            'Aatos Legal Technology Oy Business Finland',
          ],
          sources: [{ label: 'en.wikipedia.org' }, { label: 'arxiv.org' }],
        },
      ],
    },
    text:
      'Resumo do contrato e riscos principais:\n\n• Responsabilidade limitada a 12 meses de fees (abaixo do padrão de 24).\n• Rescisão sem causa assimétrica (30 dias vs 90).\n• SLA de 99.5% sem créditos definidos.\n\nRecomendo renegociar antes de assinar.',
    sources: [
      {
        id: 'leg-s1',
        title: 'MSA_Contract_v3.pdf',
        kind: 'pdf',
        meta: 'Legal team · 2.4 MB',
        excerpt:
          'Section 9.2 — Limitation of Liability. Aggregate liability shall not exceed the total fees paid in the twelve (12) months preceding the claim...',
      },
      {
        id: 'leg-s2',
        title: 'Annex B — SLA.pdf',
        kind: 'pdf',
        meta: 'Legal team · 612 KB',
        excerpt: 'Service availability target: 99.5%, measured monthly. No service credits specified for missed targets.',
      },
    ],
  },
];

/** Each saved conversation opens a focused, single-capability mock. */
export const AURIA_CONVERSATION_MOCKS: Record<string, AuriaChatMessage[]> = {
  h1: documentMockConversation, // Rewrite Terms of Service → document
  h2: reasoningMockConversation, // Summarize Q2 pipeline → reasoning
  h3: imageMockConversation, // Draft board update → image
  h4: sourcesMockConversation, // Customer onboarding plan → source chips
  h5: legalMockConversation, // Legal contract review → reasoning + sources
};
