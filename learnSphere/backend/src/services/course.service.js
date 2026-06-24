import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

export const courseService = {
  async createCourse(courseData, instructorId) {
    const course = new Course({
      ...courseData,
      instructor: instructorId,
      isPublished: courseData.isPublished !== false,
    });
    await course.save();
    return course;
  },

  async getCourseById(courseId) {
    return await Course.findById(courseId)
      .populate('instructor', 'firstName lastName profileImage')
      .populate('lessons');
  },

  async getAllCourses(filters = {}) {
    const query = { isPublished: true };
    if (filters.level) query.level = filters.level;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await Course.find(query)
      .populate('instructor', 'firstName lastName profileImage')
      .limit(filters.limit || 10)
      .skip(filters.skip || 0);
  },

  async enrollStudent(courseId, studentId) {
    const course = await Course.findById(courseId);
    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      course.totalEnrollments += 1;
      await course.save();
    }

    const user = await User.findById(studentId);
    if (!user.enrolledCourses.find(e => e.courseId.toString() === courseId)) {
      user.enrolledCourses.push({
        courseId,
        enrolledAt: new Date(),
      });
      await user.save();
    }

    return course;
  },

  async getStudentEnrollments(studentId) {
    const user = await User.findById(studentId)
      .populate('enrolledCourses.courseId', 'title category level thumbnail shortDescription');
    if (!user) return [];
    return user.enrolledCourses.map(e => ({
      courseId: e.courseId?._id || e.courseId,
      title: e.courseId?.title,
      category: e.courseId?.category,
      level: e.courseId?.level,
      progress: e.progress || 0,
      status: e.status,
      prerequisiteCompleted: e.prerequisiteCompleted,
      certificateEligible: e.certificateEligible,
      enrolledAt: e.enrolledAt,
    }));
  },

  async getInstructorCourses(instructorId) {
    return await Course.find({ instructor: instructorId }).populate('lessons');
  },

  async updateCourse(courseId, updateData, userId, role) {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');
    if (role === 'INSTRUCTOR' && course.instructor.toString() !== userId) {
      throw new Error('You do not have permission to update this course');
    }
    Object.assign(course, updateData);
    await course.save();
    return course;
  },

  async deleteCourse(courseId) {
    const course = await Course.findByIdAndDelete(courseId);
    if (course) {
      await Lesson.deleteMany({ courseId });
    }
    return course;
  },
};
