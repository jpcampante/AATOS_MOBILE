/**
 * What each backend tool means to someone watching the Auria work: which part
 * of the panel it belongs to and what it says. Same table as the web
 * (`aatos/src/components/chat-interface/thinking/auriaThinkingTools.ts`).
 *
 * Labels start with a bare verb ("Check your calendar"); the step row turns it
 * into "Checking…" while it runs and "Checked…" when done (see `workText.ts`).
 * The backend sends only the tool NAME (never its arguments), so no label
 * promises a target it can't know.
 */
import type { WorkSectionId } from './workRun';

/** Service families used when the backend doesn't send `service`. */
export type WorkServiceFamily =
  | 'mail'
  | 'calendar'
  | 'tasks'
  | 'knowledge'
  | 'contacts'
  | 'web'
  | 'memory'
  | 'team'
  | 'document'
  | 'roadmap'
  | 'workspace'
  | 'auria';

export type WorkToolInfo = {
  service: WorkServiceFamily;
  section: WorkSectionId;
  /** Bare verb first: the step row conjugates it. */
  label: string;
};

const read = (service: WorkServiceFamily, label: string): WorkToolInfo => ({ service, section: 'research', label });
const write = (service: WorkServiceFamily, label: string): WorkToolInfo => ({ service, section: 'create', label });

/** In order: the first rule that matches wins. Exact names before patterns. */
const RULES: { test: RegExp; info: WorkToolInfo }[] = [
  // Email
  { test: /^list_emails$/, info: read('mail', 'Read recent emails') },
  { test: /^(search_emails|search_mail|find_related_emails)$/, info: read('mail', 'Search your email') },
  { test: /^(read_email|get_email_thread|get_mail_message|get_thread)$/, info: read('mail', 'Read the email thread') },
  { test: /^(read_email_attachment|save_email_attachment_to_knowledge_base)$/, info: read('mail', 'Read the attachment') },
  { test: /^(send_email|send_mail|reply_to_email|forward_email|send_email_draft)$/, info: write('mail', 'Prepare the email') },
  { test: /^(list_pending_emails|update_pending_email|list_email_drafts)$/, info: read('mail', 'Check email drafts') },
  { test: /^list_email_labels$/, info: read('mail', 'Read email labels') },
  { test: /^list_connected_accounts$/, info: read('mail', 'Check connected accounts') },
  // Calendar
  { test: /^(list_calendar_events|list_events|find_related_events)$/, info: read('calendar', 'Check your calendar') },
  { test: /^(get_calendar_event|get_event)$/, info: read('calendar', 'Read the meeting details') },
  { test: /^get_event_attendees_details$/, info: read('calendar', 'Check who is attending') },
  { test: /^find_free_slots$/, info: read('calendar', 'Find free time') },
  { test: /^check_calendar_conflicts$/, info: read('calendar', 'Check for conflicts') },
  { test: /^find_next_event$/, info: read('calendar', 'Find your next meeting') },
  { test: /^list_calendars$/, info: read('calendar', 'List your calendars') },
  { test: /^(create|update|delete|respond_to)_calendar_event$/, info: write('calendar', 'Update your calendar') },
  // Tasks
  { test: /^list_my_kanban_tasks$/, info: read('tasks', 'Scan your tasks') },
  { test: /^search_kanban_tasks$/, info: read('tasks', 'Search your tasks') },
  { test: /^get_kanban_task$/, info: read('tasks', 'Read the task') },
  { test: /^get_kanban_workload$/, info: read('tasks', 'Check the team workload') },
  {
    test: /^(list_kanban_workspaces|get_kanban_workspace|get_workspace_resources|check_workspace_permissions)$/,
    info: read('workspace', 'Check the workspaces'),
  },
  { test: /kanban|task/, info: write('tasks', 'Update the tasks') },
  // Roadmap
  { test: /roadmap|milestone/, info: read('roadmap', 'Check the roadmap') },
  // Documents and knowledge base
  { test: /canvas/, info: write('document', 'Build the document') },
  { test: /^search_documents$/, info: read('knowledge', 'Search your documents') },
  { test: /^(read_document|get_document|compare_documents)$/, info: read('knowledge', 'Read the document') },
  { test: /knowledge|document|folder|index|policy/, info: read('knowledge', 'Check the documents') },
  // People
  { test: /contact/, info: read('contacts', 'Check your contacts') },
  { test: /^list_organization_members$/, info: read('team', 'Check your team') },
  // Outside the workspace
  { test: /^search_web$/, info: read('web', 'Search the web') },
  { test: /^get_news$/, info: read('web', 'Read the latest news') },
  // Auria
  { test: /memor/, info: read('memory', 'Check what I remember') },
  { test: /^gather_context$/, info: read('workspace', 'Gather workspace context') },
  { test: /capabilit/, info: read('auria', 'Check what I can do') },
];

const VERBS: Record<string, string> = {
  get: 'Read',
  list: 'List',
  search: 'Search',
  find: 'Search',
  check: 'Check',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  manage: 'Update',
  send: 'Send',
  gather: 'Gather',
};

/** A tool not in the table yet: never breaks, says what it can. */
function fallbackInfo(name: string): WorkToolInfo {
  const parts = name.split('_').filter(Boolean);
  const verb = VERBS[parts[0] ?? ''];
  const object = (verb ? parts.slice(1) : parts).join(' ') || 'the request';
  return {
    service: 'auria',
    section: verb && /^(Create|Update|Delete|Send)$/.test(verb) ? 'create' : 'research',
    label: verb ? `${verb} ${object}` : `Work on ${object}`,
  };
}

export function describeWorkTool(name: string): WorkToolInfo {
  const key = String(name ?? '').trim().toLowerCase();
  const rule = RULES.find((r) => r.test.test(key));
  return rule ? rule.info : fallbackInfo(key);
}
