export type AuriaPromptSuggestion = {
  id: string;
  /** Bold first line. */
  title: string;
  /** Muted second line. */
  subtitle: string;
  /** Full text sent to Auria when the card is tapped. */
  prompt: string;
};

/** ChatGPT-style starter cards shown above the composer on the welcome screen. */
export const auriaPromptSuggestions: AuriaPromptSuggestion[] = [
  {
    id: 'tasks',
    title: 'Prioritize tasks',
    subtitle: 'into a ranked action list',
    prompt: 'Create a prioritized task list for my day.',
  },
  {
    id: 'meeting',
    title: 'Summarize a meeting',
    subtitle: 'key points & action items',
    prompt: 'Summarize my last meeting notes into key points and action items.',
  },
  {
    id: 'email',
    title: 'Draft a client email',
    subtitle: 'a polished follow-up',
    prompt: 'Draft a follow-up email to a client.',
  },
  {
    id: 'sprint',
    title: 'Plan the sprint',
    subtitle: 'priorities for next week',
    prompt: 'Plan sprint priorities for next week.',
  },
  {
    id: 'deck',
    title: 'Outline a deck',
    subtitle: 'structure a presentation',
    prompt: 'Structure a presentation outline.',
  },
  {
    id: 'contract',
    title: 'Review a contract',
    subtitle: 'flag key terms & risks',
    prompt: 'Review the key terms and risks in a contract.',
  },
];
