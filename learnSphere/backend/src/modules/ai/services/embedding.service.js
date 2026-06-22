import OpenAI from 'openai';
import { aiConfig, isRemoteLlmEnabled } from '../utils/aiConfig.js';
import { normalizeVector } from '../utils/vector.js';

let client = null;

const getClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: aiConfig.apiKey,
      baseURL: aiConfig.baseUrl || undefined,
    });
  }
  return client;
};

const buildLocalEmbedding = text => {
  const dimensions = aiConfig.embeddingDimension;
  const vector = new Array(dimensions).fill(0);
  const tokens = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return vector;
  }

  tokens.forEach((token, tokenIndex) => {
    for (let index = 0; index < token.length; index += 1) {
      const dimension = (token.charCodeAt(index) + tokenIndex + index * 13) % dimensions;
      vector[dimension] += (token.charCodeAt(index) % 23) / 23;
    }
  });

  return normalizeVector(vector);
};

export const embeddingService = {
  async embedText(text) {
    if (!isRemoteLlmEnabled()) {
      return buildLocalEmbedding(text);
    }

    const response = await getClient().embeddings.create({
      model: aiConfig.embeddingModel,
      input: text,
    });

    return response.data[0]?.embedding || buildLocalEmbedding(text);
  },

  async embedMany(texts = []) {
    if (!texts.length) {
      return [];
    }

    if (!isRemoteLlmEnabled()) {
      return texts.map(buildLocalEmbedding);
    }

    const response = await getClient().embeddings.create({
      model: aiConfig.embeddingModel,
      input: texts,
    });

    return response.data.map(item => item.embedding);
  },
};
