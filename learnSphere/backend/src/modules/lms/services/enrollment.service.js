import Course from '../../../models/Course.js';
import User from '../../../models/User.js';

export const enrollmentService = {
  async enrollStudent(courseId, studentId) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    if (!course.isPublished) {
      throw new Error('This course is not available for enrollment');
    }

    const user = await User.findById(studentId);
    if (!user) {
      throw new Error('Student not found');
    }

    const existing = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (existing) {
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
      prerequisiteCompleted: false,
      prerequisiteScore: 0,
      knowledgeLevel: null,
      certificateEligible: false,
      status: 'in_progress',
    });
    await user.save();

    const enrollment = user.enrolledCourses[user.enrolledCourses.length - 1];
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
    return { course, enrollment };
  },
};
