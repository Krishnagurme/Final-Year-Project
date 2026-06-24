const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Central AI configuration.
 * Uses JS getters so values are resolved AFTER dotenv.config() runs in index.js.
 *
 * Key variables (set in backend/.env):
 *   AI_API_KEY     — API key for the AI gateway (OpenRouter, OpenAI, etc.)
 *   AI_BASE_URL    — API base URL  e.g. https://openrouter.ai/api/v1
 *   AI_CHAT_MODEL  — Model name    e.g. deepseek/deepseek-chat
 *   AI_PROVIDER    — Label         e.g. openrouter
 */
export const aiConfig = {
  get provider()           { return process.env.AI_PROVIDER || 'openai'; },

  // Accept both AI_API_KEY (new) and OPENAI_API_KEY (legacy fallback)
  get apiKey()             { return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''; },

  // Accept both AI_BASE_URL (new) and OPENAI_BASE_URL (legacy fallback)
  get baseUrl()            { return process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || ''; },

  get chatModel()          { return process.env.AI_CHAT_MODEL || 'deepseek/deepseek-chat'; },
  get embeddingModel()     { return process.env.AI_EMBEDDING_MODEL || 'local'; },
  get embeddingDimension() { return toNumber(process.env.AI_EMBEDDING_DIMENSION, 256); },
  get chunkSize()          { return toNumber(process.env.AI_CHUNK_SIZE, 900); },
  get chunkOverlap()       { return toNumber(process.env.AI_CHUNK_OVERLAP, 180); },
  get retrievalLimit()     { return toNumber(process.env.AI_RETRIEVAL_LIMIT, 6); },
  get maxSessionMessages() { return toNumber(process.env.AI_MAX_SESSION_MESSAGES, 12); },
  get maxMemoryItems()     { return toNumber(process.env.AI_MAX_MEMORY_ITEMS, 6); },
  get maxUploadSizeBytes() { return toNumber(process.env.AI_MAX_UPLOAD_SIZE_BYTES, 10 * 1024 * 1024); },
};

export const isRemoteLlmEnabled = () => Boolean(aiConfig.apiKey);
