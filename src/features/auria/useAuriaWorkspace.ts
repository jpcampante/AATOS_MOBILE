import { useEffect, useMemo, useReducer } from 'react';
import {
  AuriaPanel,
  AuriaProject,
  AuriaProjectVisibility,
  AuriaSidebarProjectRow,
  PROJECT_ACCENT_PALETTE,
  auriaConversations,
  auriaProjects,
  auriaSidebarProjects,
} from '../../data/auriaMockData';
import type { AuriaChatMessage, AuriaDocumentArtifact, AuriaImageArtifact } from './types';

type AssistantReply = string | Pick<AuriaChatMessage, 'text' | 'artifact' | 'reasoning' | 'sources'>;

type WorkspaceState = {
  panel: AuriaPanel;
  showWelcome: boolean;
  composerText: string;
  activeConversationId: string | null;
  projects: AuriaProject[];
  projectRows: AuriaSidebarProjectRow[];
  messages: AuriaChatMessage[];
  pendingReply: { id: number; text: string } | null;
  newProjectOpen: boolean;
};

type WorkspaceAction =
  | { type: 'set-composer'; value: string }
  | { type: 'open-panel'; panel: AuriaPanel }
  | { type: 'new-chat' }
  | { type: 'send-message'; text: string; id: number }
  | { type: 'receive-reply'; reply: AssistantReply; id: number }
  | { type: 'open-conversation'; conversationId: string }
  | { type: 'open-project-modal' }
  | { type: 'close-project-modal' }
  | { type: 'delete-project'; id: string }
  | {
      type: 'create-project';
      name: string;
      visibility: AuriaProjectVisibility;
      iconId?: string;
      description?: string;
      id: number;
    };

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

const initialState: WorkspaceState = {
  panel: 'chat',
  showWelcome: true,
  composerText: '',
  activeConversationId: null,
  projects: [...auriaProjects],
  projectRows: [...auriaSidebarProjects],
  messages: [],
  pendingReply: null,
  newProjectOpen: false,
};

function buildAssistantReply(text: string): AssistantReply {
  const normalized = text.toLowerCase();
  if (
    normalized.includes('contrato') ||
    normalized.includes('contract') ||
    normalized.includes('risco') ||
    normalized.includes('review') ||
    normalized.includes('resume') ||
    normalized.includes('resumo')
  ) {
    return {
      text:
        'Aqui está a leitura, com os pontos de risco em destaque:\n\n• Responsabilidade limitada a 12 meses de fees (abaixo do nosso padrão de 24).\n• Rescisão sem causa assimétrica (30 dias vs 90).\n• SLA de 99.5% sem créditos definidos.\n\nQueres que prepare a contraproposta?',
      reasoning: {
        durationSec: 9,
        steps: [
          {
            kind: 'reasoning',
            title: 'Reading the contract and extracting clauses',
            body: 'I located the liability, termination and SLA clauses and compared them against our internal standard to flag anything off-market.',
          },
          {
            kind: 'search',
            title: 'Checking our standard terms and prior reviews',
            queries: [
              'standard liability cap months fees MSA',
              'termination for convenience notice period policy',
              'SLA service credits requirement',
              'indemnification mutual cap standard',
              'data processing addendum requirement',
            ],
            sources: [
              {
                label: 'Legal review notes.docx',
                kind: 'doc',
                docType: 'doc',
                excerpt:
                  'Liability cap (12 months) is below our 24-month standard. Termination-for-convenience is asymmetric — counterparty 30 days, us 90 days. Confirm whether SLA credits exist.',
              },
              { label: 'playbook.aatos.app', kind: 'web' },
            ],
          },
          {
            kind: 'reasoning',
            title: 'Classifying each clause by risk',
            body: 'Liability cap and SLA credits are the two highest-risk gaps versus our standard, so I prioritised those in the answer.',
          },
        ],
      },
      sources: [
        {
          id: `src-live-1-${Date.now()}`,
          title: 'MSA_Contract_v3.pdf',
          kind: 'pdf',
          meta: 'Legal team · 2.4 MB',
          excerpt:
            'Section 9.2 — Limitation of Liability. Aggregate liability shall not exceed fees paid in the preceding twelve (12) months...',
        },
        {
          id: `src-live-2-${Date.now()}`,
          title: 'Legal review notes.docx',
          kind: 'doc',
          meta: 'Research chat · 84 KB',
          excerpt: 'Liability cap below standard; termination asymmetry; confirm SLA credits.',
        },
      ],
    };
  }
  if (normalized.includes('task') || normalized.includes('priority')) {
    return 'Here is a practical priority structure:\n\n1. Define the outcome and deadline.\n2. Separate urgent work from important work.\n3. Assign an owner and next action to every task.\n4. Review blockers before starting execution.\n\nTell me the project or deadline and I will turn this into a specific task list.';
  }
  if (normalized.includes('report') || normalized.includes('summary')) {
    return 'I can prepare the summary. Send the notes, document, or key points and I will organize them into: executive summary, decisions, risks, and next actions.';
  }
  if (normalized.includes('email') || normalized.includes('follow-up')) {
    return 'I can draft that follow-up. Share the recipient, desired tone, and the action you want them to take. I will produce a concise subject line and editable email.';
  }
  if (normalized.includes('create an image') || normalized.includes('image brief')) {
    return {
      text: 'I created an image mock from the selected brief.',
      artifact: buildImageArtifact(text),
    };
  }
  if (normalized.includes('create a document')) {
    return {
      text: 'I created a working draft. You can copy it or expand it for focused reading.',
      artifact: buildDocumentArtifact(text),
    };
  }
  if (normalized.includes('shared conversation with')) {
    return 'The teammate AI has been added to this conversation. Describe the decision or question you want to work through together.';
  }
  if (normalized.includes('attached files')) {
    return 'The files are ready for analysis. Tell me whether you want a summary, comparison, risk review, data extraction, or action plan.';
  }
  if (normalized.includes('hello') || normalized.includes('hi ')) {
    return 'Hi Marta. What would you like to work on? I can help plan work, summarize information, draft content, or organize a decision.';
  }
  return `I understand. Here is how I would approach it:\n\n• Clarify the desired outcome.\n• Gather the relevant context and constraints.\n• Produce a first actionable version.\n• Refine it with your feedback.\n\nWhat result do you want from “${text.trim()}”?`;
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'set-composer':
      return { ...state, composerText: action.value };
    case 'open-panel':
      return {
        ...state,
        panel: action.panel,
        showWelcome: action.panel === 'chat' && state.messages.length === 0,
      };
    case 'new-chat':
      return {
        ...state,
        panel: 'chat',
        showWelcome: true,
        composerText: '',
        activeConversationId: null,
        messages: [],
        pendingReply: null,
      };
    case 'send-message': {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        panel: 'chat',
        showWelcome: false,
        composerText: '',
        activeConversationId: state.activeConversationId ?? `local-${action.id}`,
        pendingReply: { id: action.id, text },
        messages: [
          ...state.messages,
          { id: `m-${action.id}`, role: 'user', text },
        ],
      };
    }
    case 'receive-reply':
      if (state.pendingReply?.id !== action.id) return state;
      {
        const reply = typeof action.reply === 'string' ? { text: action.reply } : action.reply;
        return {
          ...state,
          pendingReply: null,
          messages: [
            ...state.messages,
            { id: `m-${action.id}-a`, role: 'assistant', ...reply },
          ],
        };
      }
    case 'open-conversation': {
      const mock = AURIA_CONVERSATION_MOCKS[action.conversationId] ?? legalMockConversation;
      return {
        ...state,
        panel: 'chat',
        showWelcome: false,
        activeConversationId: action.conversationId,
        pendingReply: null,
        messages: mock.map((message) => ({ ...message })),
      };
    }
    case 'open-project-modal':
      return { ...state, newProjectOpen: true };
    case 'close-project-modal':
      return { ...state, newProjectOpen: false };
    case 'delete-project':
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.id),
        projectRows: state.projectRows.filter((row) => row.id !== action.id),
      };
    case 'create-project': {
      const accent = PROJECT_ACCENT_PALETTE[state.projects.length % PROJECT_ACCENT_PALETTE.length];
      const project: AuriaProject = {
        id: `p-${action.id}`,
        name: action.name,
        owner: action.name,
        emoji: action.name.charAt(0).toUpperCase() || 'P',
        accent,
        visibility: action.visibility,
        updatedLabel: 'Created just now',
        fileCount: 0,
        chatCount: 0,
        iconId: action.iconId ?? 'folder',
        description: action.description,
      };
      const moreIndex = state.projectRows.findIndex((row) => row.kind === 'more');
      const row: AuriaSidebarProjectRow = { id: project.id, name: project.name, kind: 'folder' };
      const projectRows =
        moreIndex === -1
          ? [...state.projectRows, row]
          : [
              ...state.projectRows.slice(0, moreIndex),
              row,
              ...state.projectRows.slice(moreIndex),
            ];

      return {
        ...state,
        panel: 'projects',
        showWelcome: false,
        newProjectOpen: false,
        projects: [...state.projects, project],
        projectRows,
      };
    }
    default:
      return state;
  }
}

export function useAuriaWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  useEffect(() => {
    if (!state.pendingReply) return;
    const { id, text } = state.pendingReply;
    const timer = setTimeout(() => {
      dispatch({ type: 'receive-reply', id, reply: buildAssistantReply(text) });
    }, 700);
    return () => clearTimeout(timer);
  }, [state.pendingReply]);

  return useMemo(
    () => ({
      ...state,
      isWelcomeHome: state.showWelcome && state.panel === 'chat' && state.messages.length === 0,
      showComposer: state.panel === 'chat',
      isResponding: state.pendingReply !== null,
      setComposerText: (value: string) => dispatch({ type: 'set-composer', value }),
      openPanel: (panel: AuriaPanel) => dispatch({ type: 'open-panel', panel }),
      newChat: () => dispatch({ type: 'new-chat' }),
      sendMessage: (text: string) => {
        if (state.pendingReply) return;
        dispatch({ type: 'send-message', text, id: Date.now() });
      },
      openConversation: (conversationId: string) =>
        dispatch({ type: 'open-conversation', conversationId }),
      openProjectModal: () => dispatch({ type: 'open-project-modal' }),
      closeProjectModal: () => dispatch({ type: 'close-project-modal' }),
      deleteProject: (id: string) => dispatch({ type: 'delete-project', id }),
      createProject: (input: {
        name: string;
        visibility: AuriaProjectVisibility;
        iconId?: string;
        description?: string;
      }) => dispatch({ type: 'create-project', ...input, id: Date.now() }),
    }),
    [state],
  );
}
