import { useMemo, useRef, useState } from 'react';
import {
  composeDefaultFrom,
  inboxMessages,
  type ComposeDraft,
  type MailFolder,
  type MailItem,
} from '../../data/integrationsMockData';
import { auriaProfileInitials } from '../../data/auriaMockData';

type Snack = { text: string; undo?: () => void };

/** Whether a message belongs in the given drawer folder. */
function inFolder(m: MailItem, folder: string): boolean {
  const f = m.folder ?? 'inbox';
  switch (folder) {
    case 'starred':
      return m.starred && f !== 'trash' && f !== 'spam';
    case 'all-mail':
      return f !== 'trash' && f !== 'spam';
    case 'all-inboxes':
    case 'important':
      return f === 'inbox';
    case 'drafts':
      return f === 'draft';
    case 'snoozed':
    case 'scheduled':
    case 'outbox':
      return false;
    default:
      return f === folder;
  }
}

function nowTime(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Owns the mailbox state and all message actions (folders, move, send, reply).
 * Keeps the IntegrationsScreen a thin presentational container.
 */
export function useMailbox() {
  const [messages, setMessages] = useState<MailItem[]>(() =>
    inboxMessages.map((m) => ({ ...m, folder: m.folder ?? 'inbox' })),
  );
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [query, setQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | null>(null);
  const [openMail, setOpenMail] = useState<MailItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snack, setSnack] = useState<Snack | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnack = (text: string, undo?: () => void) => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack({ text, undo });
    snackTimer.current = setTimeout(() => setSnack(null), 3600);
  };
  const dismissSnack = () => setSnack(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (!inFolder(m, activeFolder)) return false;
      if (!q) return true;
      return (
        m.sender.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
      );
    });
  }, [messages, query, activeFolder]);

  const markRead = (id: string) =>
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  const setUnread = (id: string, value: boolean) =>
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, unread: value } : m)));
  const toggleStar = (id: string) =>
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));

  const moveMail = (id: string, to: MailFolder, label: string) => {
    const prev = messages.find((m) => m.id === id)?.folder ?? 'inbox';
    setMessages((items) => items.map((m) => (m.id === id ? { ...m, folder: to } : m)));
    showSnack(label, () =>
      setMessages((items) => items.map((m) => (m.id === id ? { ...m, folder: prev } : m))),
    );
  };
  const archiveMail = (id: string) => moveMail(id, 'archive', 'Archived');
  const trashMail = (id: string) => moveMail(id, 'trash', 'Deleted');
  const spamMail = (id: string) => moveMail(id, 'spam', 'Reported spam');

  const openCompose = (draft: ComposeDraft | null = null) => {
    setComposeDraft(draft);
    setComposeOpen(true);
  };
  const closeCompose = () => {
    setComposeOpen(false);
    setComposeDraft(null);
  };
  const sendMail = (draft: ComposeDraft) => {
    const newMsg: MailItem = {
      id: `sent-${Date.now()}`,
      sender: 'me',
      initial: auriaProfileInitials,
      accent: '#2B7CD8',
      subject: draft.subject.trim() || '(no subject)',
      preview: draft.body.trim().replace(/\s+/g, ' ').slice(0, 90) || 'No content',
      time: nowTime(),
      unread: false,
      starred: false,
      category: 'team',
      folder: 'sent',
      senderEmail: composeDefaultFrom,
      to: [{ address: draft.to.trim() || 'recipient' }],
      dateLabel: 'Just now',
      labels: ['Sent'],
      bodyFull: draft.body,
    };
    setMessages((items) => [newMsg, ...items]);
    showSnack('Message sent');
  };
  const replyTo = (mail: MailItem) => {
    const subject = /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`;
    const quote = `\n\n———\nOn ${mail.dateLabel ?? mail.time}, ${mail.sender} wrote:\n${
      mail.bodyFull ?? mail.preview
    }`;
    openCompose({ to: mail.senderEmail ?? '', subject, body: quote });
  };
  const forwardMail = (mail: MailItem) => {
    const subject = /^fwd:/i.test(mail.subject) ? mail.subject : `Fwd: ${mail.subject}`;
    const quote = `\n\n———\nForwarded message\nFrom: ${mail.sender} <${mail.senderEmail ?? ''}>\nSubject: ${
      mail.subject
    }\n\n${mail.bodyFull ?? mail.preview}`;
    openCompose({ to: '', subject, body: quote });
  };

  return {
    activeFolder,
    setActiveFolder,
    query,
    setQuery,
    visible,
    openMail,
    setOpenMail,
    sidebarOpen,
    setSidebarOpen,
    refreshing,
    onRefresh,
    snack,
    dismissSnack,
    composeOpen,
    composeDraft,
    openCompose,
    closeCompose,
    markRead,
    setUnread,
    toggleStar,
    archiveMail,
    trashMail,
    spamMail,
    sendMail,
    replyTo,
    forwardMail,
  };
}
