import TopicQuiz from '../models/TopicQuiz.js';
import Course from '../models/Course.js';
import { xpService } from './xp.service.js';
import { aiService } from './ai.service.js';

export const topicQuizService = {
  // Generate topic quiz questions (5-10 questions per topic)
  async generateTopicQuiz(courseId, topicId, topicName) {
    console.log('Generating topic quiz for:', { courseId, topicId, topicName });

    // Check if quiz already exists
    const existingQuiz = await TopicQuiz.findOne({ courseId, topicId });
    if (existingQuiz) {
      console.log('Existing quiz found, returning it');
      return existingQuiz;
    }

    console.log('Generating new quiz for topic:', topicName);

    // Generate questions using AI or fallback
    const numberOfQuestions = Math.floor(Math.random() * 6) + 5; // 5-10 questions
    
    try {
      const aiResult = await aiService.generateDynamicTest(
        topicName,
        numberOfQuestions,
        { weakTopics: [topicName] }
      );

      const questions = aiResult.questions.map((q, idx) => ({
        id: String(idx + 1),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
      }));

      const quiz = await TopicQuiz.create({
        courseId,
        topicId,
        topicName,
        questions,
        passingScore: 60,
        timeLimit: 10,
        isPublished: true,
      });

      return quiz;
    } catch (error) {
      console.error('Error generating topic quiz:', error);
      throw new Error('Failed to generate topic quiz');
    }
  },

  // Submit topic quiz answers
  async submitTopicQuiz(studentId, courseId, topicId, topicName, answers) {
    const quiz = await TopicQuiz.findOne({ courseId, topicId, isPublished: true });
    if (!quiz) {
      throw new Error('Topic quiz not found');
    }

    // Calculate score
    let correctCount = 0;
    const answersWithMetadata = answers.map((answer, index) => {
      const question = quiz.questions[index];
      // Handle both string answers and object answers with studentAnswer property
      const studentAnswer = typeof answer === 'object' ? answer.studentAnswer : answer;
      const isCorrect = studentAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.id,
        question: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        topic: topicName,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Update quiz statistics
    quiz.attempts += 1;
    quiz.averageScore = Math.round(
      ((quiz.averageScore * (quiz.attempts - 1)) + score) / quiz.attempts
    );
    await quiz.save();

    // Award XP
    let xpEarned = 0;
    if (passed) {
      xpEarned += xpService.XP_REWARDS.PASS_TOPIC_QUIZ;
      if (score >= 90) {
        xpEarned += xpService.XP_REWARDS.QUIZ_BONUS_90_PLUS;
      }
    }

    const xpResult = await xpService.addXP(studentId, xpEarned, 'topic_quiz');

    // Update topic progress
    await xpService.updateTopicProgress(
      studentId,
      courseId,
      topicId,
      topicName,
      score,
      passed
    );

    // Update learning streak
    await xpService.updateLearningStreak(studentId);

    // Get AI feedback
    let aiFeedback = null;
    try {
      aiFeedback = await aiService.evaluatePrerequisites(
        answersWithMetadata,
        topicName,
        'INTERMEDIATE'
      );
    } catch (error) {
      console.error('Error getting AI feedback:', error);
    }

    // Check for topic master achievement
    if (score >= 90) {
      await xpService.unlockAchievement(studentId, 'TOPIC_MASTER');
    }

    return {
      score,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      xpEarned,
      xpResult,
      aiFeedback,
      answersWithMetadata,
    };
  },

  // Get topic quiz by course and topic
  async getTopicQuiz(courseId, topicId) {
    const quiz = await TopicQuiz.findOne({ courseId, topicId, isPublished: true });
    if (!quiz) {
      throw new Error('Topic quiz not found');
    }
    return quiz;
  },

  // Get all topic quizzes for a course
  async getCourseTopicQuizzes(courseId) {
    const quizzes = await TopicQuiz.find({ courseId, isPublished: true });
    return quizzes;
  },

  // Delete topic quiz
  async deleteTopicQuiz(courseId, topicId) {
    const quiz = await TopicQuiz.findOneAndDelete({ courseId, topicId });
    if (!quiz) {
      throw new Error('Topic quiz not found');
    }
    return quiz;
  },
};
