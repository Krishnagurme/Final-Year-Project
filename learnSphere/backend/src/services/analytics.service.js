/**
 * Analytics Service
 * Tracks and analyzes: course completion, skill progression, assessment history, confidence scores
 */

import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

export const analyticsService = {
  /**
   * Calculate course completion rate for a user
   * Returns: completion percentage and details
   */
  async getCourseCompletionAnalytics(userId) {
    try {
      const user = await User.findById(userId).populate('enrolledCourses.courseId');

      if (!user || !user.enrolledCourses) {
        return {
          totalEnrolled: 0,
          completed: 0,
          inProgress: 0,
          completionRate: 0,
          courses: [],
        };
      }

      const courseDetails = user.enrolledCourses.map(enrollment => ({
        courseId: enrollment.courseId._id,
        title: enrollment.courseId.title,
        progress: enrollment.progress || 0,
        status: enrollment.status || 'Not Started',
        enrolledDate: enrollment.enrolledDate,
        completedDate: enrollment.completedDate,
      }));

      const completed = courseDetails.filter(c => c.status === 'Completed').length;
      const inProgress = courseDetails.filter(c => c.status === 'In Progress').length;
      const total = courseDetails.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        totalEnrolled: total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
        completionRate,
        courses: courseDetails,
      };
    } catch (error) {
      throw new Error(`Failed to get course completion analytics: ${error.message}`);
    }
  },

  /**
   * Get skill progression over time
   * Shows how user's skill levels have improved across subjects
   */
  async getSkillProgressionAnalytics(userId) {
    try {
      const assessments = await Assessment.find({ studentId: userId })
        .select('subject skillLevel score confidenceScore createdAt')
        .sort({ createdAt: 1 });

      if (!assessments.length) {
        return {
          totalAssessments: 0,
          skillsProgression: [],
          currentSkillLevel: 'Not Assessed',
          highestScore: 0,
          averageScore: 0,
        };
      }

      // Group by subject
      const skillsBySubject = {};
      assessments.forEach(assessment => {
        if (!skillsBySubject[assessment.subject]) {
          skillsBySubject[assessment.subject] = [];
        }
        skillsBySubject[assessment.subject].push({
          skillLevel: assessment.skillLevel,
          score: assessment.score,
          confidenceScore: assessment.confidenceScore,
          date: assessment.createdAt,
        });
      });

      // Calculate progression
      const skillProgression = Object.entries(skillsBySubject).map(([subject, scores]) => ({
        subject,
        attempts: scores.length,
        firstScore: scores[0].score,
        lastScore: scores[scores.length - 1].score,
        improvement: scores[scores.length - 1].score - scores[0].score,
        averageScore: Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length),
        highestScore: Math.max(...scores.map(s => s.score)),
        lowestScore: Math.min(...scores.map(s => s.score)),
        progression: scores,
      }));

      const allScores = assessments.map(a => a.score);
      const highestScore = Math.max(...allScores);
      const averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

      return {
        totalAssessments: assessments.length,
        skillsProgression: skillProgression,
        currentSkillLevel: assessments[assessments.length - 1].skillLevel,
        highestScore,
        averageScore,
      };
    } catch (error) {
      throw new Error(`Failed to get skill progression analytics: ${error.message}`);
    }
  },

  /**
   * Get assessment score history
   * Shows all assessment attempts with scores, dates, and trends
   */
  async getAssessmentHistoryAnalytics(userId, limit = 50) {
    try {
      const assessments = await Assessment.find({ studentId: userId })
        .select('subject score skillLevel confidenceScore createdAt')
        .sort({ createdAt: -1 })
        .limit(limit);

      if (!assessments.length) {
        return {
          totalAssessments: 0,
          history: [],
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          trend: 'No Data',
        };
      }

      const history = assessments.map(assessment => ({
        subject: assessment.subject,
        score: assessment.score,
        skillLevel: assessment.skillLevel,
        confidenceScore: assessment.confidenceScore,
        date: assessment.createdAt,
        dateFormatted: assessment.createdAt.toLocaleDateString(),
      }));

      // Calculate statistics
      const scores = assessments.map(a => a.score);
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const bestScore = Math.max(...scores);
      const worstScore = Math.min(...scores);

      // Determine trend (last 5 vs previous 5)
      let trend = 'Stable';
      if (assessments.length >= 5) {
        const recent = assessments.slice(0, 5).map(a => a.score);
        const previous = assessments.slice(5, 10).map(a => a.score);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

        if (recentAvg > previousAvg + 5) trend = 'Improving';
        else if (recentAvg < previousAvg - 5) trend = 'Declining';
      }

      return {
        totalAssessments: assessments.length,
        history,
        averageScore,
        bestScore,
        worstScore,
        trend,
      };
    } catch (error) {
      throw new Error(`Failed to get assessment history: ${error.message}`);
    }
  },

  /**
   * Get AI confidence score analytics
   * Shows distribution and trends of confidence scores across assessments
   */
  async getConfidenceScoreAnalytics(userId) {
    try {
      const assessments = await Assessment.find({ studentId: userId }).select(
        'subject confidenceScore score skillLevel createdAt'
      );

      if (!assessments.length) {
        return {
          averageConfidence: 0,
          highestConfidence: 0,
          lowestConfidence: 0,
          distribution: { high: 0, medium: 0, low: 0 },
          bySubject: {},
          recommendations: [],
        };
      }

      const scores = assessments.map(a => a.confidenceScore);
      const averageConfidence = parseFloat(
        (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)
      );
      const highestConfidence = parseFloat(Math.max(...scores).toFixed(3));
      const lowestConfidence = parseFloat(Math.min(...scores).toFixed(3));

      // Distribution analysis
      const distribution = {
        high: assessments.filter(a => a.confidenceScore >= 0.8).length,
        medium: assessments.filter(a => a.confidenceScore >= 0.5 && a.confidenceScore < 0.8).length,
        low: assessments.filter(a => a.confidenceScore < 0.5).length,
      };

      // By subject analysis
      const bySubject = {};
      assessments.forEach(assessment => {
        if (!bySubject[assessment.subject]) {
          bySubject[assessment.subject] = {
            assessments: [],
            averageConfidence: 0,
          };
        }
        bySubject[assessment.subject].assessments.push({
          score: assessment.score,
          confidence: assessment.confidenceScore,
          skillLevel: assessment.skillLevel,
          date: assessment.createdAt,
        });
      });

      // Calculate averages by subject
      Object.keys(bySubject).forEach(subject => {
        const scores = bySubject[subject].assessments.map(a => a.confidence);
        bySubject[subject].averageConfidence = parseFloat(
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)
        );
        bySubject[subject].assessmentCount = scores.length;
      });

      // Recommendations based on confidence
      const recommendations = [];
      if (averageConfidence < 0.5) {
        recommendations.push('Consider reviewing fundamentals - your confidence scores are low');
      }
      if (distribution.low > Math.ceil(assessments.length / 3)) {
        recommendations.push('Practice more on weak topics to build confidence');
      }
      if (averageConfidence > 0.85) {
        recommendations.push('Excellent confidence! Consider moving to advanced topics');
      }

      return {
        averageConfidence,
        highestConfidence,
        lowestConfidence,
        distribution,
        bySubject,
        recommendations,
        totalAssessments: assessments.length,
      };
    } catch (error) {
      throw new Error(`Failed to get confidence score analytics: ${error.message}`);
    }
  },

  /**
   * Get comprehensive dashboard analytics
   * Combines all analytics for dashboard display
   */
  async getDashboardAnalytics(userId) {
    try {
      const [courseCompletion, skillProgression, assessmentHistory, confidenceScores] =
        await Promise.all([
          this.getCourseCompletionAnalytics(userId),
          this.getSkillProgressionAnalytics(userId),
          this.getAssessmentHistoryAnalytics(userId, 10),
          this.getConfidenceScoreAnalytics(userId),
        ]);

      return {
        user: await User.findById(userId).select('name email skillLevel'),
        courseCompletion,
        skillProgression,
        assessmentHistory,
        confidenceScores,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate dashboard analytics: ${error.message}`);
    }
  },

  /**
   * Get admin-level analytics
   * Statistics across all users, courses, assessments
   */
  async getAdminAnalytics() {
    try {
      const totalUsers = await User.countDocuments();
      const totalCourses = await Course.countDocuments();
      const totalAssessments = await Assessment.countDocuments();

      const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

      const assessmentsByLevel = await Assessment.aggregate([
        { $group: { _id: '$skillLevel', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      ]);

      const assessmentsBySubject = await Assessment.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      ]);

      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      return {
        totalUsers,
        activeUsers,
        totalCourses,
        totalAssessments,
        usersByRole,
        assessmentsByLevel,
        assessmentsBySubject,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate admin analytics: ${error.message}`);
    }
  },
};

export default analyticsService;
