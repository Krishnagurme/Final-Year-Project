import Course from '../../../models/Course.js';
import User from '../../../models/User.js';
import PrerequisiteAttempt from '../../../models/PrerequisiteAttempt.js';
import { scorePrerequisiteAnswers } from '../constants/prerequisiteQuestions.js';
import { xpService } from '../../../services/xp.service.js';

export const enrollmentService = {
  async enrollStudent(courseId, studentId, answers = null) {
    console.log(`Enrollment attempt - CourseID: ${courseId}, StudentID: ${studentId}`);
    const course = await Course.findById(courseId);
    if (!course) {
      console.log(`Course not found: ${courseId}`);
      throw new Error('Course not found');
    }
    if (!course.isPublished) {
      console.log(`Course not published: ${courseId}`);
      throw new Error('This course is not available for enrollment');
    }

    const user = await User.findById(studentId);
    if (!user) {
      console.log(`Student not found: ${studentId}`);
      throw new Error('Student not found');
    }

    let existing = user.enrolledCourses.find(e => e.courseId.toString() === courseId);

    // If answers are provided, process them (whether new enrollment or updating an existing one)
    let prerequisiteCompleted = existing?.prerequisiteCompleted || false;
    let prerequisiteScore = existing?.prerequisiteScore || 0;
    let knowledgeLevel = existing?.knowledgeLevel || null;
    let newlyCompleted = false;

    if (answers && Array.isArray(answers) && !existing?.prerequisiteCompleted) {
      const result = scorePrerequisiteAnswers(course.title, answers);
      prerequisiteScore = result.score;
      knowledgeLevel = result.knowledgeLevel;
      prerequisiteCompleted = true;
      newlyCompleted = true;

      // Award XP
      const xpReward = Math.round(prerequisiteScore / 2);
      await xpService.addXP(studentId, xpReward, 'prerequisite_test');
      await xpService.updateLearningStreak(studentId);
      await xpService.unlockAchievement(studentId, 'FIRST_QUIZ');

      await PrerequisiteAttempt.create({
        studentId,
        courseId,
        answers,
        score: result.score,
        knowledgeLevel: result.knowledgeLevel,
        totalQuestions: result.totalQuestions,
        correctCount: result.correctCount,
      });
    }

    if (existing) {
      console.log(`Already enrolled in course: ${courseId}`);
      // If they just completed the prerequisite, update the existing enrollment
      if (newlyCompleted) {
        existing.prerequisiteCompleted = true;
        existing.prerequisiteScore = prerequisiteScore;
        existing.knowledgeLevel = knowledgeLevel;
        await user.save();
      }
      return { course, enrollment: existing, alreadyEnrolled: true };
    }

    if (!course.students.some(s => s.toString() === studentId)) {
      course.students.push(studentId);
      course.totalEnrollments += 1;
      await course.save();
    }

    user.enrolledCourses.push({
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      prerequisiteCompleted,
      prerequisiteScore,
      knowledgeLevel,
      certificateEligible: false,
      status: 'in_progress',
    });
    await user.save();

    const enrollment = user.enrolledCourses[user.enrolledCourses.length - 1];
    console.log(`Enrollment successful for course: ${courseId}`);
    return { course, enrollment, alreadyEnrolled: false };
  },

  async getEnrollment(studentId, courseId) {
    const user = await User.findById(studentId);
    if (!user) return null;
    return user.enrolledCourses.find(e => e.courseId.toString() === courseId) || null;
  },

  async getCourseDetailForStudent(courseId, studentId) {
    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName profileImage')
      .populate('lessons');

    if (!course) {
      console.log(`Course not found for ID: ${courseId}`);
      throw new Error('Course not found');
    }

    const enrollment = await this.getEnrollment(studentId, courseId);
    
    // Filter lessons based on student's knowledge level
    let filteredLessons = course.lessons;
    if (enrollment && enrollment.knowledgeLevel) {
      const studentLevel = enrollment.knowledgeLevel;
      filteredLessons = course.lessons.filter(lesson => {
        // Show lessons at or below student's level
        const levelOrder = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3 };
        const lessonLevel = lesson.level || 'BEGINNER';
        return levelOrder[lessonLevel] <= levelOrder[studentLevel];
      });
    }
    
    return { course: { ...course.toObject(), lessons: filteredLessons }, enrollment };
  },
};
