import express from 'express';
import { authenticate, isStudent, isAdmin } from '../middleware/auth.js';
import { analyticsService } from '../services/analytics.service.js';
import { relaxedRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * Get course completion analytics
 * GET /api/analytics/completion
 */
router.get('/completion', authenticate, isStudent, relaxedRateLimit, async (req, res) => {
  try {
    const analytics = await analyticsService.getCourseCompletionAnalytics(req.user.userId);
    res.json({
      message: 'Course completion analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Completion Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get skill progression analytics
 * GET /api/analytics/skills
 */
router.get('/skills', authenticate, isStudent, relaxedRateLimit, async (req, res) => {
  try {
    const analytics = await analyticsService.getSkillProgressionAnalytics(req.user.userId);
    res.json({
      message: 'Skill progression analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Skill Progression Error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get assessment history analytics
 * GET /api/analytics/assessments
 */
router.get('/assessments', authenticate, isStudent, relaxedRateLimit, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const analytics = await analyticsService.getAssessmentHistoryAnalytics(
      req.user.userId,
      parseInt(limit)
    );
    res.json({
      message: 'Assessment history analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Assessment History Error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get confidence score analytics
 * GET /api/analytics/confidence
 */
router.get('/confidence', authenticate, isStudent, relaxedRateLimit, async (req, res) => {
  try {
    const analytics = await analyticsService.getConfidenceScoreAnalytics(req.user.userId);
    res.json({
      message: 'Confidence score analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Confidence Score Error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get complete dashboard analytics
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', authenticate, isStudent, relaxedRateLimit, async (req, res) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics(req.user.userId);
    res.json({
      message: 'Dashboard analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get admin-level analytics
 * GET /api/analytics/admin
 */
router.get('/admin', authenticate, isAdmin, relaxedRateLimit, async (req, res) => {
  try {
    const analytics = await analyticsService.getAdminAnalytics();
    res.json({
      message: 'Admin analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
