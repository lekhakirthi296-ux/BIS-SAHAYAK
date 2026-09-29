import { GoogleGenAI, Type } from '@google/genai';

// Initialize GoogleGenAI SDK with required aistudio-build header
const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in priority sequence per requirements:
// Try process.env.GEMINI_MODEL, then gemini-2.5-flash, then gemini-2.5-flash-lite,
// followed by active flash and flash-lite models for seamless continuity.
const candidateModels = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ].filter((m): m is string => Boolean(m && m.trim().length > 0))
  )
);

/**
 * Execute a Gemini call with model fallback on 404/429 and retry on 502/503/504
 * Requirement:
 * "Model fallback: try process.env.GEMINI_MODEL, then gemini-2.5-flash, then gemini-2.5-flash-lite.
 *  On 404 or 429 move to the next model. On 502/503/504 retry twice with back-off.
 *  Convert raw API errors into short, friendly messages."
 */
export async function callGeminiWithFallback<T = any>(
  fn: (modelName: string) => Promise<T>
): Promise<T> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  let lastError: any = null;

  for (const model of candidateModels) {
    let attempts = 0;
    const maxAttempts = 3; // Initial + 2 retries for 502/503/504

    while (attempts < maxAttempts) {
      attempts++;
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.statusCode || (err?.message && err.message.includes('429') ? 429 : 0);
        const errStr = String(err?.message || err);

        // Check for 502/503/504 transient server error -> retry twice with backoff
        if (
          status === 502 ||
          status === 503 ||
          status === 504 ||
          errStr.includes('502') ||
          errStr.includes('503') ||
          errStr.includes('504') ||
          errStr.includes('temporarily unavailable') ||
          errStr.includes('high demand')
        ) {
          if (attempts < maxAttempts) {
            const delay = attempts * 750;
            await new Promise((res) => setTimeout(res, delay));
            continue; // retry same model
          }
          // Exhausted retries on 502/503/504 -> move to next model
          break;
        }

        // Requirement: "On 404 or 429 move to the next model."
        if (
          status === 404 ||
          status === 429 ||
          errStr.includes('404') ||
          errStr.includes('429') ||
          errStr.includes('NOT_FOUND') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('quota')
        ) {
          console.warn(`[Gemini Fallback] Model ${model} encountered status ${status || 'rate/not found'}. Moving directly to next candidate model.`);
          break; // Move to next candidate model immediately without retrying this model
        }

        // Other non-retriable errors: also break to try next model or report
        break;
      }
    }
  }

  // Convert raw API errors into clean, friendly messages
  const rawMsg = lastError?.message || String(lastError || 'Unknown error');
  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('BIS Sahayak AI is currently processing high traffic. Please try your request again in a few moments.');
  }
  if (rawMsg.includes('API key') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('403')) {
    throw new Error('AI service authorization is unavailable. Please verify the server configuration.');
  }
  throw new Error('Unable to complete AI query at this time. Please try again shortly or contact BIS Support.');
}
