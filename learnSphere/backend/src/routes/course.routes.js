import express from 'express';
import { courseService } from '../services/course.service.js';
import { authenticate, isAdmin, isStudent } from '../middleware/auth.js';
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

// Admin Routes (Manage learning content)
router.post(
  '/',
  authenticate,
  isAdmin,
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

router.get('/instructor/my-courses', authenticate, isAdmin, async (req, res) => {
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

router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
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

// Student Routes
router.post('/:id/enroll', authenticate, isStudent, async (req, res) => {
  try {
    const course = await courseService.enrollStudent(req.params.id, req.user.userId);
    res.json({
      message: 'Enrolled successfully',
      data: course,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
