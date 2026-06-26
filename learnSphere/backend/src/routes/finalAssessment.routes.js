import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { finalAssessmentService } from '../services/finalAssessment.service.js';

const router = express.Router();

// Generate final assessment
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in token' });
    }

    const assessment = await finalAssessmentService.generateFinalAssessment(
      courseId,
      userId
    );

    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit final assessment
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { courseId, answers } = req.body;
    
    if (!courseId || !answers) {
      return res.status(400).json({ success: false, message: 'Course ID and answers are required' });
    }

    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in token' });
    }

    const result = await finalAssessmentService.submitFinalAssessment(
      userId,
      courseId,
      answers
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check eligibility for final assessment
router.get('/eligibility/:courseId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in token' });
    }

    const eligibility = await finalAssessmentService.checkEligibility(
      userId,
      req.params.courseId
    );

    res.json({ success: true, data: eligibility });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
