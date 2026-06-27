import express from 'express';
import { authenticate, isInstructorOrAdmin } from '../middleware/auth.js';
import { topicService } from '../modules/lms/services/topic.service.js';

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const topics = await topicService.listByCourse(req.params.courseId);
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ message: error.message });
  }
});

router.get('/:topicId', async (req, res) => {
  try {
    const topic = await topicService.getTopic(req.params.courseId, req.params.topicId);
    res.json({ success: true, data: topic });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

router.post('/', authenticate, isInstructorOrAdmin, async (req, res) => {
  try {
    const topic = await topicService.createTopic(
      req.params.courseId,
      req.body,
      req.user.userId,
      req.user.role
    );
    res.status(201).json({ success: true, data: topic, message: 'Topic created successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:topicId', authenticate, isInstructorOrAdmin, async (req, res) => {
  try {
    const topic = await topicService.updateTopic(
      req.params.courseId,
      req.params.topicId,
      req.body,
      req.user.userId,
      req.user.role
    );
    res.json({ success: true, data: topic, message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Topic update error:', error);
    res.status(400).json({ message: error.message, stack: error.stack, full: error.toString() });
  }
});

router.delete('/:topicId', authenticate, isInstructorOrAdmin, async (req, res) => {
  try {
    await topicService.deleteTopic(
      req.params.courseId,
      req.params.topicId,
      req.user.userId,
      req.user.role
    );
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
