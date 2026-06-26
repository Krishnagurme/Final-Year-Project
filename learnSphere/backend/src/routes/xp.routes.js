import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { xpService } from '../services/xp.service.js';
import User from '../models/User.js';

const router = express.Router();

// Get user gamification stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in token' });
    }
    const stats = await xpService.getGamificationStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('XP stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add XP (for testing/admin use)
router.post('/add', authenticate, async (req, res) => {
  try {
    const { xpAmount, reason } = req.body;
    if (!xpAmount || xpAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid XP amount' });
    }

    const result = await xpService.addXP(req.user.id, xpAmount, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update learning streak (called on daily login/activity)
router.post('/streak', authenticate, async (req, res) => {
  try {
    const streak = await xpService.updateLearningStreak(req.user.id);
    res.json({ success: true, data: { streak } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update topic progress
router.post('/topic-progress', authenticate, async (req, res) => {
  try {
    const { courseId, topicId, topicName, quizScore, completed } = req.body;
    
    if (!courseId || !topicId || !topicName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const progress = await xpService.updateTopicProgress(
      req.user.id,
      courseId,
      topicId,
      topicName,
      quizScore || 0,
      completed || false
    );

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get topic progress for a course
router.get('/topic-progress/:courseId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const courseProgress = user.topicProgress.filter(
      tp => tp.courseId.toString() === req.params.courseId
    );

    res.json({ success: true, data: courseProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get achievements
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user.achievements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Leaderboard (top users by XP)
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topUsers = await User.find({ role: 'STUDENT' })
      .select('firstName lastName xp level skillLevel profileImage')
      .sort({ xp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
