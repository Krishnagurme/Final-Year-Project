import express from 'express';
import { authenticate, isStudent } from '../middleware/auth.js';
import {
  getServiceStatus,
  getRuntimeTopology,
  getChatSessions,
  getSolveSessions,
  testLLMConnection,
  buildErrorResponse,
} from '../services/deeptutor.service.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const response = await getServiceStatus();
    res.json(response.data);
  } catch (error) {
    const err = buildErrorResponse(error);
    res.status(err.status).json({ message: err.message, details: err.data });
  }
});

router.get('/topology', async (req, res) => {
  try {
    const response = await getRuntimeTopology();
    res.json(response.data);
  } catch (error) {
    const err = buildErrorResponse(error);
    res.status(err.status).json({ message: err.message, details: err.data });
  }
});

router.get('/sessions/chat', authenticate, isStudent, async (req, res) => {
  try {
    const response = await getChatSessions(req.query.limit || 20);
    res.json(response.data);
  } catch (error) {
    const err = buildErrorResponse(error);
    res.status(err.status).json({ message: err.message, details: err.data });
  }
});

router.get('/sessions/solve', authenticate, isStudent, async (req, res) => {
  try {
    const response = await getSolveSessions(req.query.limit || 20);
    res.json(response.data);
  } catch (error) {
    const err = buildErrorResponse(error);
    res.status(err.status).json({ message: err.message, details: err.data });
  }
});

router.post('/test-llm', authenticate, isStudent, async (req, res) => {
  try {
    const response = await testLLMConnection();
    res.json(response.data);
  } catch (error) {
    const err = buildErrorResponse(error);
    res.status(err.status).json({ message: err.message, details: err.data });
  }
});

export default router;
