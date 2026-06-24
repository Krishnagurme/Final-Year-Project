import Course from '../../../models/Course.js';
import User from '../../../models/User.js';

function toIdString(id) {
  return id?.toString?.() || String(id);
}

function includesLesson(list, lessonId) {
  return list.some(item => toIdString(item) === toIdString(lessonId));
}

export const progressService = {
  calculateProgress(completedCount, totalLessons) {
    if (!totalLessons || totalLessons === 0) return 0;
    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  },

  assertPrerequisiteGate(enrollment) {
    if (!enrollment?.prerequisiteCompleted) {
      throw new Error('Complete the prerequisite assessment before accessing course topics');
    }
  },

  async accessTopic(courseId, studentId, lessonId) {
    const user = await User.findById(studentId);
    if (!user) throw new Error('User not found');

    const enrolled = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!enrolled) throw new Error('Course enrollment not found');

    this.assertPrerequisiteGate(enrolled);

    if (!includesLesson(enrolled.openedLessons, lessonId)) {
      enrolled.openedLessons.push(lessonId);
      await user.save();
    }

    return { openedLessons: enrolled.openedLessons };
  },

  async completeTopic(courseId, studentId, lessonId) {
    const user = await User.findById(studentId);
    if (!user) throw new Error('User not found');

    const enrolled = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!enrolled) throw new Error('Course enrollment not found');

    this.assertPrerequisiteGate(enrolled);

    if (!includesLesson(enrolled.openedLessons, lessonId)) {
      throw new Error(
        'You must access/open the study materials for this topic before marking it as completed'
      );
    }

    if (!includesLesson(enrolled.completedLessons, lessonId)) {
      enrolled.completedLessons.push(lessonId);
    }

    const course = await Course.findById(courseId);
    const totalLessons = course?.lessons?.length || 0;
    const progress = this.calculateProgress(enrolled.completedLessons.length, totalLessons);
    enrolled.progress = progress;

    if (progress >= 100 && totalLessons > 0) {
      const wasCompleted = enrolled.status === 'completed';
      enrolled.status = 'completed';
      enrolled.progress = 100;
      enrolled.completedAt = enrolled.completedAt || new Date();
      enrolled.certificateEligible = true;

      if (!wasCompleted) {
        user.completedCoursesCount = (user.completedCoursesCount || 0) + 1;
        const lessonMinutes = course.duration
          ? course.duration / Math.max(totalLessons, 1)
          : 30;
        user.totalHoursLearned = (user.totalHoursLearned || 0) + lessonMinutes / 60;
      }
    }

    await user.save();

    return {
      progress: enrolled.progress,
      status: enrolled.status,
      certificateEligible: enrolled.certificateEligible,
      completedLessons: enrolled.completedLessons,
      completedAt: enrolled.completedAt,
    };
  },
};
