/** Mock data for the Mail drawer's Calendar and Contacts views. */

export type Contact = {
  id: string;
  name: string;
  initial: string;
  accent: string;
  email: string;
  phone?: string;
  role?: string;
};

export const contacts: Contact[] = [
  {
    id: 'c-alisson',
    name: 'Alisson Suassuna',
    initial: 'AS',
    accent: '#2E7D32',
    email: 'alissonsuassuna@gmail.com',
    phone: '+358 40 111 2233',
    role: 'Engineering',
  },
  {
    id: 'c-clariana',
    name: 'Clariana Abreu',
    initial: 'CA',
    accent: '#7C3AED',
    email: 'abreuclariana@gmail.com',
    phone: '+358 41 555 9090',
    role: 'Product',
  },
  {
    id: 'c-joao',
    name: 'João Campante',
    initial: 'JC',
    accent: '#1565C0',
    email: 'jpcampante@myceo.fi',
    phone: '+358 46 891 5660',
    role: 'CEO & Founder',
  },
  {
    id: 'c-julio',
    name: 'Julio Cesar Hunas',
    initial: 'JH',
    accent: '#00838F',
    email: 'juliocesarhunas@gmail.com',
    role: 'Documentation',
  },
  {
    id: 'c-marta',
    name: 'Marta Campante',
    initial: 'MA',
    accent: '#2B7CD8',
    email: 'martinscampante@gmail.com',
    phone: '+358 46 891 5660',
    role: 'You',
  },
  {
    id: 'c-nare',
    name: 'Nare Lopes',
    initial: 'NL',
    accent: '#C2185B',
    email: 'narelopes2@gmail.com',
    role: 'Marketing',
  },
  {
    id: 'c-openai',
    name: 'OpenAI',
    initial: 'O',
    accent: '#10A37F',
    email: 'support@openai.com',
    role: 'Service',
  },
  {
    id: 'c-supabase',
    name: 'Supabase',
    initial: 'S',
    accent: '#2E7D32',
    email: 'no-reply@supabase.io',
    role: 'Service',
  },
  {
    id: 'c-topaz',
    name: 'Topaz Labs',
    initial: 'T',
    accent: '#E65100',
    email: 'hello@topazlabs.com',
    role: 'Service',
  },
  {
    id: 'c-vercel',
    name: 'Vercel',
    initial: 'V',
    accent: '#111111',
    email: 'notifications@vercel.com',
    role: 'Service',
  },
];

export type CalEvent = {
  id: string;
  title: string;
  /** ISO date — YYYY-MM-DD. */
  date: string;
  start: string;
  end: string;
  color: string;
  location?: string;
};

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function offsetIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** Events clustered around the real current date so the calendar always has content. */
export const calendarEvents: CalEvent[] = [
  { id: 'e1', title: 'Design sync', date: offsetIso(0), start: '09:30', end: '10:15', color: '#2B7CD8', location: 'Meet' },
  { id: 'e2', title: 'Auria roadmap review', date: offsetIso(0), start: '13:00', end: '14:00', color: '#7C3AED', location: 'Room 2' },
  { id: 'e3', title: 'Security audit follow-up', date: offsetIso(-1), start: '16:00', end: '16:45', color: '#B3261E' },
  { id: 'e4', title: '1:1 with Alisson', date: offsetIso(1), start: '11:00', end: '11:30', color: '#2E7D32' },
  { id: 'e5', title: 'Client onboarding call', date: offsetIso(2), start: '15:00', end: '16:00', color: '#E65100', location: 'Zoom' },
  { id: 'e6', title: 'Sprint planning', date: offsetIso(3), start: '10:00', end: '11:30', color: '#1565C0' },
  { id: 'e7', title: 'Team lunch', date: offsetIso(5), start: '12:30', end: '13:30', color: '#F5A524', location: 'Kitchen' },
];
