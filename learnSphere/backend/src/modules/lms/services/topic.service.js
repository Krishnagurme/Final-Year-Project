import Course from '../../../models/Course.js';
import Lesson from '../../../models/Lesson.js';
import User from '../../../models/User.js';

async function assertCourseAccess(courseId, userId, role) {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  if (role === 'ADMIN') return course;
  if (role === 'INSTRUCTOR' && course.instructor.toString() === userId) return course;
  throw new Error('You do not have permission to manage this course');
}

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const topicService = {
  async listByCourse(courseId) {
    return Lesson.find({ courseId }).sort({ order: 1 });
  },

async createTopic(courseId, topicData, userId, role) {
    const course = await assertCourseAccess(courseId, userId, role);

    const order =
      topicData.order ??
      (await Lesson.countDocuments({ courseId })) + 1;

    const lesson = new Lesson({
      title: topicData.title,
      description: topicData.description || '',
      courseId,
      order,
      notes: topicData.notes || topicData.content || '',
      notesFileUrl: topicData.notesFileUrl || '',
      content: topicData.content || topicData.notes || 'Topic content',
      studyMaterial: topicData.studyMaterial || '',
      studyMaterialFileUrl: topicData.studyMaterialFileUrl || '',
      contentType: topicData.contentType || 'TEXT',
      videoUrl: topicData.videoUrl,
      pdfUrl: topicData.pdfUrl,
      duration: topicData.duration || 30,
      resources: topicData.resources || [],
      isPublished: topicData.isPublished !== false,
    });

    // Generate PDF for notes
    if (lesson.notes) {
      const pdfPath = path.join(__dirname, `../../../../public/pdfs/${lesson._id}.pdf`);
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfPath));
      doc.text(lesson.notes);
      doc.end();
      lesson.pdfUrl = `/pdfs/${lesson._id}.pdf`;
    }

    await lesson.save();
    course.lessons.push(lesson._id);
    course.duration = (course.duration || 0) + (lesson.duration || 0);
    await course.save();

    return lesson;
  },

async updateTopic(courseId, topicId, updateData, userId, role) {
    await assertCourseAccess(courseId, userId, role);

    const lesson = await Lesson.findOne({ _id: topicId, courseId });
    if (!lesson) {
      throw new Error('Topic not found');
    }

    const allowed = [
      'title', 'description', 'order', 'notes', 'content', 'studyMaterial',
      'contentType', 'videoUrl', 'pdfUrl', 'duration', 'resources', 'isPublished',
      'notesFileUrl', 'studyMaterialFileUrl',
    ];
    allowed.forEach(field => {
      if (updateData[field] !== undefined) {
        lesson[field] = updateData[field];
      }
    });

    // Regenerate PDF if notes are updated
    if (updateData.notes) {
      const pdfPath = path.join(__dirname, `../../../../public/pdfs/${lesson._id}.pdf`);
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfPath));
      doc.text(updateData.notes);
      doc.end();
      lesson.pdfUrl = `/pdfs/${lesson._id}.pdf`;
    }

    await lesson.save();
    return lesson;
  },

  async deleteTopic(courseId, topicId, userId, role) {
    const course = await assertCourseAccess(courseId, userId, role);

    const lesson = await Lesson.findOneAndDelete({ _id: topicId, courseId });
    if (!lesson) {
      throw new Error('Topic not found');
    }

    course.lessons = course.lessons.filter(id => id.toString() !== topicId);
    await course.save();

    await User.updateMany(
      { 'enrolledCourses.courseId': courseId },
      {
        $pull: {
          'enrolledCourses.$[].completedLessons': topicId,
          'enrolledCourses.$[].openedLessons': topicId,
        },
      }
    );

    return { deleted: true };
  },

  async getTopic(courseId, topicId) {
    const lesson = await Lesson.findOne({ _id: topicId, courseId });
    if (!lesson) {
      throw new Error('Topic not found');
    }
    return lesson;
  },
};
