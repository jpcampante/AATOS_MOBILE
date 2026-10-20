/**
 * Every Auria path the app calls (inventory E01–E53 in specs/002-auria-real/plan.md §3).
 * Paths are relative to `AURIA_API_URL`, except `billing`, which lives on `SETTINGS_URL`.
 * Trailing slashes matter: Django redirects `add_chat`/`remove_chat` without them
 * and the redirect drops the body.
 */
const enc = encodeURIComponent;

export const auriaRoutes = {
  // Conversation engine
  systemChatStream: '/auria/system_llm/chat?stream=1', // E01
  systemScope: '/auria/system_llm/scope', // E04
  generateImage: '/auria/generate/image', // E06

  // Chats
  chatsVisualizer: (page: number, limit: number) =>
    `/auria/chat_importer/chats/visualizer?page=${page}&limit=${limit}`, // E07
  chats: '/auria/chat_importer/chats', // E09
  chat: (chatId: string) => `/auria/chat_importer/chats/${enc(chatId)}`, // E10–E12
  chatPin: (chatId: string) => `/auria/chat_importer/chats/${enc(chatId)}/pin`, // E13
  chatMembers: (chatId: string) => `/auria/chat_importer/chats/${enc(chatId)}/members`, // E14
  chatMember: (chatId: string, userUid: string) =>
    `/auria/chat_importer/chats/${enc(chatId)}/members/${enc(userUid)}`, // E15

  // Messages
  messagesVisualizer: (chatId: string, page: number, limit: number) =>
    `/auria/chat_importer/messages/${enc(chatId)}/visualizer?page=${page}&limit=${limit}`, // E16
  appendMessage: (chatId: string) => `/auria/chat_importer/messages/${enc(chatId)}`, // E17
  regenerate: (messageUuid: string) => `/auria/chat_importer/messages/${enc(messageUuid)}/regenerate`, // E19
  editMessage: (messageUuid: string) => `/auria/chat_importer/messages/${enc(messageUuid)}/edit`, // E20
  activateVersion: (messageUuid: string) => `/auria/chat_importer/messages/${enc(messageUuid)}/activate`, // E21
  likeMessage: (messageUuid: string) => `/auria/chat_importer/messages/${enc(messageUuid)}/like`, // E22

  // Attachments
  attachments: '/auria/chat/attachments', // E24, E25
  attachment: (uuid: string) => `/auria/chat/attachments/${enc(uuid)}`, // E26, E27
  webImage: '/auria/web-image/', // E28 (query `u` and `s` come signed from the server)

  // Documents (canvas)
  chatDocuments: (chatId: string) => `/auria/chats/${enc(chatId)}/canvas`, // E29
  chatDocument: (chatId: string, docId: string) => `/auria/chats/${enc(chatId)}/canvas/${enc(docId)}`, // E31
  document: (docId: string) => `/auria/canvas/${enc(docId)}`, // E31 (loose document)
  documentAttachment: (docId: string, uuid: string) =>
    `/auria/canvas/${enc(docId)}/attachments/${enc(uuid)}`, // E38 (images inside a document)
  chatProposals: (chatId: string) => `/auria/chats/${enc(chatId)}/canvas/proposals`, // E34
  proposalDecision: (docId: string, proposalId: string, decision: 'apply' | 'reject') =>
    `/auria/canvas/${enc(docId)}/proposals/${enc(proposalId)}/${decision}`, // E35

  // Projects (v2)
  projects: '/auria/chat_importer/projects', // E39, E40
  project: (projectId: string) => `/auria/chat_importer/projects/${enc(projectId)}`, // E41
  projectMembers: (projectId: string) => `/auria/chat_importer/projects/${enc(projectId)}/members`, // E42
  projectMember: (projectId: string, userUid: string) =>
    `/auria/chat_importer/projects/${enc(projectId)}/members/${enc(userUid)}`, // E42
  projectAddChat: (projectId: string) => `/auria/chat_importer/projects/${enc(projectId)}/add_chat/`, // E43
  projectRemoveChat: (projectId: string) => `/auria/chat_importer/projects/${enc(projectId)}/remove_chat/`, // E43

  // Organization and context (v2)
  organizationMembers: '/auria/organization/members', // E44
  ragDocuments: '/auria/chat_importer/rag/documents?only_indexed=true', // E45
  chatRagDocuments: (chatId: string) => `/auria/chat_importer/chats/${enc(chatId)}/rag/documents`, // E46
  departments: '/docs/departments/', // E52

  // Web search
  webSearchSettings: (chatId?: string | null) =>
    chatId ? `/auria/web-search/settings?chat_id=${enc(chatId)}` : '/auria/web-search/settings', // E48
  webSearchPreference: '/auria/web-search/preference', // E49

  // Realtime (v2)
  websocket: '/ws/', // E53
} as const;

/** On `SETTINGS_URL`. */
export const billingRoutes = {
  subscription: '/billing/subscription/?app=aatos', // E51
} as const;
