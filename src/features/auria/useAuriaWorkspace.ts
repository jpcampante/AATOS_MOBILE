import { useMemo, useReducer } from 'react';
import {
  AuriaPanel,
  AuriaProject,
  AuriaProjectVisibility,
  AuriaSidebarProjectRow,
  PROJECT_ACCENT_PALETTE,
  auriaProjects,
  auriaSidebarProjects,
} from '../../data/auriaMockData';
import { DEFAULT_MODEL_ID } from '../../data/auriaModels';

/**
 * UI state of the Auria workspace: which panel is open, the composer text and
 * the projects panel. The conversation itself lives in `useAuriaConversation`.
 */

/**
 * Monotonic id source. Date.now() collides when two events land in the same
 * millisecond (rapid project creation), which produces duplicate React keys.
 */
let __auriaSeq = 0;
const nextSeq = () => (__auriaSeq += 1);

type WorkspaceState = {
  panel: AuriaPanel;
  composerText: string;
  selectedModel: string;
  projects: AuriaProject[];
  projectRows: AuriaSidebarProjectRow[];
  newProjectOpen: boolean;
};

type WorkspaceAction =
  | { type: 'set-composer'; value: string }
  | { type: 'set-model'; value: string }
  | { type: 'open-panel'; panel: AuriaPanel }
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

const initialState: WorkspaceState = {
  panel: 'chat',
  composerText: '',
  selectedModel: DEFAULT_MODEL_ID,
  projects: [...auriaProjects],
  projectRows: [...auriaSidebarProjects],
  newProjectOpen: false,
};

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'set-composer':
      return { ...state, composerText: action.value };
    case 'set-model':
      return { ...state, selectedModel: action.value };
    case 'open-panel':
      return { ...state, panel: action.panel };
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
        createdByYou: true,
      };
      const moreIndex = state.projectRows.findIndex((row) => row.kind === 'more');
      const row: AuriaSidebarProjectRow = { id: project.id, name: project.name, kind: 'folder' };
      const projectRows =
        moreIndex === -1
          ? [...state.projectRows, row]
          : [...state.projectRows.slice(0, moreIndex), row, ...state.projectRows.slice(moreIndex)];

      return {
        ...state,
        panel: 'projects',
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

  return useMemo(
    () => ({
      ...state,
      showComposer: state.panel === 'chat',
      setComposerText: (value: string) => dispatch({ type: 'set-composer', value }),
      setSelectedModel: (value: string) => dispatch({ type: 'set-model', value }),
      openPanel: (panel: AuriaPanel) => dispatch({ type: 'open-panel', panel }),
      openProjectModal: () => dispatch({ type: 'open-project-modal' }),
      closeProjectModal: () => dispatch({ type: 'close-project-modal' }),
      deleteProject: (id: string) => dispatch({ type: 'delete-project', id }),
      createProject: (input: {
        name: string;
        visibility: AuriaProjectVisibility;
        iconId?: string;
        description?: string;
      }) => dispatch({ type: 'create-project', ...input, id: nextSeq() }),
    }),
    [state],
  );
}
