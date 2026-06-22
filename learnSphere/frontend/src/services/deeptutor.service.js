import api from './api.js';

export const deeptutorService = {
  getStatus: () => api.get('/deeptutor/status'),
  getTopology: () => api.get('/deeptutor/topology'),
  getChatSessions: limit => api.get('/deeptutor/sessions/chat', { params: { limit } }),
  getSolveSessions: limit => api.get('/deeptutor/sessions/solve', { params: { limit } }),
  testLLMConnection: () => api.post('/deeptutor/test-llm'),
};
