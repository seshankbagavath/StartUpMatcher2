import OpenAI from "openai";

/**
 * Lazily-constructed OpenAI-compatible client.
 *
 * Works with any OpenAI-compatible endpoint (OpenAI, Groq, etc.) configured via:
 *   - AI_INTEGRATIONS_OPENAI_API_KEY   (required to enable real AI)
 *   - AI_INTEGRATIONS_OPENAI_BASE_URL  (defaults to Groq's OpenAI-compatible URL)
 *
 * If no API key is present the client is `null` and callers should fall back to
 * a local mock. Construction is deferred so importing this module never throws.
 */

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";

/** Chat model id — Groq default, overridable via AI_MODEL. */
export const AI_MODEL = process.env.AI_MODEL ?? "llama-3.3-70b-versatile";

/** Embedding model id — only used when the provider supports embeddings. */
export const AI_EMBED_MODEL =
  process.env.AI_EMBED_MODEL ?? "text-embedding-3-small";

let _client: OpenAI | null | undefined;

/** Returns a configured client, or `null` when no API key is set. */
export function getAIClient(): OpenAI | null {
  if (_client !== undefined) return _client;

  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) {
    _client = null;
    return _client;
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
  });
  return _client;
}

/** True when a real AI provider is configured. */
export function isAIEnabled(): boolean {
  return getAIClient() !== null;
}

/**
 * Back-compat proxy: existing code imports `openai` and calls
 * `openai.chat.completions.create(...)`. Accessing it when unconfigured throws,
 * so prefer `getAIClient()` in new code and guard with `isAIEnabled()`.
 */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getAIClient();
    if (!client) {
      throw new Error(
        "AI client is not configured (set AI_INTEGRATIONS_OPENAI_API_KEY).",
      );
    }
    return Reflect.get(client, prop, client);
  },
});
