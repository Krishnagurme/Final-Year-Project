import Course from '../models/Course.js';
import User from '../models/User.js';
import { xpService } from './xp.service.js';
import { aiService } from './ai.service.js';

export const finalAssessmentService = {
  // Generate final assessment for a course
  async generateFinalAssessment(courseId, studentId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const user = await User.findById(studentId);
    if (!user) {
      throw new Error('User not found');
    }

    const enrolled = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!enrolled) {
      throw new Error('You must enroll in this course first');
    }

    // Check if prerequisites are completed
    if (!enrolled.prerequisiteCompleted) {
      throw new Error('You must complete the prerequisite test first');
    }

    // Check if enough topics are completed (at least 80%)
    const topicProgress = user.topicProgress.filter(
      tp => tp.courseId.toString() === courseId && tp.completed
    );
    const totalTopics = course.lessons?.length || 10;
    const completionRate = topicProgress.length / totalTopics;

    if (completionRate < 0.8) {
      throw new Error('You must complete at least 80% of the course topics before taking the final assessment');
    }

    // Generate 20-30 questions for final assessment
    const numberOfQuestions = Math.floor(Math.random() * 11) + 20; // 20-30 questions

    try {
      // No weak topics for final assessment - comprehensive test
      const aiResult = await aiService.generateDynamicTest(
        course.title,
        numberOfQuestions,
        { weakTopics: [] }
      );

      return {
        success: true,
        questions: aiResult.questions,
        estimatedCompletionTime: aiResult.estimatedCompletionTime,
        subject: course.title,
        courseId,
        passingScore: 70, // 70% to pass final assessment
      };
    } catch (error) {
      console.error('Error generating final assessment:', error);
      throw new Error('Failed to generate final assessment');
    }
  },

  // Submit final assessment
  async submitFinalAssessment(studentId, courseId, answers) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const user = await User.findById(studentId);
    if (!user) {
      throw new Error('User not found');
    }

    const enrolled = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!enrolled) {
      throw new Error('You must enroll in this course first');
    }

    // Calculate score
    let correctCount = 0;
    const answersWithMetadata = answers.map((answer, index) => {
      const question = answers[index];
      const isCorrect = answer.studentAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.questionId,
        question: question.question,
        studentAnswer: answer.studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        topic: question.topic,
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= 70;

    // Get AI feedback
    let aiFeedback = null;
    try {
      aiFeedback = await aiService.evaluatePrerequisites(
        answersWithMetadata,
        course.title,
        'ADVANCED'
      );
    } catch (error) {
      console.error('Error getting AI feedback:', error);
    }

    // Award XP for final assessment
    let xpEarned = 0;
    if (passed) {
      xpEarned += xpService.XP_REWARDS.PASS_FINAL_ASSESSMENT;
      xpEarned += xpService.XP_REWARDS.COMPLETE_COURSE;
    }

    const xpResult = await xpService.addXP(studentId, xpEarned, 'final_assessment');

    // Update enrollment status
    if (passed) {
      enrolled.status = 'completed';
      enrolled.completedAt = new Date();
      enrolled.certificateEligible = true;
      
      // Generate certificate
      const certificate = await this.generateCertificate(studentId, courseId, score);
      enrolled.certificateObtained = true;
      enrolled.certificateIssuedAt = new Date();
      
      // Unlock course complete achievement
      await xpService.unlockAchievement(studentId, 'COURSE_COMPLETE');
    }

    await user.save();

    return {
      score,
      passed,
      correctCount,
      totalQuestions: answers.length,
      xpEarned,
      xpResult,
      aiFeedback,
      answersWithMetadata,
      certificate: passed ? enrolled.certificateObtained : null,
    };
  },

  // Generate certificate
  async generateCertificate(studentId, courseId, score) {
    const course = await Course.findById(courseId);
    const user = await User.findById(studentId);
    
    if (!course || !user) {
      throw new Error('Course or user not found');
    }

    const certificate = {
      studentId,
      courseId,
      studentName: `${user.firstName} ${user.lastName}`,
      courseName: course.title,
      score,
      issueDate: new Date(),
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      verificationToken: Math.random().toString(36).substr(2, 20).toUpperCase(),
    };

    return certificate;
  },

  // Check eligibility for final assessment
  async checkEligibility(studentId, courseId) {
    const course = await Course.findById(courseId);
    const user = await User.findById(studentId);
    
    if (!course || !user) {
      throw new Error('Course or user not found');
    }

    const enrolled = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!enrolled) {
      return {
        eligible: false,
        reason: 'You must enroll in this course first',
      };
    }

    if (!enrolled.prerequisiteCompleted) {
      return {
        eligible: false,
        reason: 'You must complete the prerequisite test first',
      };
    }

    const topicProgress = user.topicProgress.filter(
      tp => tp.courseId.toString() === courseId && tp.completed
    );
    const totalTopics = course.lessons?.length || 10;
    const completionRate = topicProgress.length / totalTopics;

    if (completionRate < 0.8) {
      return {
        eligible: false,
        reason: `You must complete at least 80% of the course topics (${Math.round(completionRate * 100)}% completed)`,
        completionRate: Math.round(completionRate * 100),
      };
    }

    return {
      eligible: true,
      completionRate: Math.round(completionRate * 100),
      topicsCompleted: topicProgress.length,
      totalTopics,
    };
  },
};
