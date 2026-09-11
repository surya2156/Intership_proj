/**
 * Embeddings + semantic retrieval for "Ask LOOP" (AI3).
 *
 * Default implementation: a deterministic hashing-based bag-of-words vector.
 * This needs no extra API key or paid embeddings provider, so the project
 * runs end-to-end out of the box. It is good enough to retrieve topically
 * relevant feedback for a RAG demo.
 *
 * For production quality, swap `embedText` below for a real embeddings
 * provider (Anthropic recommends Voyage AI — https://docs.voyageai.com) and
 * switch the Embedding.vector column to pgvector (see README "Using
 * pgvector"). The rest of the retrieval pipeline (cosineSimilarity,
 * retrieveTopK) does not need to change.
 */

const DIMENSIONS = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Simple deterministic string hash -> bucket index. */
function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash % DIMENSIONS;
}

export function embedText(text: string): number[] {
  const vector = new Array(DIMENSIONS).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    vector[hashToken(token)] += 1;
  }
  // L2-normalize so cosine similarity behaves well regardless of length.
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are already normalized, so dot product == cosine similarity
}

export function retrieveTopK<T extends { vector: number[] }>(
  queryVector: number[],
  items: T[],
  k = 6
): (T & { score: number })[] {
  return items
    .map((item) => ({ ...item, score: cosineSimilarity(queryVector, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
