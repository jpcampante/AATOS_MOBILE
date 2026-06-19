export type ModelProvider = 'anthropic' | 'openai' | 'google';

export interface AIModel {
  id: string;
  provider: ModelProvider;
  name: string;
  description: string;
  available: boolean;
  /** Optional effort tag shown on the composer pill (e.g. "Max"). */
  effort?: string;
}

export const DEFAULT_MODEL_ID = 'claude-opus-4-8';

/** Provider sections render in this order (host brand first). */
export const PROVIDER_ORDER: ModelProvider[] = ['anthropic', 'openai', 'google'];

export const PROVIDER_LABEL: Record<ModelProvider, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  google: 'Gemini',
};

export const MODEL_CATALOG: AIModel[] = [
  // ─── Claude (Anthropic) ───────────────────────────────
  { id: 'claude-opus-4-8', provider: 'anthropic', name: 'Opus 4.8', description: 'For complex tasks', available: true, effort: 'Max' },
  { id: 'claude-sonnet-4-6', provider: 'anthropic', name: 'Sonnet 4.6', description: 'Most efficient for everyday tasks', available: true },
  { id: 'claude-haiku-4-5', provider: 'anthropic', name: 'Haiku 4.5', description: 'Fastest for quick answers', available: true },
  { id: 'claude-fable-5', provider: 'anthropic', name: 'Fable 5', description: 'For your toughest challenges', available: false },

  // ─── OpenAI ───────────────────────────────────────────
  { id: 'gpt-5-1', provider: 'openai', name: 'GPT-5.1', description: 'Flagship for advanced reasoning and coding', available: true },
  { id: 'gpt-5', provider: 'openai', name: 'GPT-5', description: 'Strong general-purpose reasoning', available: true },
  { id: 'gpt-5-mini', provider: 'openai', name: 'GPT-5 mini', description: 'Faster and cheaper for most tasks', available: true },

  // ─── Gemini (Google) ──────────────────────────────────
  { id: 'gemini-3-pro', provider: 'google', name: 'Gemini 3 Pro', description: 'Top-tier multimodal reasoning, long context', available: true },
  { id: 'gemini-3-flash', provider: 'google', name: 'Gemini 3 Flash', description: 'Fast, low-cost model for everyday tasks', available: true },
  { id: 'gemini-2-5-pro', provider: 'google', name: 'Gemini 2.5 Pro', description: 'Proven long-context reasoning', available: true },
];

export const MODELS_BY_PROVIDER: Record<ModelProvider, AIModel[]> = {
  anthropic: MODEL_CATALOG.filter((m) => m.provider === 'anthropic'),
  openai: MODEL_CATALOG.filter((m) => m.provider === 'openai'),
  google: MODEL_CATALOG.filter((m) => m.provider === 'google'),
};

export function getModelById(id: string): AIModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
