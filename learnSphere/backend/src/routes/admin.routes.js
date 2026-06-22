import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, isAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';
import Certificate from '../models/Certificate.js';
import TestResult from '../models/TestResult.js';
import { authService } from '../services/auth.service.js';
import { adminService } from '../services/admin.service.js';
import { adminAssessmentService } from '../services/adminAssessment.service.js';
import { courseService } from '../services/course.service.js';
import { runtimeMetricsService } from '../services/runtimeMetrics.service.js';
import { broadcastAdminUpdate } from '../realtime/adminSocket.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getFilePath = filename => {
  const dir = path.join(__dirname, '../config/admin');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, filename);
};

const readJsonFile = (filename, defaultVal) => {
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultVal;
  }
};

const writeJsonFile = (filename, data) => {
  fs.writeFileSync(getFilePath(filename), JSON.stringify(data, null, 2));
};

const notify = (event, payload) => broadcastAdminUpdate(event, payload);

router.get('/dashboard', authenticate, isAdmin, async (req, res) => {
  try {
    const data = await adminService.getDashboardSnapshot();
    res.json({ message: 'Admin dashboard data fetched', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await adminService.getDashboardSnapshot();
    res.json({ message: 'Admin analytics fetched successfully', data: snapshot.analytics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').populate('enrolledCourses.courseId');
    res.json({ message: 'Users fetched successfully', data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'STUDENT' } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = password
      ? await authService.hashPassword(password)
      : await authService.hashPassword('TempPass1!');

    const user = new User({ firstName, lastName, email, password: hashedPassword, role });
    await user.save();
    notify('user-created', { userId: user._id });

    res.status(201).json({
      message: 'User created successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    await user.save();
    notify('user-updated', { userId: user._id });

    res.json({ message: 'User updated successfully', data: user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    notify('user-deleted', { userId: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/users/:id/suspend', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    notify('user-suspended', { userId: user._id, isActive: user.isActive });
    res.json({
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/courses', authenticate, isAdmin, async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'firstName lastName email');
    res.json({ data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/courses', authenticate, isAdmin, async (req, res) => {
  try {
    const course = await courseService.createCourse(
      {
        title: req.body.title,
        description: req.body.description || req.body.title,
        category: req.body.category || 'General',
        level: req.body.level || 'BEGINNER',
        learningOutcomes: req.body.learningOutcomes || [],
      },
      req.user.userId
    );
    notify('course-created', { courseId: course._id });
    res.status(201).json({ message: 'Course created', data: course });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/courses/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await courseService.deleteCourse(req.params.id);
    notify('course-deleted', { courseId: req.params.id });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/categories', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await adminService.getDashboardSnapshot();
    res.json({ data: snapshot.categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/assessments', authenticate, isAdmin, async (req, res) => {
  try {
    const assessments = await Assessment.find().populate('studentId', 'firstName lastName email');
    res.json({ data: assessments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/certificates', authenticate, isAdmin, async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title');
    res.json({ data: certificates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const defaultSettings = {
  activeModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  fallbackModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  promptTemplate:
    'You are an expert tutor. Break down complexity, highlight core concepts, and focus on: {{knowledgeAreas}}.',
  twoFactorEnabled: false,
  restrictDomains: false,
};

router.get('/settings', authenticate, isAdmin, async (req, res) => {
  res.json({ data: readJsonFile('settings.json', defaultSettings) });
});

router.post('/settings', authenticate, isAdmin, async (req, res) => {
  writeJsonFile('settings.json', req.body);
  notify('settings-updated');
  res.json({ message: 'Settings saved successfully', data: req.body });
});

const defaultSupport = [
  {
    id: 'TKT-101',
    user: 'system.admin@learnsphere.com',
    type: 'General',
    message: 'LearnSphere is ready for admin usage.',
    status: 'Open',
    date: new Date().toISOString(),
    sentiment: 'Neutral',
  },
];

router.get('/support', authenticate, isAdmin, async (req, res) => {
  res.json({ data: readJsonFile('support.json', defaultSupport) });
});

router.post('/support', authenticate, isAdmin, async (req, res) => {
  const tickets = readJsonFile('support.json', defaultSupport);
  const newTicket = {
    id: `TKT-${100 + tickets.length + 1}`,
    user: req.body.user || 'Admin',
    type: req.body.type || 'Technical',
    message: req.body.message,
    status: 'Open',
    date: new Date().toISOString(),
    sentiment: req.body.sentiment || 'Neutral',
  };
  tickets.push(newTicket);
  writeJsonFile('support.json', tickets);
  notify('support-created', { ticketId: newTicket.id });
  res.status(201).json({ message: 'Ticket created successfully', data: newTicket });
});

router.patch('/support/:id', authenticate, isAdmin, async (req, res) => {
  const tickets = readJsonFile('support.json', defaultSupport);
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.body.status) ticket.status = req.body.status;
  writeJsonFile('support.json', tickets);
  notify('support-updated', { ticketId: ticket.id });
  res.json({ message: 'Ticket updated', data: ticket });
});

const defaultBlogs = [
  {
    id: '1',
    title: 'LearnSphere Admin Panel Live',
    author: 'System',
    category: 'Announcement',
    status: 'Published',
    date: new Date().toISOString().split('T')[0],
  },
];

router.get('/cms', authenticate, isAdmin, async (req, res) => {
  res.json({ data: readJsonFile('blogs.json', defaultBlogs) });
});

router.post('/cms', authenticate, isAdmin, async (req, res) => {
  const blogs = readJsonFile('blogs.json', defaultBlogs);
  const newBlog = {
    id: String(blogs.length + 1),
    title: req.body.title,
    author: req.body.author || 'Admin',
    category: req.body.category || 'EdTech',
    status: req.body.status || 'Published',
    date: new Date().toISOString().split('T')[0],
  };
  blogs.push(newBlog);
  writeJsonFile('blogs.json', blogs);
  notify('cms-created', { postId: newBlog.id });
  res.status(201).json({ message: 'Post created successfully', data: newBlog });
});

// Assessment Management — Question Bank
router.get('/questions', authenticate, isAdmin, async (req, res) => {
  try {
    const questions = await adminAssessmentService.listQuestions(req.query);
    res.json({
      message: 'Questions fetched successfully',
      data: questions.map(q => adminAssessmentService.formatQuestionRow(q)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/questions', authenticate, isAdmin, async (req, res) => {
  try {
    const question = await adminAssessmentService.createQuestion(req.body, req.user.userId);
    notify('question-created', { questionId: question._id });
    res.status(201).json({
      message: 'Question created successfully',
      data: adminAssessmentService.formatQuestionRow(question),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/questions/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const question = await adminAssessmentService.updateQuestion(req.params.id, req.body);
    notify('question-updated', { questionId: question._id });
    res.json({
      message: 'Question updated successfully',
      data: adminAssessmentService.formatQuestionRow(question),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/questions/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await adminAssessmentService.deleteQuestion(req.params.id);
    notify('question-deleted', { questionId: req.params.id });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assessment Management — Tests
router.get('/tests', authenticate, isAdmin, async (req, res) => {
  try {
    const tests = await adminAssessmentService.listTests();
    const withStats = await Promise.all(
      tests.map(async test => {
        const attempts = await TestResult.countDocuments({ testId: test._id });
        const passed = await TestResult.countDocuments({
          testId: test._id,
          percentage: { $gte: test.passingScore || 60 },
        });
        return {
          ...adminAssessmentService.formatTestRow(test),
          attempts,
          passingRate: attempts > 0 ? `${Math.round((passed / attempts) * 100)}%` : 'N/A',
        };
      })
    );
    res.json({ message: 'Tests fetched successfully', data: withStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/tests', authenticate, isAdmin, async (req, res) => {
  try {
    const test = await adminAssessmentService.createTest(req.body, req.user.userId);
    notify('test-created', { testId: test._id });
    res.status(201).json({
      message: 'Test created successfully',
      data: adminAssessmentService.formatTestRow(test),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/tests/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const test = await adminAssessmentService.updateTest(req.params.id, req.body);
    notify('test-updated', { testId: test._id });
    res.json({
      message: 'Test updated successfully',
      data: adminAssessmentService.formatTestRow(test),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/tests/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await adminAssessmentService.deleteTest(req.params.id);
    notify('test-deleted', { testId: req.params.id });
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/tests/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const test = await adminAssessmentService.setTestStatus(req.params.id, status);
    notify('test-status-updated', { testId: test._id, status });
    res.json({
      message: 'Test status updated',
      data: adminAssessmentService.formatTestRow(test),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assessment Management — Results
router.get('/results', authenticate, isAdmin, async (req, res) => {
  try {
    const results = await adminAssessmentService.listResults(req.query);
    res.json({ message: 'Results fetched successfully', data: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/results/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await adminAssessmentService.deleteResult(req.params.id, req.query.source);
    notify('result-deleted', { resultId: req.params.id });
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Runtime Metrics Endpoints
router.get('/runtime/system', authenticate, isAdmin, async (req, res) => {
  try {
    const metrics = runtimeMetricsService.getSystemMetrics();
    res.json({ message: 'System metrics fetched successfully', data: metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/runtime/process', authenticate, isAdmin, async (req, res) => {
  try {
    const metrics = runtimeMetricsService.getProcessMetrics();
    res.json({ message: 'Process metrics fetched successfully', data: metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/runtime/api', authenticate, isAdmin, async (req, res) => {
  try {
    const metrics = runtimeMetricsService.getAPIMetrics();
    res.json({ message: 'API metrics fetched successfully', data: metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/runtime/database', authenticate, isAdmin, async (req, res) => {
  try {
    const metrics = await runtimeMetricsService.getDatabaseStatus(mongoose);
    res.json({ message: 'Database metrics fetched successfully', data: metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/runtime/snapshot', authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await runtimeMetricsService.getRuntimeSnapshot(mongoose);
    res.json({ message: 'Runtime snapshot fetched successfully', data: snapshot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/runtime/reset', authenticate, isAdmin, async (req, res) => {
  try {
    runtimeMetricsService.resetMetrics();
    notify('runtime-metrics-reset');
    res.json({ message: 'Runtime metrics reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
