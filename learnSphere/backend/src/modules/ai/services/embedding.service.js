import OpenAI from 'openai';
import { aiConfig, isRemoteLlmEnabled } from '../utils/aiConfig.js';
import { normalizeVector } from '../utils/vector.js';

let _client = null;
let _clientKey = '';

const getClient = () => {
  const currentKey = `${aiConfig.apiKey}||${aiConfig.baseUrl}`;
  if (!_client || _clientKey !== currentKey) {
    _clientKey = currentKey;
    _client = new OpenAI({
      apiKey: aiConfig.apiKey,
      baseURL: aiConfig.baseUrl || undefined,
      defaultHeaders: aiConfig.baseUrl?.includes('openrouter.ai')
        ? { 'HTTP-Referer': 'https://learnsphere.app', 'X-Title': 'LearnSphere' }
        : {},
    });
  }
  return _client;
};

// ─── Local deterministic embedding (no API call) ──────────────────────────────
// Fast, reproducible, and sufficient for cosine similarity across small corpora.
const buildLocalEmbedding = text => {
  const dimensions = aiConfig.embeddingDimension;
  const vector = new Array(dimensions).fill(0);
  const tokens = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return vector;

  tokens.forEach((token, tokenIndex) => {
    for (let i = 0; i < token.length; i++) {
      const dim = (token.charCodeAt(i) + tokenIndex + i * 13) % dimensions;
      vector[dim] += (token.charCodeAt(i) % 23) / 23;
    }
  });

  return normalizeVector(vector);
};

/**
 * Decides whether to use the real embeddings API.
 * OpenRouter does NOT support /embeddings — always use local for OpenRouter.
 * Only use remote embeddings when pointed at a real OpenAI endpoint.
 */
const shouldUseRemoteEmbeddings = () =>
  isRemoteLlmEnabled() &&
  !aiConfig.baseUrl?.includes('openrouter.ai') &&
  aiConfig.embeddingModel !== 'local';

export const embeddingService = {
  async embedText(text) {
    if (!shouldUseRemoteEmbeddings()) {
      return buildLocalEmbedding(text);
    }
    const response = await getClient().embeddings.create({
      model: aiConfig.embeddingModel,
      input: text,
    });
    return response.data[0]?.embedding || buildLocalEmbedding(text);
  },

  async embedMany(texts = []) {
    if (!texts.length) return [];
    if (!shouldUseRemoteEmbeddings()) {
      return texts.map(buildLocalEmbedding);
    }
    const response = await getClient().embeddings.create({
      model: aiConfig.embeddingModel,
      input: texts,
    });
    return response.data.map(item => item.embedding);
  },
};
