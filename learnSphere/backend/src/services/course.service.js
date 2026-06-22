import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

export const courseService = {
  async createCourse(courseData, instructorId) {
    const course = new Course({
      ...courseData,
      instructor: instructorId,
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

  async getInstructorCourses(instructorId) {
    return await Course.find({ instructor: instructorId }).populate('lessons');
  },

  async updateCourse(courseId, updateData) {
    return await Course.findByIdAndUpdate(courseId, updateData, { new: true });
  },

  async deleteCourse(courseId) {
    return await Course.findByIdAndDelete(courseId);
  },
};
