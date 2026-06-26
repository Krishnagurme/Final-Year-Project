import express from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/update-assessment-progress', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, score, skillLevel, timeSpent, weakTopics, strengths } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's skill level if assessment shows improvement
    if (skillLevel && skillLevel !== user.skillLevel) {
      const skillLevels = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3 };
      if (skillLevels[skillLevel] > (skillLevels[user.skillLevel] || 0)) {
        user.skillLevel = skillLevel;
      }
    }

    // Add assessment to user's assessment history
    if (!user.assessmentHistory) {
      user.assessmentHistory = [];
    }
    
    const weakList = Array.isArray(weakTopics)
      ? weakTopics.map(t => String(t).trim()).filter(Boolean).slice(0, 20)
      : [];
    const strengthList = Array.isArray(strengths)
      ? strengths.map(t => String(t).trim()).filter(Boolean).slice(0, 20)
      : [];

    user.assessmentHistory.push({
      subject,
      score,
      skillLevel,
      weakTopics: weakList,
      strengths: strengthList,
      timeSpent: timeSpent || 15,
      completedAt: new Date(),
    });

    // Track time spent (minutes → fractional hours) for dashboard totals
    if (user.totalHoursLearned == null) {
      user.totalHoursLearned = 0;
    }
    user.totalHoursLearned += (Number(timeSpent) || 15) / 60;

    await user.save();

    res.json({
      message: 'Assessment progress updated successfully',
      data: {
        skillLevel: user.skillLevel,
        totalHoursLearned: user.totalHoursLearned,
        totalAssessments: user.assessmentHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    console.log('Fetching dashboard stats for user ID:', userId);
    
    const user = await User.findById(userId)
      .populate('enrolledCourses.courseId')
      .select('-password');
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.json({
        message: 'Dashboard statistics fetched successfully',
        data: {
          skillLevel: 'BEGINNER',
          totalCourses: 0,
          completedCourses: 0,
          completedAssessments: 0,
          hoursLearned: 0,
          averageCourseProgress: 0,
          averageAssessmentScore: 0,
          overallProgressPercent: 0,
          enrolledCourses: [],
          assessmentHistory: [],
        },
      });
    }

    console.log('User found:', user.email);
    console.log('Enrolled courses count:', (user.enrolledCourses || []).length);
    console.log('Enrolled courses:', JSON.stringify(user.enrolledCourses, null, 2));

    const enrolledCourses = user.enrolledCourses || [];
    const totalCourses = enrolledCourses.length;

    // If user has no enrolled courses, return empty stats with helpful message
    if (totalCourses === 0) {
      console.log('User has no enrolled courses, returning empty stats');
      return res.json({
        message: 'Dashboard statistics fetched successfully',
        data: {
          skillLevel: user.skillLevel || 'BEGINNER',
          totalCourses: 0,
          completedCourses: 0,
          completedAssessments: (user.assessmentHistory || []).length,
          hoursLearned: user.totalHoursLearned || 0,
          averageCourseProgress: 0,
          averageAssessmentScore: 0,
          overallProgressPercent: 0,
          enrolledCourses: [],
          assessmentHistory: (user.assessmentHistory || []).map(h => ({
            subject: h.subject,
            score: h.score,
            skillLevel: h.skillLevel,
            completedAt: h.completedAt,
            weakTopics: h.weakTopics || [],
          })),
        },
      });
    }

    const completedCourses = enrolledCourses.filter(course => {
      return course.status === 'completed' || (course.progress || 0) >= 100;
    }).length;

    const completedCoursesFromProfile = user.completedCoursesCount || completedCourses;

    const courseHours = enrolledCourses.reduce((total, course) => {
      const doc = course.courseId;
      if (!doc) return total;
      const durationMin = doc.duration || 0;
      const estHours = durationMin > 0 ? durationMin / 60 : 12;
      const progress = course.progress || 0;
      return total + estHours * (progress / 100);
    }, 0);

    const assessmentHours = user.totalHoursLearned || 0;
    const hoursLearned = Math.round((courseHours + assessmentHours) * 10) / 10;

    const history = user.assessmentHistory || [];
    const completedAssessments = history.length;

    const progressValues = enrolledCourses
      .filter(c => c.courseId)
      .map(c => c.progress || 0);
    const averageCourseProgress =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

    const assessmentScores = history
      .map(h => (typeof h.score === 'number' ? h.score : Number(h.score)))
      .filter(s => !Number.isNaN(s));
    const averageAssessmentScore =
      assessmentScores.length > 0
        ? Math.round(assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length)
        : 0;

    let overallProgressPercent = 0;
    if (progressValues.length > 0) {
      overallProgressPercent = averageCourseProgress;
    } else if (assessmentScores.length > 0) {
      overallProgressPercent = Math.round(
        assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length
      );
    }

    const skillLevel = user.skillLevel || 'BEGINNER';

    res.json({
      message: 'Dashboard statistics fetched successfully',
      data: {
        skillLevel,
        totalCourses,
        completedCourses: completedCoursesFromProfile,
        completedAssessments,
        hoursLearned,
        averageCourseProgress,
        averageAssessmentScore,
        overallProgressPercent,
        enrolledCourses: enrolledCourses.map(course => {
          const doc = course.courseId;
          const p = course.progress || 0;
          return {
            courseId: doc?._id,
            title: doc?.title || 'Course',
            shortDescription: doc?.shortDescription || '',
            description: doc?.description ? String(doc.description).slice(0, 280) : '',
            category: doc?.category || '',
            level: doc?.level || 'BEGINNER',
            durationMinutes: doc?.duration || 0,
            progress: p,
            prerequisiteCompleted: !!course.prerequisiteCompleted,
            prerequisiteScore: course.prerequisiteScore || 0,
            knowledgeLevel: course.knowledgeLevel || null,
            certificateEligible: !!course.certificateEligible,
            certificateObtained: !!course.certificateObtained,
            certificateIssuedAt: course.certificateIssuedAt || null,
            status: course.status || (p >= 100 ? 'completed' : 'in_progress'),
            completedAt: course.completedAt || null,
            enrolledAt: course.enrolledAt,
          };
        }),
        assessmentHistory: history.map(h => ({
          subject: h.subject,
          score: h.score,
          skillLevel: h.skillLevel,
          completedAt: h.completedAt,
          weakTopics: h.weakTopics || [],
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    res.json({
      message: 'Profile fetched successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'bio', 'profileImage'];
    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field]) updateData[field] = req.body[field];
    });

    const user = await authService.updateUserProfile(req.user.userId, updateData);
    res.json({
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses.courseId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
