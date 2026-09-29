import fs from 'fs';
import path from 'path';
import { ai } from './gemini.ts';

export interface ChunkEmbeddingCache {
  version: string;
  model: string;
  embeddings: Record<string, number[]>; // chunkId -> embedding vector
}

const EMBEDDINGS_PATH = path.resolve(process.cwd(), 'data', 'embeddings.json');
const EMBEDDING_MODEL = 'gemini-embedding-001';

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function norm(a: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = norm(a);
  const normB = norm(b);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}

export class EmbeddingManager {
  private cache: ChunkEmbeddingCache = {
    version: '1.0',
    model: EMBEDDING_MODEL,
    embeddings: {},
  };
  private isInitialized = false;

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(EMBEDDINGS_PATH)) {
        const raw = fs.readFileSync(EMBEDDINGS_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.embeddings && typeof data.embeddings === 'object') {
          this.cache = data;
          console.log(`[Embeddings] Loaded ${Object.keys(this.cache.embeddings).length} cached embeddings from embeddings.json`);
        }
      }
    } catch (e) {
      console.warn('[Embeddings] Could not load embeddings cache, will regenerate:', e);
    }
  }

  private saveCache() {
    try {
      const tmpPath = `${EMBEDDINGS_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.cache), 'utf-8');
      fs.renameSync(tmpPath, EMBEDDINGS_PATH);
      console.log(`[Embeddings] Saved ${Object.keys(this.cache.embeddings).length} embeddings to ${EMBEDDINGS_PATH}`);
    } catch (e) {
      console.error('[Embeddings] Failed to save embeddings cache:', e);
    }
  }

  /**
   * Precompute embeddings for all chunks in knowledge.json if missing from cache
   */
  public async ensureChunkEmbeddings(
    chunks: Array<{ id: string; title: string; content: string; keywords?: string[] }>
  ): Promise<void> {
    const missingChunks = chunks.filter((c) => !this.cache.embeddings[c.id]);

    if (missingChunks.length === 0) {
      this.isInitialized = true;
      return;
    }

    console.log(`[Embeddings] Computing embeddings for ${missingChunks.length} chunks using ${EMBEDDING_MODEL}...`);

    // Process in batches of 10 to avoid payload limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < missingChunks.length; i += BATCH_SIZE) {
      const batch = missingChunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => `${c.title}\n${c.content}\n${(c.keywords || []).join(' ')}`);

      try {
        const res = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: texts,
        });

        const embeddingsArray = (res as any).embeddings || [];
        for (let j = 0; j < batch.length; j++) {
          const emb = embeddingsArray[j]?.values;
          if (emb && Array.isArray(emb)) {
            this.cache.embeddings[batch[j].id] = emb;
          }
        }
      } catch (err) {
        console.error(`[Embeddings] Error embedding batch starting at index ${i}:`, err);
        // Fallback: try one by one in this batch
        for (const chunk of batch) {
          try {
            const singleText = `${chunk.title}\n${chunk.content}`;
            const singleRes = await ai.models.embedContent({
              model: EMBEDDING_MODEL,
              contents: singleText,
            });
            const emb = (singleRes as any).embeddings?.[0]?.values;
            if (emb && Array.isArray(emb)) {
              this.cache.embeddings[chunk.id] = emb;
            }
          } catch (singleErr) {
            console.error(`[Embeddings] Failed single chunk ${chunk.id}:`, singleErr);
          }
        }
      }
    }

    this.saveCache();
    this.isInitialized = true;
    console.log('[Embeddings] Precomputation complete.');
  }

  /**
   * Embed a single query string
   */
  public async embedQuery(queryText: string): Promise<number[] | null> {
    try {
      const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: queryText,
      });
      const values = (res as any).embeddings?.[0]?.values;
      return Array.isArray(values) ? values : null;
    } catch (e) {
      console.warn('[Embeddings] embedQuery failed, falling back to pure BM25:', e);
      return null;
    }
  }

  public getChunkEmbedding(chunkId: string): number[] | undefined {
    return this.cache.embeddings[chunkId];
  }
}

export const embeddingManager = new EmbeddingManager();
