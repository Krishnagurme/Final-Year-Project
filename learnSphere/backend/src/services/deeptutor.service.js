import axios from 'axios';

/**
 * Base URL for the DeepTutor FastAPI app.
 * Accepts either:
 *   - http://host:8000           → we call http://host:8000/api/v1/...
 *   - http://host:8000/api/v1   → used as-is (no extra suffix)
 * Default matches DeepTutor uvicorn (see learnSphere/package.json start:deeptutor --port 8000).
 */
function resolveDeepTutorApiRoot() {
  const raw = (process.env.DEEPTUTOR_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
  if (/\/api\/v1$/i.test(raw)) {
    return raw;
  }
  return `${raw}/api/v1`;
}

const baseURL = resolveDeepTutorApiRoot();

const deeptutorClient = axios.create({
  baseURL,
  timeout: 30000,
});

const normalizeError = error => {
  if (error.response) {
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.message || error.response.statusText,
    };
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      status: 503,
      data: null,
      message: `Cannot reach DeepTutor at ${baseURL}. Start the API (e.g. uvicorn) and set DEEPTUTOR_API_URL in the LearnSphere backend .env.`,
    };
  }
  return {
    status: 500,
    data: null,
    message: error.message || 'Unknown error while calling DeepTutor service',
  };
};

/** GET /api/v1/system/status — real LLM/embeddings/search diagnostics */
export const getServiceStatus = async () => {
  const response = await deeptutorClient.get('/system/status');
  return { data: response.data };
};

/** GET /api/v1/system/runtime-topology */
export const getRuntimeTopology = async () => {
  const response = await deeptutorClient.get('/system/runtime-topology');
  return { data: response.data };
};

function normalizeSessionList(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.sessions)) return body.sessions;
  return [];
}

/** GET /api/v1/chat/sessions — legacy chat session list */
export const getChatSessions = async limit => {
  const response = await deeptutorClient.get('/chat/sessions', {
    params: { limit: limit || 20 },
  });
  return { data: normalizeSessionList(response.data) };
};

/** GET /api/v1/solve/sessions — solver session list */
export const getSolveSessions = async limit => {
  const response = await deeptutorClient.get('/solve/sessions', {
    params: { limit: limit || 20 },
  });
  return { data: normalizeSessionList(response.data) };
};

/** POST /api/v1/system/test/llm — real model round-trip */
export const testLLMConnection = async () => {
  const response = await deeptutorClient.post('/system/test/llm');
  return { data: response.data };
};

export const buildErrorResponse = error => normalizeError(error);
