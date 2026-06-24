import express from 'express';
import { courseService } from '../services/course.service.js';
import { enrollmentService } from '../modules/lms/services/enrollment.service.js';
import { prerequisiteService } from '../modules/lms/services/prerequisite.service.js';
import { progressService } from '../modules/lms/services/progress.service.js';
import { authenticate, isAdmin, isInstructorOrAdmin, isStudent } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Public Routes
router.get('/', async (req, res) => {
  try {
    const { level, category, search, limit, skip } = req.query;
    const courses = await courseService.getAllCourses({
      level,
      category,
      search,
      limit: parseInt(limit) || 10,
      skip: parseInt(skip) || 0,
    });
    res.json({
      message: 'Courses fetched successfully',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Must be registered before /:id to avoid route conflict
router.get('/instructor/my-courses', authenticate, isInstructorOrAdmin, async (req, res) => {
  try {
    const courses = await courseService.getInstructorCourses(req.user.userId);
    res.json({
      message: 'Instructor courses fetched',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/enrollments', authenticate, isStudent, async (req, res) => {
  try {
    const enrollments = await courseService.getStudentEnrollments(req.user.userId);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({
      message: 'Course fetched successfully',
      data: course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin / Instructor Routes
router.post(
  '/',
  authenticate,
  isInstructorOrAdmin,
  validateRequest(schemas.createCourse),
  async (req, res) => {
    try {
      const course = await courseService.createCourse(req.validated, req.user.userId);
      res.status(201).json({
        message: 'Course created successfully',
        data: course,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.put('/:id', authenticate, isInstructorOrAdmin, async (req, res) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    res.json({
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await courseService.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Student LMS Workflow Routes
router.post('/:id/enroll', authenticate, isStudent, async (req, res) => {
  try {
    const result = await enrollmentService.enrollStudent(req.params.id, req.user.userId);
    res.json({
      success: true,
      message: result.alreadyEnrolled ? 'Already enrolled in this course' : 'Enrolled successfully',
      data: {
        course: result.course,
        enrollment: result.enrollment,
        alreadyEnrolled: result.alreadyEnrolled,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id/prerequisite', authenticate, isStudent, async (req, res) => {
  try {
    const { questions, totalQuestions } = await prerequisiteService.getQuestions(req.params.id);
    res.json({ success: true, questions, totalQuestions });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ message: error.message });
  }
});

router.post('/:id/prerequisite/submit', authenticate, isStudent, async (req, res) => {
  try {
    const result = await prerequisiteService.submitAnswers(
      req.params.id,
      req.user.userId,
      req.body.answers
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/my/prerequisite-results', authenticate, isStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('enrolledCourses.courseId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const prerequisiteResults = user.enrolledCourses
      .filter(enrollment => enrollment.prerequisiteCompleted)
      .map(enrollment => ({
        courseId: enrollment.courseId._id,
        courseTitle: enrollment.courseId.title,
        score: enrollment.prerequisiteScore,
        knowledgeLevel: enrollment.knowledgeLevel,
        completedAt: enrollment.enrolledAt,
      }));

    res.json({ success: true, data: prerequisiteResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/detail', authenticate, isStudent, async (req, res) => {
  try {
    const data = await enrollmentService.getCourseDetailForStudent(req.params.id, req.user.userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ message: error.message });
  }
});

router.post('/:id/lessons/:lessonId/access', authenticate, isStudent, async (req, res) => {
  try {
    const result = await progressService.accessTopic(
      req.params.id,
      req.user.userId,
      req.params.lessonId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/lessons/:lessonId/complete', authenticate, isStudent, async (req, res) => {
  try {
    const result = await progressService.completeTopic(
      req.params.id,
      req.user.userId,
      req.params.lessonId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
