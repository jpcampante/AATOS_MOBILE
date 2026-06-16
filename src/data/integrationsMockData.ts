/**
 * Mock inbox for the Integrations (Mail) module.
 * Local preview data — replaced when the mail connector sync is wired up.
 */

export type MailCategory = 'security' | 'updates' | 'team' | 'social';

export type MailRecipient = {
  name?: string;
  address: string;
};

export type MailItem = {
  id: string;
  sender: string;
  /** 1–2 letters shown in the avatar bubble. */
  initial: string;
  /** Avatar bubble background. */
  accent: string;
  subject: string;
  preview: string;
  /** Short clock label, already formatted. */
  time: string;
  unread: boolean;
  starred: boolean;
  category: MailCategory;
  /** Detail-view fields. Fall back to sensible defaults when absent. */
  senderEmail?: string;
  to?: MailRecipient[];
  cc?: MailRecipient[];
  dateLabel?: string;
  labels?: string[];
  bodyFull?: string;
};

/** The mailbox the inbox is currently showing. */
export const connectedMailbox = 'martinscampante@gmail.com';

export type ComposeAccount = {
  id: string;
  address: string;
  /** Aliases shown as "Send as: …" in the From picker. */
  sendAs?: boolean;
};

/** Accounts shown in the compose "From" dropdown. */
export const composeFromAccounts: ComposeAccount[] = [
  { id: 'a-social', address: 'myceo.socialmedia@gmail.com' },
  { id: 'a-nare', address: 'narelopes2@gmail.com' },
  { id: 'a-marta', address: 'martinscampante@gmail.com' },
  { id: 'a-joaocgi', address: 'joaocampantecgi@gmail.com', sendAs: true },
  { id: 'a-edge', address: 'theedgearchviz@gmail.com' },
  { id: 'a-jp', address: 'jpcampante@myceo.fi' },
  { id: 'a-contact', address: 'contact@myceo.fi', sendAs: true },
];

export const composeDefaultFrom = 'contact@myceo.fi';

/** Default signature appended to a new message. */
export const composeSignature = `João Campante
CEO & Founder | MyCEO
contact@myceo.fi
jpcampante@myceo.fi
+358 46 891 5660
Helsinki, Finland
Do More. Do MyCEO.`;

export const mailFilters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'starred', label: 'Starred' },
] as const;

export type MailFilterId = (typeof mailFilters)[number]['id'];

export const inboxMessages: MailItem[] = [
  {
    id: 'm-relatorio',
    sender: 'Clariana Abreu',
    initial: 'CA',
    accent: '#7C3AED',
    subject: 'Relatorio dia 15/06/2026',
    preview:
      'A validação de acesso ao onboarding agora foi totalmente centralizada para ignorar o histórico do navegador.',
    time: '2:04',
    unread: true,
    starred: false,
    category: 'team',
    senderEmail: 'abreuclariana@gmail.com',
    to: [{ address: 'jpcampante@myceo.fi' }],
    cc: [
      { name: 'Alisson Suassuna', address: 'alissonsuassuna@gmail.com' },
      { address: 'vitoria.menesesmt@gmail.com' },
      { address: 'juliocesarhunas@gmail.com' },
    ],
    dateLabel: 'Jun 16, 2026 at 2.04',
    labels: ['External', 'Inbox'],
    bodyFull:
      'A validação de acesso ao onboarding agora foi totalmente centralizada para ignorar o histórico do navegador e validar o usuário direto pelas credenciais de login. Antes, o sistema dependia do armazenamento local da máquina atual para saber se o fluxo já tinha sido concluído. Com a nova alteração, o código realiza uma consulta direta usando apenas os dados de identificação do usuário logado. Se o sistema reconhecer o ID e identificar que a conta já é antiga e ativa, ele pula o cadastro permanentemente e joga o usuário direto no Dashboard. Dessa forma, se o cadastro for concluído em um navegador e o acesso ocorrer por outro ou por uma aba anônima, o sistema reconhece o ID instantaneamente e impede que a tela de onboarding apareça de novo.',
  },
  {
    id: 'm-jpcampante-ci',
    sender: 'jpcampante',
    initial: 'JP',
    accent: '#1565C0',
    subject: '[myceo_auth_receiver] Run failed: tests workflow',
    preview: 'The tests workflow run failed on branch UPDATE. View the run details on GitHub.',
    time: '21:43',
    unread: true,
    starred: false,
    category: 'updates',
  },
  {
    id: 'm-supabase-security',
    sender: 'Supabase',
    initial: 'S',
    accent: '#2E7D32',
    subject: 'Action required: security vulnerabilities detected',
    preview: 'Security issues require your attention in your project. Review the advisories now.',
    time: '18:52',
    unread: true,
    starred: true,
    category: 'security',
  },
  {
    id: 'm-openai-signin',
    sender: 'OpenAI',
    initial: 'O',
    accent: '#10A37F',
    subject: 'New sign-in to your OpenAI account',
    preview: 'New sign-in details for your OpenAI account. If this was not you, secure your account.',
    time: '18:36',
    unread: false,
    starred: false,
    category: 'security',
  },
  {
    id: 'm-aatos-build',
    sender: 'Auria',
    initial: 'AU',
    accent: '#2B7CD8',
    subject: 'Your rebrand build is live on Expo Go',
    preview: 'The new mobile shell is deployed. Open the tunnel link to preview it on your phone.',
    time: '17:10',
    unread: true,
    starred: true,
    category: 'team',
  },
  {
    id: 'm-topaz',
    sender: 'Topaz Labs',
    initial: 'T',
    accent: '#E65100',
    subject: "It's easier with model combos",
    preview: 'Get your images looking perfect with Topaz Image AI. New presets are available.',
    time: '20:05',
    unread: false,
    starred: false,
    category: 'updates',
  },
  {
    id: 'm-google-workspace',
    sender: 'Google Workspace Team',
    initial: 'G',
    accent: '#4285F4',
    subject: 'Boost AI access for your business',
    preview: 'Unlock ongoing access for AI-powered tools across your Workspace plan.',
    time: '12:37',
    unread: false,
    starred: false,
    category: 'updates',
  },
  {
    id: 'm-facebook',
    sender: 'Facebook',
    initial: 'F',
    accent: '#1877F2',
    subject: 'Sobre Mette e outros amigos: outras 12 novidades',
    preview: 'MyCeo, veja suas notificações não lidas sobre Reels e atualizações de amigos.',
    time: '18:27',
    unread: false,
    starred: false,
    category: 'social',
  },
  {
    id: 'm-vercel',
    sender: 'Vercel',
    initial: 'V',
    accent: '#111111',
    subject: 'Deployment ready: aatos-rebranding-mobile',
    preview: 'Your latest commit is live in preview. Inspect the build logs and visit the URL.',
    time: '09:48',
    unread: false,
    starred: false,
    category: 'updates',
  },
];
