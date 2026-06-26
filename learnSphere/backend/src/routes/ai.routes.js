import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiWorkspaceService, uploadMiddleware } from '../modules/ai/services/aiWorkspace.service.js';
import { initSse, sendSseEvent } from '../modules/ai/utils/sse.js';

const router = express.Router();

router.get('/overview', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  
  const overview = await aiWorkspaceService.getOverview();
  const [sessions, documents] = await Promise.all([
    aiWorkspaceService.listSessions(userId),
    aiWorkspaceService.listDocuments(userId),
  ]);

  res.json({
    data: {
      ...overview,
      stats: {
        sessions: sessions.length,
        documents: documents.length,
      },
    },
  });
});

router.get('/sessions', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  const sessions = await aiWorkspaceService.listSessions(userId);
  res.json({ data: sessions });
});

router.post('/sessions', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  const session = await aiWorkspaceService.createSession(userId, req.body);
  res.status(201).json({ data: session });
});

router.get('/sessions/:sessionId', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  const session = await aiWorkspaceService.getSession(userId, req.params.sessionId);
  res.json({ data: session });
});

router.get('/documents', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  const documents = await aiWorkspaceService.listDocuments(userId);
  res.json({ data: documents });
});

router.get('/assistant-summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const summary = await aiWorkspaceService.getAssistantSummary(userId);
    res.json({ data: summary });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to generate assistant summary' });
  }
});

router.post(
  '/documents/upload',
  authenticate,
  uploadMiddleware.single('file'),
  async (req, res) => {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const document = await aiWorkspaceService.uploadDocument(userId, req.file);
    res.status(201).json({ data: document });
  }
);

router.post('/sessions/:sessionId/messages/stream', authenticate, async (req, res) => {
  const userId = req.user.id || req.user.userId || req.user._id;
  if (!userId) {
    return res.status(400).json({ message: 'User ID not found in token' });
  }
  
  const { message, documentIds = [] } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  initSse(res);
  sendSseEvent(res, 'ready', { sessionId: req.params.sessionId });

  try {
    const result = await aiWorkspaceService.streamMessage({
      userId: userId,
      sessionId: req.params.sessionId,
      message: message.trim(),
      documentIds,
      onToken: token => sendSseEvent(res, 'token', { token }),
    });

    sendSseEvent(res, 'complete', {
      session: result.session,
      assistantMessage: result.assistantMessage,
      citations: result.citations,
      memoryItems: result.memoryItems.map(item => ({
        id: item._id,
        kind: item.kind,
        content: item.content,
      })),
      retrievedChunks: result.retrievedChunks,
    });
    res.end();
  } catch (error) {
    sendSseEvent(res, 'error', { message: error.message || 'AI streaming failed' });
    res.end();
  }
});

router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const result = await aiWorkspaceService.deleteSession(userId, req.params.sessionId);
    res.json({ data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/documents/:documentId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    const result = await aiWorkspaceService.deleteDocument(userId, req.params.documentId);
    res.json({ data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
