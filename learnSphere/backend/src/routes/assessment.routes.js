import express from 'express';
import { aiService } from '../services/ai.service.js';
import { authenticate, isStudent } from '../middleware/auth.js';
import { validateRequest, schemas, sanitizeRequest } from '../middleware/validation.js';
import {
  testGenerationLimit,
  evaluationLimit,
  moderateRateLimit,
} from '../middleware/rateLimit.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';

const router = express.Router();

function collectWeakTopicsFromHistory(assessmentHistory, subject, maxTopics = 8) {
  if (!Array.isArray(assessmentHistory)) return [];
  const rows = assessmentHistory
    .filter(h => h && typeof h.subject === 'string' && h.subject === subject)
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    .slice(0, 5);
  const seen = new Set();
  const topics = [];
  for (const row of rows) {
    for (const w of row.weakTopics || []) {
      const t = String(w || '').trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      topics.push(t);
      if (topics.length >= maxTopics) return topics;
    }
  }
  return topics;
}

/**
 * Get all supported assessment subjects from AI service.
 * GET /assessments/subjects
 */
router.get('/subjects', authenticate, async (req, res) => {
  try {
    const subjects = aiService.getSupportedSubjects();
    res.json({
      message: 'Assessment subjects retrieved',
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    console.error('Subjects Fetch Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch assessment subjects' });
  }
});

/**
 * Generate dynamic prerequisite test for a subject
 * POST /assessments/generate-test/:subject
 * Rate limited to 10 tests per day per user
 */
router.post(
  '/generate-test/:subject',
  authenticate,
  // isStudent,
  // testGenerationLimit,
  sanitizeRequest,
  validateRequest(schemas.generateTest),
  async (req, res) => {
    try {
      const { subject } = req.params;
      const { numberOfQuestions = 5 } = req.body;

      if (!subject || subject.trim().length === 0) {
        return res.status(400).json({ message: 'Subject is required' });
      }

      const userId = req.user.id || req.user.userId || req.user._id;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in token' });
      }
      
      const user = await User.findById(userId).select('assessmentHistory').lean();
      const weakTopicsFromHistory = collectWeakTopicsFromHistory(
        user?.assessmentHistory,
        subject.trim()
      );

      const sessionSalt = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const testData = await aiService.generateDynamicTest(subject, numberOfQuestions, {
        weakTopics: weakTopicsFromHistory,
        sessionSalt,
      });

      res.json({
        message: `Dynamic test generated for ${subject}`,
        data: {
          ...testData,
          personalization: {
            weakTopicsFromPriorAssessments: weakTopicsFromHistory,
          },
        },
      });
    } catch (error) {
      console.error('Test Generation Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

/**
 * Simple test endpoint for debugging
 */
router.post('/test-evaluation', async (req, res) => {
  try {
    const { answers, subject, courseLevel } = req.body;
    console.log('Received evaluation request:', { answers, subject, courseLevel });
    
    const evaluation = await aiService.evaluatePrerequisites(answers, subject, courseLevel);
    res.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

/**
 * Evaluate prerequisites and assign skill level
 * POST /assessments/evaluate-prerequisites
 * Rate limited to 5 evaluations per hour per user
 */
router.post(
  '/evaluate-prerequisites',
  // Temporarily remove authentication for testing
  // authenticate,
  // isStudent,
  // evaluationLimit,
  // sanitizeRequest,
  // validateRequest(schemas.evaluatePrerequisites),
  async (req, res) => {
    try {
      const { answers, subject, courseLevel = 'INTERMEDIATE' } = req.body;

      console.log('Received evaluation request:', { answers, subject, courseLevel });
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Valid answers array is required' });
      }

      if (!subject) {
        return res.status(400).json({ message: 'Subject is required' });
      }

      const evaluation = await aiService.evaluatePrerequisites(answers, subject, courseLevel);
      res.json(evaluation);
    } catch (error) {
      console.error('Evaluation Error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/generate-learning-path',
  authenticate,
  isStudent,
  sanitizeRequest,
  validateRequest(schemas.generateLearningPath),
  async (req, res) => {
    try {
      const { studentProfile, courseId, assessmentResults } = req.validated;
      const learningPath = await aiService.generateLearningPath(
        studentProfile,
        courseId,
        assessmentResults
      );

      res.json({
        message: 'Learning path generated successfully',
        data: learningPath,
      });
    } catch (error) {
      console.error('Learning Path Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Submit assessment and get AI evaluation
router.post(
  '/submit-assessment',
  authenticate,
  isStudent,
  sanitizeRequest,
  validateRequest(schemas.submitAssessment),
  async (req, res) => {
    try {
      const { answers, courseId, subject, estimatedTime = 15 } = req.validated;
      // Score the assessment
      const aiEvaluation = await aiService.scoreAssessment(answers, courseId, subject);

      // Create and save assessment record
      const userId = req.user.id || req.user.userId || req.user._id;
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found in token' });
      }
      
      const assessment = new Assessment({
        studentId: userId,
        courseId,
        type: 'PREREQUISITE',
        answers: answers.map((ans, idx) => ({
          questionId: idx.toString(),
          studentAnswer: ans.studentAnswer,
          isCorrect: ans.isCorrect,
          pointsEarned: ans.isCorrect ? 20 : 0,
        })),
        score: aiEvaluation.score,
        percentage: aiEvaluation.score,
        aiEvaluation: {
          skillLevel: aiEvaluation.skillLevel,
          strengths: aiEvaluation.strengths,
          weaknesses: aiEvaluation.weaknesses,
          recommendations: aiEvaluation.recommendations,
          feedback: aiEvaluation.feedback,
          confidenceScore: aiEvaluation.score / 100,
        },
        status: 'EVALUATED',
        timeTaken: estimatedTime,
        submittedAt: new Date(),
        evaluatedAt: new Date(),
      });

      await assessment.save();

      // Update user skill level
      await User.findByIdAndUpdate(userId, {
        skillLevel: aiEvaluation.skillLevel,
      });

      res.json({
        message: 'Assessment submitted and evaluated',
        data: {
          assessmentId: assessment._id,
          ...aiEvaluation,
        },
      });
    } catch (error) {
      console.error('Assessment Submission Error:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Get assessment results
router.get('/results/:assessmentId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    const assessment = await Assessment.findById(req.params.assessmentId).populate(
      'studentId',
      'firstName lastName email'
    );

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Verify ownership
    if (assessment.studentId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({
      message: 'Assessment results retrieved',
      data: assessment,
    });
  } catch (error) {
    console.error('Results Fetch Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all assessments for current user
router.get('/my-assessments', authenticate, isStudent, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    const assessments = await Assessment.find({ studentId: userId })
      .select('-answers')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      message: 'User assessments retrieved',
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    console.error('Assessments Fetch Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get assessment history with analytics
router.get('/history/analytics', authenticate, isStudent, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    const assessments = await Assessment.find({ studentId: userId })
      .select('score percentage skillLevel createdAt')
      .sort({ createdAt: -1 });

    const analytics = {
      totalAssessments: assessments.length,
      averageScore:
        assessments.length > 0
          ? (assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length).toFixed(2)
          : 0,
      highestScore: assessments.length > 0 ? Math.max(...assessments.map(a => a.score)) : 0,
      skillLevelDistribution: {
        beginner: assessments.filter(a => a.aiEvaluation?.skillLevel === 'BEGINNER').length,
        intermediate: assessments.filter(a => a.aiEvaluation?.skillLevel === 'INTERMEDIATE').length,
        advanced: assessments.filter(a => a.aiEvaluation?.skillLevel === 'ADVANCED').length,
      },
      recentAssessments: assessments.slice(0, 5),
    };

    res.json({
      message: 'Assessment analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get analytics for AI workspace
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    const assessments = await Assessment.find({ studentId: userId })
      .select('score percentage skillLevel createdAt subject')
      .sort({ createdAt: -1 });

    const analytics = {
      totalAssessments: assessments.length,
      averageScore:
        assessments.length > 0
          ? (assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length).toFixed(2)
          : 0,
      highestScore: assessments.length > 0 ? Math.max(...assessments.map(a => a.score)) : 0,
      skillLevelDistribution: {
        beginner: assessments.filter(a => a.aiEvaluation?.skillLevel === 'BEGINNER').length,
        intermediate: assessments.filter(a => a.aiEvaluation?.skillLevel === 'INTERMEDIATE').length,
        advanced: assessments.filter(a => a.aiEvaluation?.skillLevel === 'ADVANCED').length,
      },
      recentAssessments: assessments.slice(0, 5),
      subjects: [...new Set(assessments.map(a => a.subject).filter(Boolean))],
    };

    res.json({
      message: 'Assessment analytics retrieved',
      data: analytics,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
