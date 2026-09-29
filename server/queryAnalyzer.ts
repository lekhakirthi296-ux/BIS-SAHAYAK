import { ai, callGeminiWithFallback } from './gemini.ts';

export type UserIntent =
  | 'find_standard'
  | 'certification'
  | 'verify'
  | 'complaint'
  | 'general_bis'
  | 'smalltalk';

export interface QueryAnalysis {
  standaloneQuery: string;
  intent: UserIntent;
}

const GREETING_REGEX = /^(hi|hello|hey|namaste|vanakkam|namaskara|good\s*(morning|afternoon|evening)|howdy|hola|thanks|thank\s*you)\b[\s!.,?]*$/i;

export async function analyzeQuery(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<QueryAnalysis> {
  const trimmed = message.trim();

  // 1. Fast path for greetings & smalltalk
  if (GREETING_REGEX.test(trimmed)) {
    return {
      standaloneQuery: trimmed,
      intent: 'smalltalk',
    };
  }

  // 2. Fast path for standalone IS numbers (e.g. "IS 302", "IS302", "302")
  if (/^\s*(IS\s*[-:]?\s*)?\d{2,5}\s*$/i.test(trimmed)) {
    const isNum = trimmed.toUpperCase().replace(/\s+/g, ' ');
    return {
      standaloneQuery: isNum.startsWith('IS') ? isNum : `IS ${isNum}`,
      intent: 'find_standard',
    };
  }

  // 3. Fast classification for self-contained direct queries
  const lower = trimmed.toLowerCase();
  let directIntent: UserIntent = 'general_bis';

  if (lower.includes('verify') || lower.includes('check mark') || lower.includes('check license') || lower.includes('huid')) {
    directIntent = 'verify';
  } else if (lower.includes('complaint') || lower.includes('grievance') || lower.includes('fake') || lower.includes('substandard') || lower.includes('counterfeit')) {
    directIntent = 'complaint';
  } else if (lower.includes('register') || lower.includes('certification') || lower.includes('procedure') || lower.includes('apply') || lower.includes('scheme') || lower.includes('how to get') || lower.includes('crs')) {
    directIntent = 'certification';
  } else if (lower.includes('which mark') || lower.includes('standard') || lower.includes('is ') || lower.includes('helmet') || lower.includes('heater') || lower.includes('specification')) {
    directIntent = 'find_standard';
  } else if (lower.includes('qco') || lower.includes('hallmarking') || lower.includes('what is') || lower.includes('bis mandate')) {
    directIntent = 'general_bis';
  }

  // If no conversational history or the query has no ambiguous pronouns, return directly
  const hasPronoun = /\b(it|that|this|these|those|them|above|same|previous|its)\b/i.test(trimmed);
  if (history.length === 0 || (!hasPronoun && trimmed.split(' ').length >= 3)) {
    return {
      standaloneQuery: trimmed,
      intent: directIntent,
    };
  }

  // 4. Contextual Query Rewriting using Gemini when history context is required
  try {
    const recentHistory = history.slice(-4);
    const historyText = recentHistory.map((m) => `${m.role}: ${m.content}`).join('\n');

    const systemInstruction = `You are an expert query preprocessor for the Bureau of Indian Standards (BIS) assistant.
Rewrite the user's latest message into a clear standalone search query resolving ambiguous pronouns using the recent chat history.
Classify the intent into: "find_standard", "certification", "verify", "complaint", "general_bis", "smalltalk".

Return JSON only:
{
  "standaloneQuery": "string",
  "intent": "find_standard" | "certification" | "verify" | "complaint" | "general_bis" | "smalltalk"
}`;

    const prompt = `Chat History:\n${historyText}\n\nLatest User Message: "${trimmed}"`;

    const result = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      return resp.text || '{}';
    });

    const parsed = JSON.parse(result);
    return {
      standaloneQuery: parsed.standaloneQuery || trimmed,
      intent: (parsed.intent as UserIntent) || directIntent,
    };
  } catch (err) {
    return {
      standaloneQuery: trimmed,
      intent: directIntent,
    };
  }
}
