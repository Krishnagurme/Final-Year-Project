const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const aiConfig = {
  provider: process.env.AI_PROVIDER || 'openai',
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || '',
  chatModel: process.env.AI_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  embeddingModel:
    process.env.AI_EMBEDDING_MODEL ||
    process.env.OPENAI_EMBEDDING_MODEL ||
    'text-embedding-3-small',
  embeddingDimension: toNumber(process.env.AI_EMBEDDING_DIMENSION, 256),
  chunkSize: toNumber(process.env.AI_CHUNK_SIZE, 900),
  chunkOverlap: toNumber(process.env.AI_CHUNK_OVERLAP, 180),
  retrievalLimit: toNumber(process.env.AI_RETRIEVAL_LIMIT, 6),
  maxSessionMessages: toNumber(process.env.AI_MAX_SESSION_MESSAGES, 12),
  maxMemoryItems: toNumber(process.env.AI_MAX_MEMORY_ITEMS, 6),
  maxUploadSizeBytes: toNumber(process.env.AI_MAX_UPLOAD_SIZE_BYTES, 10 * 1024 * 1024),
};

export const isRemoteLlmEnabled = () => Boolean(aiConfig.apiKey);
