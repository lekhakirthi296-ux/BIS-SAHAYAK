import fs from 'fs';
import path from 'path';
import { embeddingManager, cosineSimilarity } from './embeddings.ts';

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  url: string;
  lastUpdated: string;
}

export interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
  bm25Score: number;
  cosineScore: number;
  combinedScore: number;
  matchReasons: string[];
}

// Synonym Map for Domain Expansion
const SYNONYM_MAP: Record<string, string[]> = {
  mark: ['certification', 'license', 'licence', 'cml', 'marking', 'standard'],
  certification: ['mark', 'license', 'licence', 'scheme', 'registration'],
  license: ['licence', 'cml', 'certification', 'mark', 'permission'],
  ac: ['air conditioner', 'air-conditioner', 'cooling', 'is 1391'],
  'air conditioner': ['ac', 'cooling', 'split ac', 'window ac', 'is 1391'],
  helmet: ['helmets', 'headgear', 'protective helmet', 'two-wheeler', 'is 4151', 'morth'],
  helmets: ['helmet', 'headgear', 'protective helmet', 'is 4151'],
  headgear: ['helmet', 'helmets', 'is 4151'],
  geyser: ['water heater', 'storage water heater', 'is 302-2-21', 'is 2082'],
  'water heater': ['geyser', 'storage water heater', 'is 302-2-21', 'is 2082', 'is 302'],
  crs: ['compulsory registration', 'scheme 2', 'scheme ii', 'r-number', 'electronics', 'meity'],
  'compulsory registration': ['crs', 'scheme 2', 'r-number', 'electronics'],
  hallmark: ['hallmarking', 'huid', 'gold purity', 'carat', 'karat', 'jewellery', 'jewelry', 'is 1417'],
  hallmarking: ['hallmark', 'huid', 'gold purity', 'carat', 'jewellery', 'silver', 'is 1417'],
  gold: ['hallmark', 'huid', 'jewellery', 'jewelry', '22k', '18k', '14k', 'is 1417'],
  huid: ['hallmark', 'hallmarking', '6-character', '6-digit', 'verify huid', 'ahc'],
  qco: ['quality control order', 'mandatory', 'compulsory', 'section 16', 'penalties'],
  'quality control order': ['qco', 'mandatory', 'section 16', 'compulsory'],
  complaint: ['grievance', 'fake', 'counterfeit', 'substandard', 'defective', 'enforcement', 'raid', 'penalties'],
  fake: ['counterfeit', 'substandard', 'unauthorized', 'complaint', 'misuse', 'section 29'],
  counterfeit: ['fake', 'substandard', 'complaint', 'penalties'],
  toy: ['toys', 'children toys', 'is 9873', 'is 15644', 'electric toys'],
  toys: ['toy', 'children toys', 'is 9873', 'is 15644', 'electric toys'],
  wire: ['wires', 'cable', 'cables', 'is 694', 'wiring'],
  wires: ['wire', 'cable', 'cables', 'is 694'],
  cable: ['cables', 'wire', 'wires', 'is 694'],
  cables: ['cable', 'wire', 'wires', 'is 694'],
  water: ['packaged water', 'drinking water', 'bottled water', 'mineral water', 'is 14543', 'is 13428'],
  battery: ['batteries', 'lithium', 'is 16046', 'power bank', 'cells'],
  batteries: ['battery', 'lithium', 'is 16046', 'power bank'],
  footwear: ['shoes', 'leather footwear', 'sports shoes', 'safety shoes', 'is 15844'],
  shoes: ['footwear', 'safety shoes', 'sports shoes', 'is 15844'],
  textile: ['textiles', 'medical textiles', 'masks', 'ppe', 'geotextiles'],
  textiles: ['textile', 'medical textiles', 'masks', 'ppe', 'geotextiles'],
  lpg: ['gas cylinder', 'cooking gas', 'regulator', 'is 3196', 'is 9798'],
  cylinder: ['cylinders', 'lpg', 'gas cylinder', 'is 3196'],
  verify: ['verification', 'check', 'validity', 'search', 'bis care'],
  verification: ['verify', 'check', 'validity', 'authenticity'],
};

// Lightweight suffix stemmer for English
export function stemToken(word: string): string {
  if (word.length <= 3) return word;
  let w = word.toLowerCase();

  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('tion') && w.length > 5) return w.slice(0, -4) + 't';
  if (w.endsWith('ment') && w.length > 5) return w.slice(0, -4);

  return w;
}

/**
 * Normalizes IS numbers so IS302, IS 302, IS-302, or "302" can be matched accurately.
 * Returns both normalized names (e.g. "IS 302") and digits (e.g. "302").
 */
export function extractNormalizedIsNumbers(text: string): { normalized: string[]; digits: string[] } {
  const normalized: string[] = [];
  const digits: string[] = [];

  // Match patterns like "IS 302", "IS302", "IS-302", "IS 302-2-21"
  const isRegex = /\bIS\s*[-:]?\s*(\d{2,5}(?:[-/]\d+)*)\b/gi;
  let match;
  while ((match = isRegex.exec(text)) !== null) {
    const rawNumberPart = match[1];
    normalized.push(`IS ${rawNumberPart}`.toUpperCase());
    const firstDigitGroup = rawNumberPart.split(/[-/]/)[0];
    if (firstDigitGroup && firstDigitGroup.length >= 2) {
      digits.push(firstDigitGroup);
    }
  }

  // Standalone digits that strongly correlate with known standard numbers (e.g. "302", "4151", "14543")
  const standaloneRegex = /\b(302|4151|14543|13428|9873|15644|1786|2062|1489|269|13252|16046|16102|1417|2112|694|3854|2347|15844|3196|9798|14286|16221|15393|15638|1391|16444)\b/gi;
  while ((match = standaloneRegex.exec(text)) !== null) {
    const d = match[1];
    if (!digits.includes(d)) {
      digits.push(d);
      normalized.push(`IS ${d}`);
    }
  }

  return {
    normalized: Array.from(new Set(normalized)),
    digits: Array.from(new Set(digits)),
  };
}

export class HybridRetrievalEngine {
  private chunks: KnowledgeChunk[] = [];
  private avgDocLength: number = 0;
  private termDocFrequencies: Map<string, number> = new Map();

  private static STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
    'each', 'few', 'for', 'from', 'further',
    'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
    'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
    'just', 'me', 'more', 'most', 'my', 'myself',
    'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'she', 'should', 'so', 'some', 'such',
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very',
    'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'tell', 'give', 'make', 'please', 'know', 'want', 'need', 'needed'
  ]);

  constructor() {
    this.reloadIndex();
  }

  public reloadIndex() {
    try {
      const knowledgePath = path.resolve(process.cwd(), 'data', 'knowledge.json');
      const standardsPath = path.resolve(process.cwd(), 'data', 'standards.json');

      const loadedChunks: KnowledgeChunk[] = [];

      if (fs.existsSync(knowledgePath)) {
        const raw = fs.readFileSync(knowledgePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.chunks)) {
          loadedChunks.push(...data.chunks);
        }
      }

      // Also index standards from standards.json
      if (fs.existsSync(standardsPath)) {
        const raw = fs.readFileSync(standardsPath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.standards)) {
          data.standards.forEach((std: any) => {
            loadedChunks.push({
              id: `std-${std.isNumber.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
              title: `${std.isNumber}: ${std.title}`,
              content: `Standard ${std.isNumber} (${std.year}) specifies ${std.title}. Product Category: ${std.productCategory}. Scheme: ${std.scheme}. QCO Mandatory: ${std.qcoApplicable ? 'Yes (Mandatory)' : 'No (Voluntary)'}. Mandatory Enforcement Date: ${std.mandatoryDate || 'N/A'}. Scope Summary: ${std.scopeSummary}. Key Test Parameters: ${(std.labTestParameters || []).join(', ')}.`,
              keywords: [std.isNumber.toLowerCase(), std.productCategory.toLowerCase(), std.scheme.toLowerCase(), 'standard', 'qco'],
              source: `Bureau of Indian Standards (${std.isNumber})`,
              url: 'https://www.manakonline.in',
              lastUpdated: `${std.year}-01-01`,
            });
          });
        }
      }

      this.chunks = loadedChunks;
      this.computeCorpusStats();

      // Trigger precomputation of embeddings asynchronously in background
      embeddingManager.ensureChunkEmbeddings(this.chunks).catch((err) => {
        console.error('[Retrieval] Background embedding precomputation error:', err);
      });
    } catch (err) {
      console.error('Failed to load knowledge index:', err);
    }
  }

  public getAllChunks(): KnowledgeChunk[] {
    return this.chunks;
  }

  private tokenize(text: string, filterStopwords = false): string[] {
    const rawTokens = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);

    if (filterStopwords) {
      return rawTokens.filter((t) => !HybridRetrievalEngine.STOPWORDS.has(t));
    }
    return rawTokens;
  }

  private computeCorpusStats() {
    this.termDocFrequencies.clear();
    let totalLen = 0;

    for (const chunk of this.chunks) {
      const fullText = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`;
      const tokens = this.tokenize(fullText).map(stemToken);
      totalLen += tokens.length;
      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        this.termDocFrequencies.set(t, (this.termDocFrequencies.get(t) || 0) + 1);
      }
    }

    this.avgDocLength = this.chunks.length > 0 ? totalLen / this.chunks.length : 1;
  }

  /**
   * Hybrid Search: BM25 + Stemming + Synonyms + Embeddings Cosine Similarity + IS Number Boost
   */
  public async searchHybrid(query: string, topK: number = 6): Promise<ScoredChunk[]> {
    if (!query || !query.trim() || this.chunks.length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const rawQueryTokens = this.tokenize(cleanQuery, true);

    // 1. Expand query tokens with synonyms and apply stemming
    const stemmedQueryTokens = new Set<string>();
    for (const t of rawQueryTokens) {
      stemmedQueryTokens.add(stemToken(t));
      // Look up synonyms
      if (SYNONYM_MAP[t]) {
        for (const syn of SYNONYM_MAP[t]) {
          const synTokens = this.tokenize(syn, true);
          for (const st of synTokens) {
            stemmedQueryTokens.add(stemToken(st));
          }
        }
      }
    }

    // Check multi-word synonyms in cleanQuery (e.g. "air conditioner", "water heater", "quality control order")
    for (const key of Object.keys(SYNONYM_MAP)) {
      if (key.includes(' ') && cleanQuery.includes(key)) {
        for (const syn of SYNONYM_MAP[key]) {
          const synTokens = this.tokenize(syn, true);
          for (const st of synTokens) {
            stemmedQueryTokens.add(stemToken(st));
          }
        }
      }
    }

    // 2. Extract normalized IS numbers
    const { normalized: isNormalized, digits: isDigits } = extractNormalizedIsNumbers(query);

    // 3. Compute Query Embedding for Cosine Similarity
    const queryVector = await embeddingManager.embedQuery(query);

    // 4. BM25 parameters
    const N = this.chunks.length;
    const k1 = 1.5;
    const b = 0.75;

    const scored: ScoredChunk[] = [];
    let maxBm25 = 1.0;

    // First pass: compute BM25 and record match reasons
    const tempScores: Array<{
      chunk: KnowledgeChunk;
      bm25: number;
      isBoost: number;
      reasons: string[];
    }> = [];

    for (const chunk of this.chunks) {
      const docTokens = this.tokenize(chunk.content).map(stemToken);
      const titleTokens = this.tokenize(chunk.title).map(stemToken);
      const keywordTokens = this.tokenize((chunk.keywords || []).join(' ')).map(stemToken);
      const docLen = docTokens.length + titleTokens.length;

      let bm25 = 0;
      const matchReasons: string[] = [];

      for (const token of stemmedQueryTokens) {
        const tfContent = docTokens.filter((t) => t === token).length;
        const tfTitle = titleTokens.filter((t) => t === token).length * 3.5;
        const tfKeywords = keywordTokens.filter((t) => t === token).length * 2.0;
        const tf = tfContent + tfTitle + tfKeywords;

        if (tf > 0) {
          const df = this.termDocFrequencies.get(token) || 1;
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (docLen / (this.avgDocLength || 1)));
          bm25 += idf * (numerator / denominator);
          if (tfTitle > 0) matchReasons.push(`Title match: "${token}"`);
        }
      }

      // Exact IS Number Boost (critical requirement: IS302 = IS 302 = 302)
      let isBoost = 0;
      const chunkUpper = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`.toUpperCase();

      for (const isNum of isNormalized) {
        if (chunkUpper.includes(isNum)) {
          isBoost += 25.0;
          matchReasons.push(`Exact standard match: ${isNum}`);
        }
      }

      for (const digit of isDigits) {
        // Look for digit with boundary or with "IS"
        const digitRegex = new RegExp(`\\b(IS\\s*[-:]?\\s*)?${digit}\\b`, 'i');
        if (digitRegex.test(chunkUpper)) {
          isBoost += 15.0;
          matchReasons.push(`Standard number match: ${digit}`);
        }
      }

      // Phrase match bonus
      if (cleanQuery.length > 5 && chunkUpper.toLowerCase().includes(cleanQuery)) {
        bm25 += 10.0;
        matchReasons.push('Exact phrase match');
      }

      if (bm25 > maxBm25) maxBm25 = bm25;

      tempScores.push({ chunk, bm25, isBoost, reasons: matchReasons });
    }

    // Second pass: Combine normalized BM25 with Gemini Embedding Cosine Similarity
    for (const item of tempScores) {
      let cosine = 0;

      if (queryVector) {
        const chunkVector = embeddingManager.getChunkEmbedding(item.chunk.id);
        if (chunkVector) {
          cosine = Math.max(0, cosineSimilarity(queryVector, chunkVector));
          if (cosine > 0.65) {
            item.reasons.push(`Semantic similarity: ${(cosine * 100).toFixed(1)}%`);
          }
        }
      }

      // Normalized BM25: 0 to 1
      const normalizedBm25 = item.bm25 / (maxBm25 || 1);

      // Combined score weighting:
      // When embeddings are available: 45% BM25 + 55% Semantic Cosine + IS Boost
      // If embeddings unavailable: pure BM25
      let combined = queryVector
        ? normalizedBm25 * 0.45 + cosine * 0.55 + (item.isBoost > 0 ? 0.4 : 0)
        : normalizedBm25 + (item.isBoost > 0 ? 0.5 : 0);

      // Total ranking score
      const finalScore = Math.round((combined * 10 + item.isBoost) * 100) / 100;

      if (item.bm25 > 0 || cosine > 0.45 || item.isBoost > 0) {
        scored.push({
          chunk: item.chunk,
          score: finalScore,
          bm25Score: Math.round(item.bm25 * 100) / 100,
          cosineScore: Math.round(cosine * 100) / 100,
          combinedScore: Math.round(combined * 100) / 100,
          matchReasons: item.reasons,
        });
      }
    }

    // Sort descending by combined score and take top 6
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const hybridRetrieval = new HybridRetrievalEngine();
