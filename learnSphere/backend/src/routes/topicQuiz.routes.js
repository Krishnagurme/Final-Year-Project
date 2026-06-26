import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { topicQuizService } from '../services/topicQuiz.service.js';

const router = express.Router();

// Generate topic quiz
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { courseId, topicId, topicName } = req.body;
    
    if (!courseId || !topicId || !topicName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Generating topic quiz:', { courseId, topicId, topicName });

    const quiz = await topicQuizService.generateTopicQuiz(courseId, topicId, topicName);
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Topic quiz generation error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// Get topic quiz
router.get('/:courseId/:topicId', authenticate, async (req, res) => {
  try {
    const quiz = await topicQuizService.getTopicQuiz(req.params.courseId, req.params.topicId);
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// Submit topic quiz
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { courseId, topicId, topicName, answers } = req.body;
    
    if (!courseId || !topicId || !topicName || !answers) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Submitting quiz:', { courseId, topicId, topicName, answers });
    console.log('req.user:', req.user);
    console.log('User ID from token:', req.user.id || req.user.userId || req.user._id);

    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found in token' });
    }

    const result = await topicQuizService.submitTopicQuiz(
      userId,
      courseId,
      topicId,
      topicName,
      answers
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// Get all topic quizzes for a course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const quizzes = await topicQuizService.getCourseTopicQuizzes(req.params.courseId);
    res.json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete topic quiz (admin only)
router.delete('/:courseId/:topicId', authenticate, async (req, res) => {
  try {
    // Add admin check here
    const quiz = await topicQuizService.deleteTopicQuiz(req.params.courseId, req.params.topicId);
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
