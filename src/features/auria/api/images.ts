import { auriaHttp } from './http';
import { auriaRoutes } from './routes';

/** The only sizes the server takes (E06). */
export type AuriaImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export type GenerateImageRequest = {
  prompt: string;
  size: AuriaImageSize;
  /** The open chat; without one the server creates it and answers with its id. */
  chatId?: string | null;
  /** Stops waiting for the image (the server may still finish and save it). */
  signal?: AbortSignal;
};

export type GeneratedImage = {
  imageUrl: string;
  /** What the provider actually drew, when it rewrote the prompt. */
  revisedPrompt: string | null;
  chatId: string;
};

type ApiGeneratedImage = {
  image_url?: string;
  revised_prompt?: string | null;
  chat_id?: string;
};

/**
 * Generates an image (E06). The server charges it, saves the pair of messages
 * in the chat (the request and the image) and answers with the absolute URL,
 * so the chat is re-read afterwards instead of inventing the messages here.
 * Images take a while: it gets the same timeout as a full turn.
 */
export async function generateImage({ prompt, size, chatId, signal }: GenerateImageRequest): Promise<GeneratedImage> {
  const body: Record<string, unknown> = { prompt, size, quality: 'standard' };
  if (chatId) body.chat_id = chatId;
  const data = await auriaHttp.post<ApiGeneratedImage>(auriaRoutes.generateImage, body, {
    timeoutMs: 180_000,
    signal,
  });
  if (!data.image_url || !data.chat_id) throw new Error('The server did not return an image.');
  return {
    imageUrl: data.image_url,
    revisedPrompt: data.revised_prompt?.trim() || null,
    chatId: data.chat_id,
  };
}
