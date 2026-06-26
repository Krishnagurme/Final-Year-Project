import api, { API_BASE_URL } from './api.js';

export const authService = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: data => api.post('/auth/refresh-token', data),
  changePassword: data => api.post('/auth/change-password', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: data => api.put('/users/profile', data),
};

export const courseService = {
  getAllCourses: params => api.get('/courses', { params }),
  getCourseById: id => api.get(`/courses/${id}`),
  createCourse: data => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: id => api.delete(`/courses/${id}`),
  enrollCourse: id => api.post(`/courses/${id}/enroll`),
  getMyEnrollments: () => api.get('/courses/my/enrollments'),
  getInstructorCourses: () => api.get('/courses/instructor/my-courses'),
  getPrerequisiteQuestions: id => api.get(`/courses/${id}/prerequisite`),
  submitPrerequisiteAnswers: (id, answers) => api.post(`/courses/${id}/prerequisite/submit`, { answers }),
  getEnrolledCourseDetail: id => api.get(`/courses/${id}/detail`),
  accessTopic: (courseId, lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/access`),
  completeTopic: (courseId, lessonId) => api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
  getTopics: courseId => api.get(`/courses/${courseId}/topics`),
  createTopic: (courseId, data) => api.post(`/courses/${courseId}/topics`, data),
  updateTopic: (courseId, topicId, data) => api.put(`/courses/${courseId}/topics/${topicId}`, data),
  deleteTopic: (courseId, topicId) => api.delete(`/courses/${courseId}/topics/${topicId}`),
  getPrerequisiteResults: () => api.get('/courses/my/prerequisite-results'),
  uploadFile: formData =>
    api.post('/courses/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export const assessmentService = {
  // Get all assessment-supported subjects
  getSubjects: () => api.get('/assessments/subjects'),

  // Generate a dynamic test for a subject
  generateTest: (subject, options = {}) =>
    api.post(`/assessments/generate-test/${encodeURIComponent(subject)}`, options),

  // Evaluate prerequisites and get AI assessment
  evaluatePrerequisites: data => api.post('/assessments/evaluate-prerequisites', data),

  // Submit assessment and update progress
  submitAssessment: data => api.post('/assessments/submit-assessment', data),

  // Get my assessments
  getMyAssessments: () => api.get('/assessments/my-assessments'),

  // Get assessment history analytics
  getHistoryAnalytics: () => api.get('/assessments/history/analytics'),

  // Get analytics
  getAnalytics: () => api.get('/assessments/analytics'),
};

export const xpService = {
  // Get gamification stats
  getStats: () => api.get('/xp/stats'),

  // Add XP (for testing)
  addXP: (xpAmount, reason) => api.post('/xp/add', { xpAmount, reason }),

  // Update learning streak
  updateStreak: () => api.post('/xp/streak'),

  // Update topic progress
  updateTopicProgress: data => api.post('/xp/topic-progress', data),

  // Get topic progress for a course
  getTopicProgress: courseId => api.get(`/xp/topic-progress/${courseId}`),

  // Get achievements
  getAchievements: () => api.get('/xp/achievements'),

  // Get leaderboard
  getLeaderboard: (limit = 10) => api.get(`/xp/leaderboard?limit=${limit}`),
};

export const topicQuizService = {
  // Generate topic quiz
  generateQuiz: data => api.post('/topic-quiz/generate', data),

  // Get topic quiz
  getQuiz: (courseId, topicId) => api.get(`/topic-quiz/${courseId}/${topicId}`),

  // Submit topic quiz
  submitQuiz: data => api.post('/topic-quiz/submit', data),

  // Get all topic quizzes for a course
  getCourseQuizzes: courseId => api.get(`/topic-quiz/course/${courseId}`),
};

export const finalAssessmentService = {
  // Generate final assessment
  generateAssessment: data => api.post('/final-assessment/generate', data),

  // Submit final assessment
  submitAssessment: data => api.post('/final-assessment/submit', data),

  // Check eligibility for final assessment
  checkEligibility: courseId => api.get(`/final-assessment/eligibility/${courseId}`),
};

export const analyticsService = {
  // Get course completion analytics
  getCourseCompletion: () => api.get('/analytics/completion'),

  // Get skill progression analytics
  getSkillProgression: () => api.get('/analytics/skills'),

  // Get assessment history analytics
  getAssessmentHistory: (limit = 50) => api.get('/analytics/assessments', { params: { limit } }),

  // Get confidence score analytics
  getConfidenceScores: () => api.get('/analytics/confidence'),

  // Get complete dashboard analytics
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),

  // Get admin-level analytics
  getAdminAnalytics: () => api.get('/analytics/admin'),
};

export const deeptutorService = {
  getStatus: () => api.get('/deeptutor/status'),
  getTopology: () => api.get('/deeptutor/topology'),
  getChatSessions: limit => api.get('/deeptutor/sessions/chat', { params: { limit } }),
  getSolveSessions: limit => api.get('/deeptutor/sessions/solve', { params: { limit } }),
  testLLMConnection: () => api.post('/deeptutor/test-llm'),
};

const parseSseChunk = chunk => {
  const events = [];
  const segments = chunk.split('\n\n');

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    let eventName = 'message';
    let data = '';

    for (const line of trimmed.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      }
      if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      }
    }

    if (data) {
      events.push({
        event: eventName,
        payload: JSON.parse(data),
      });
    }
  }

  return events;
};

export const aiService = {
  getOverview: () => api.get('/ai/overview'),
  getAssistantSummary: () => api.get('/ai/assistant-summary'),
  getSessions: () => api.get('/ai/sessions'),
  createSession: data => api.post('/ai/sessions', data),
  getSession: sessionId => api.get(`/ai/sessions/${sessionId}`),
  deleteSession: sessionId => api.delete(`/ai/sessions/${sessionId}`),
  getDocuments: () => api.get('/ai/documents'),
  deleteDocument: documentId => api.delete(`/ai/documents/${documentId}`),
  uploadDocument: formData =>
    api.post('/ai/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  async streamMessage({ sessionId, message, documentIds, onEvent }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/ai/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, documentIds }),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(text || 'Streaming request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      parts.forEach(part => {
        parseSseChunk(part).forEach(item => onEvent?.(item.event, item.payload));
      });
    }

    if (buffer.trim()) {
      parseSseChunk(buffer).forEach(item => onEvent?.(item.event, item.payload));
    }
  },
};

export const userService = {
  getUserById: id => api.get(`/users/${id}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: data => api.put('/users/profile', data),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  updateAssessmentProgress: data => api.post('/users/update-assessment-progress', data),
};

export const certificateService = {
  // Get all user's certificates
  getMyCertificates: () => api.get('/certificates/my'),
  
  // Get a single certificate
  getCertificate: id => api.get(`/certificates/${id}`),
  
  // Generate certificate when eligible
  generateCertificate: data => api.post('/certificates/generate', data),
  
  // Verify certificate with token
  verifyCertificate: token => api.get(`/certificates/verify/${token}`),
  
  // Download certificate
  downloadCertificate: (id, format = 'json') => api.get(`/certificates/${id}/download`, { params: { format } }),
  
  // Share certificate
  shareCertificate: id => api.post(`/certificates/${id}/share`),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: () => api.get('/admin/users'),
  createUser: data => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: id => api.delete(`/admin/users/${id}`),
  suspendUser: id => api.post(`/admin/users/${id}/suspend`),
  getCourses: () => api.get('/admin/courses'),
  createCourse: data => api.post('/admin/courses', data),
  deleteCourse: id => api.delete(`/admin/courses/${id}`),
  getCategories: () => api.get('/admin/categories'),
  getAssessments: () => api.get('/admin/assessments'),
  getCertificates: () => api.get('/admin/certificates'),
  getSettings: () => api.get('/admin/settings'),
  saveSettings: data => api.post('/admin/settings', data),
  getSupport: () => api.get('/admin/support'),
  createSupportTicket: data => api.post('/admin/support', data),
  updateSupportTicket: (id, data) => api.patch(`/admin/support/${id}`, data),
  getCmsPosts: () => api.get('/admin/cms'),
  createCmsPost: data => api.post('/admin/cms', data),
  getQuestions: params => api.get('/admin/questions', { params }),
  createQuestion: data => api.post('/admin/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: id => api.delete(`/admin/questions/${id}`),
  getTests: () => api.get('/admin/tests'),
  createTest: data => api.post('/admin/tests', data),
  updateTest: (id, data) => api.put(`/admin/tests/${id}`, data),
  deleteTest: id => api.delete(`/admin/tests/${id}`),
  updateTestStatus: (id, status) => api.post(`/admin/tests/${id}/status`, { status }),
  getResults: params => api.get('/admin/results', { params }),
  deleteResult: (id, source) => api.delete(`/admin/results/${id}`, { params: { source } }),
  // Runtime metrics endpoints
  getSystemMetrics: () => api.get('/admin/runtime/system'),
  getProcessMetrics: () => api.get('/admin/runtime/process'),
  getApiMetrics: () => api.get('/admin/runtime/api'),
  getDatabaseMetrics: () => api.get('/admin/runtime/database'),
  getRuntimeSnapshot: () => api.get('/admin/runtime/snapshot'),
  resetRuntimeMetrics: () => api.post('/admin/runtime/reset'),
};
