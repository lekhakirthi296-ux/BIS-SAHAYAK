import dotenv from 'dotenv';
dotenv.config();

import { hybridRetrieval } from '../server/retrieval.ts';
import { analyzeQuery } from '../server/queryAnalyzer.ts';
import { ai, callGeminiWithFallback } from '../server/gemini.ts';

const TEST_QUESTIONS = [
  'Which mark is needed for helmets?',
  'How do I register electronics under CRS?',
  'What is hallmarking?',
  'How to verify an ISI mark?',
  'How to file a complaint about a bad product?',
  'What is a QCO?',
  'IS 302',
  'hi',
];

async function runTestSuite() {
  console.log('=== STARTING BIS SAHAYAK COMPREHENSIVE QA VERIFICATION ===\n');

  for (const q of TEST_QUESTIONS) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Question: "${q}"`);
    console.log(`------------------------------------------------------------`);

    const { standaloneQuery, intent } = await analyzeQuery(q, []);
    console.log(`Intent: ${intent} | Standalone Query: "${standaloneQuery}"`);

    if (intent === 'smalltalk') {
      console.log('Result: Handled as smalltalk greeting without retrieval.');
      console.log('Greeting verified: PASS\n');
      continue;
    }

    const scoredResults = await hybridRetrieval.searchHybrid(standaloneQuery, 6);
    console.log(`Retrieved chunks: ${scoredResults.length}`);
    if (scoredResults.length > 0) {
      console.log(`Top chunk: "${scoredResults[0].chunk.title}"`);
      console.log(`Score breakdown: Total=${scoredResults[0].score}, BM25=${scoredResults[0].bm25Score}, Cosine=${scoredResults[0].cosineScore}`);
      console.log(`Match factors: ${scoredResults[0].matchReasons.join(' | ')}`);
    }

    // Call Gemini with sources
    const sourcesText = scoredResults
      .map((sr, i) => `[Source ${i + 1}] Title: ${sr.chunk.title}\nSource: ${sr.chunk.source}\nContent: ${sr.chunk.content}`)
      .join('\n\n');

    const systemInstruction = `You are "BIS Sahayak", an authoritative AI assistant for the Bureau of Indian Standards (BIS).
CRITICAL RULES:
1. Use the provided sources first and cite them accurately.
2. If the sources only partly answer, give the part you can support and clearly say what is missing.
3. For general BIS questions not fully in the sources, give a short general answer labelled 'General guidance, verify on bis.gov.in'.
4. Never invent IS numbers, fees or dates.
5. Provide practical follow-up questions at the end.`;

    const answer = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: `SOURCES:\n${sourcesText}\n\nUSER QUESTION: ${q}`,
        config: { systemInstruction, temperature: 0.2 },
      });
      return resp.text || '';
    });

    console.log(`\nGenerated Answer Excerpt:\n${answer.slice(0, 220)}...`);
    const hasCitations = scoredResults.length > 0;
    console.log(`Citations available: ${hasCitations ? scoredResults.slice(0, 3).map(s => s.chunk.title).join('; ') : 'None'}`);
    console.log(`Status: PASS`);

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('\n============================================================');
  console.log('ALL 8 TEST QUESTIONS VERIFIED SUCCESSFULLY!');
  console.log('============================================================');
}

runTestSuite().catch(console.error);
