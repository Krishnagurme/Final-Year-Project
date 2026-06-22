import QuestionBank from '../models/QuestionBank.js';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';

const skillFromScore = score => {
  if (score >= 80) return 'ADVANCED';
  if (score >= 60) return 'INTERMEDIATE';
  return 'BEGINNER';
};

export const adminAssessmentService = {
  async listQuestions(filters = {}) {
    const query = { isActive: { $ne: false } };
    if (filters.subject) query.subject = new RegExp(filters.subject, 'i');
    if (filters.difficulty) query.difficulty = filters.difficulty;
    return QuestionBank.find(query).sort({ createdAt: -1 });
  },

  async createQuestion(data, userId) {
    const question = new QuestionBank({ ...data, createdBy: userId });
    await question.save();
    return question;
  },

  async updateQuestion(id, data) {
    const question = await QuestionBank.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!question) throw new Error('Question not found');
    return question;
  },

  async deleteQuestion(id) {
    const inUse = await Test.countDocuments({ questions: id });
    if (inUse > 0) {
      throw new Error('Question is used in one or more tests. Remove it from tests first.');
    }
    const question = await QuestionBank.findByIdAndDelete(id);
    if (!question) throw new Error('Question not found');
    return question;
  },

  async listTests() {
    return Test.find()
      .populate('questions', 'subject question difficulty')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
  },

  async createTest(data, userId) {
    const test = new Test({ ...data, createdBy: userId });
    await test.save();
    return test.populate('questions', 'subject question difficulty');
  },

  async updateTest(id, data) {
    const test = await Test.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      'questions',
      'subject question difficulty'
    );
    if (!test) throw new Error('Test not found');
    return test;
  },

  async deleteTest(id) {
    await TestResult.deleteMany({ testId: id });
    const test = await Test.findByIdAndDelete(id);
    if (!test) throw new Error('Test not found');
    return test;
  },

  async setTestStatus(id, status) {
    return this.updateTest(id, { status });
  },

  async listResults(filters = {}) {
    const query = {};
    if (filters.testId) query.testId = filters.testId;
    if (filters.subject) {
      const tests = await Test.find({ subject: new RegExp(filters.subject, 'i') }).select('_id');
      query.testId = { $in: tests.map(t => t._id) };
    }

    const testResults = await TestResult.find(query)
      .populate('testId', 'title subject')
      .populate('studentId', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    const legacyAssessments = await Assessment.find({
      status: { $in: ['SUBMITTED', 'EVALUATED'] },
    })
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title')
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(100);

    const formattedTestResults = testResults.map(r => ({
      id: r._id.toString(),
      source: 'test',
      student: r.studentId
        ? `${r.studentId.firstName} ${r.studentId.lastName}`
        : 'Unknown',
      studentEmail: r.studentId?.email,
      subject: r.testId?.subject || r.testId?.title || '—',
      testTitle: r.testId?.title || '—',
      score: r.percentage ?? r.score ?? 0,
      level: r.skillLevel || skillFromScore(r.percentage ?? r.score ?? 0),
      date: r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : '—',
      status: r.status,
    }));

    const formattedLegacy = legacyAssessments.map(a => ({
      id: a._id.toString(),
      source: 'assessment',
      student: a.studentId ? `${a.studentId.firstName} ${a.studentId.lastName}` : 'Unknown',
      studentEmail: a.studentId?.email,
      subject: a.courseId?.title || a.type || 'General',
      testTitle: a.type || 'Assessment',
      score: a.percentage ?? a.score ?? 0,
      level: a.aiEvaluation?.skillLevel || skillFromScore(a.percentage ?? a.score ?? 0),
      date: (a.submittedAt || a.createdAt)?.toISOString?.()?.split('T')[0] || '—',
      status: a.status,
    }));

    const users = await User.find({ role: 'STUDENT' }).select('firstName lastName assessmentHistory');
    const historyResults = users.flatMap(u =>
      (u.assessmentHistory || []).map((h, i) => ({
        id: `${u._id}-hist-${i}`,
        source: 'history',
        student: `${u.firstName} ${u.lastName}`,
        studentEmail: u.email,
        subject: h.subject,
        testTitle: 'Practice assessment',
        score: h.score ?? 0,
        level: h.skillLevel || 'BEGINNER',
        date: h.completedAt ? new Date(h.completedAt).toISOString().split('T')[0] : '—',
        status: 'EVALUATED',
      }))
    );

    return [...formattedTestResults, ...formattedLegacy, ...historyResults].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );
  },

  async deleteResult(id, source) {
    if (source === 'test') {
      const result = await TestResult.findByIdAndDelete(id);
      if (!result) throw new Error('Result not found');
      return result;
    }
    if (source === 'assessment') {
      const result = await Assessment.findByIdAndDelete(id);
      if (!result) throw new Error('Result not found');
      return result;
    }
    throw new Error('Cannot delete historical practice records from this view');
  },

  formatTestRow(test) {
    const questionCount = test.questions?.length || 0;
    return {
      id: test._id.toString(),
      title: test.title,
      subject: test.subject,
      difficulty: test.difficulty,
      totalQuestions: questionCount,
      passingScore: test.passingScore,
      timeLimit: test.timeLimit,
      schedule:
        test.schedule === 'SCHEDULED' && test.scheduledAt
          ? new Date(test.scheduledAt).toLocaleString()
          : 'Always Available',
      scheduleType: test.schedule,
      scheduledAt: test.scheduledAt,
      status: test.status,
      questionIds: (test.questions || []).map(q => (q._id || q).toString()),
    };
  },

  formatQuestionRow(q) {
    return {
      id: q._id.toString(),
      subject: q.subject,
      question: q.question,
      type: q.type,
      options: q.options || [],
      correct: q.correctAnswer,
      difficulty: q.difficulty,
      tags: q.tags || [],
    };
  },
};

export default adminAssessmentService;
