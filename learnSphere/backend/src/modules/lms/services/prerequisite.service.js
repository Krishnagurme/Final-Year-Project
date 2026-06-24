import Course from '../../../models/Course.js';
import User from '../../../models/User.js';
import PrerequisiteAttempt from '../../../models/PrerequisiteAttempt.js';
import {
  getQuestionsForCourse,
  scorePrerequisiteAnswers,
  PREREQUISITE_QUESTION_COUNT,
} from '../constants/prerequisiteQuestions.js';

export const prerequisiteService = {
  async getQuestions(courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Use course title instead of category for more specific question matching
    const questions = getQuestionsForCourse(course.title).map((q, idx) => ({
      index: idx,
      question: q.q,
      options: q.options,
    }));

    return { questions, totalQuestions: PREREQUISITE_QUESTION_COUNT };
  },

  async submitAnswers(courseId, studentId, answers) {
    if (!answers || !Array.isArray(answers)) {
      throw new Error('Answers array is required');
    }

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

    const expectedCount = getQuestionsForCourse(course.title).length;
    if (answers.length < expectedCount) {
      throw new Error(`Please answer all ${expectedCount} questions`);
    }

    const { score, knowledgeLevel, totalQuestions, correctCount } = scorePrerequisiteAnswers(
      course.title,
      answers
    );

    enrolled.prerequisiteCompleted = true;
    enrolled.prerequisiteScore = score;
    enrolled.knowledgeLevel = knowledgeLevel;

    await PrerequisiteAttempt.create({
      studentId,
      courseId,
      answers,
      score,
      knowledgeLevel,
      totalQuestions,
      correctCount,
    });

    await user.save();

    return {
      score,
      knowledgeLevel,
      totalQuestions,
      correctCount,
      message: `Prerequisite assessment completed! Score: ${score}% (${knowledgeLevel})`,
    };
  },
};
