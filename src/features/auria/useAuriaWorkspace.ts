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
  | { type: 'create-project'; name: string; visibility: AuriaProjectVisibility; id: number };

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

/**
 * A rich preview conversation that demonstrates every message capability:
 * reasoning (chain-of-thought), consulted-source chips, a document artifact
 * and an image artifact. Loaded when a saved conversation is opened.
 */
export const auriaDemoConversation: AuriaChatMessage[] = [
  {
    id: 'demo-u1',
    role: 'user',
    text: 'Resume o nosso contrato MSA e aponta os riscos principais.',
  },
  {
    id: 'demo-a1',
    role: 'assistant',
    reasoning: {
      durationSec: 6,
      steps: [
        'Abri o MSA e localizei as cláusulas de responsabilidade, rescisão e SLA.',
        'Comparei o Anexo B com as notas de revisão do Jurídico.',
        'Identifiquei 3 pontos com risco acima do habitual e priorizei-os.',
        'Resumi em linguagem de negócio, com a ação recomendada.',
      ],
    },
    text:
      'Aqui está o resumo do MSA e os riscos principais:\n\n• Responsabilidade: o limite está em 12 meses de fees — abaixo do nosso padrão (24 meses).\n• Rescisão: a outra parte pode sair com 30 dias sem causa; nós precisamos de 90.\n• SLA: 99.5% sem créditos de serviço definidos.\n\nRecomendo renegociar o limite de responsabilidade e adicionar créditos de SLA antes de assinar.',
    sources: [
      {
        id: 'src-1',
        title: 'MSA_Contract_v3.pdf',
        kind: 'pdf',
        meta: 'Legal team · 2.4 MB',
        excerpt:
          'Section 9.2 — Limitation of Liability. In no event shall either party’s aggregate liability exceed the total fees paid in the twelve (12) months preceding the claim giving rise to such liability...',
      },
      {
        id: 'src-2',
        title: 'Legal review notes.docx',
        kind: 'doc',
        meta: 'Research chat · 84 KB',
        excerpt:
          'Reviewer note: liability cap (12 months) is below our 24-month standard. Termination-for-convenience is asymmetric — counterparty 30 days, us 90 days. Confirm whether SLA credits exist.',
      },
      {
        id: 'src-3',
        title: 'Annex B — SLA.pdf',
        kind: 'pdf',
        meta: 'Legal team · 612 KB',
        excerpt:
          'Service availability target: 99.5%, measured monthly. No service credits are specified for missed targets within this annex.',
      },
    ],
  },
  {
    id: 'demo-u2',
    role: 'user',
    text: 'Cria um documento com o resumo executivo para o board.',
  },
  {
    id: 'demo-a2',
    role: 'assistant',
    text: 'Criei um rascunho executivo. Podes copiá-lo ou expandi-lo para leitura focada.',
    artifact: buildDocumentArtifact('Create a document. Brief: MSA executive summary for the board'),
  },
  {
    id: 'demo-u3',
    role: 'user',
    text: 'Gera uma imagem para a capa da apresentação.',
  },
  {
    id: 'demo-a3',
    role: 'assistant',
    text: 'Aqui está uma capa gerada a partir do briefing.',
    artifact: buildImageArtifact(
      'Create an image with aspect ratio 16:9. Image brief: Minimal abstract cover for an MSA board presentation, calm blue tones',
    ),
  },
];

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
        durationSec: 5,
        steps: [
          'Reli o documento e extraí as cláusulas-chave.',
          'Confrontei com as notas de revisão e o nosso padrão interno.',
          'Classifiquei cada cláusula por nível de risco.',
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
      return {
        ...state,
        panel: 'chat',
        showWelcome: false,
        activeConversationId: action.conversationId,
        pendingReply: null,
        messages: auriaDemoConversation.map((message) => ({ ...message })),
      };
    }
    case 'open-project-modal':
      return { ...state, newProjectOpen: true };
    case 'close-project-modal':
      return { ...state, newProjectOpen: false };
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
      createProject: (input: { name: string; visibility: AuriaProjectVisibility }) =>
        dispatch({ type: 'create-project', ...input, id: Date.now() }),
    }),
    [state],
  );
}
