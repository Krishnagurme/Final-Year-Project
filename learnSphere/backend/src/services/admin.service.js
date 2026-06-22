import User from '../models/User.js';
import Course from '../models/Course.js';
import Assessment from '../models/Assessment.js';
import Certificate from '../models/Certificate.js';
import AiChatMessage from '../modules/ai/models/AiChatMessage.js';
import AiChatSession from '../modules/ai/models/AiChatSession.js';
import AiDocument from '../modules/ai/models/AiDocument.js';
import TestResult from '../models/TestResult.js';
import Test from '../models/Test.js';
import QuestionBank from '../models/QuestionBank.js';
import { adminAssessmentService } from './adminAssessment.service.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const formatBytes = bytes => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const avgProgress = enrollments => {
  if (!enrollments?.length) return 0;
  const total = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
  return Math.round(total / enrollments.length);
};

const riskLevel = (progress, isActive) => {
  if (!isActive) return 'High';
  if (progress < 25) return 'High';
  if (progress < 60) return 'Medium';
  return 'Low';
};

const buildTimeline = (users, courses, assessments, aiMessages) => {
  const days = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const inRange = date => {
      if (!date) return false;
      const d = new Date(date);
      return d >= day && d < next;
    };

    const dayUsers = users.filter(u => inRange(u.createdAt)).length;
    const dayCourses = courses.filter(c => inRange(c.createdAt)).length;
    const dayAssessments = assessments.filter(a => inRange(a.createdAt)).length;
    const dayAi = aiMessages.filter(m => inRange(m.createdAt)).length;

    days.push({
      name: DAY_NAMES[day.getDay()],
      Students: dayUsers,
      Courses: dayCourses,
      AI_Requests: dayAi || dayAssessments,
    });
  }

  return days;
};

const buildActivities = (users, courses, assessments, certificates, documents) => {
  const events = [];

  users.slice(0, 20).forEach(u => {
    events.push({
      id: `user-${u._id}`,
      message: `New ${u.role.toLowerCase()} ${u.firstName} ${u.lastName} registered`,
      type: 'user',
      timestamp: u.createdAt,
    });
  });

  courses.slice(0, 15).forEach(c => {
    events.push({
      id: `course-${c._id}`,
      message: `Course "${c.title}" was ${c.isPublished ? 'published' : 'created'}`,
      type: 'course',
      timestamp: c.createdAt,
    });
  });

  assessments.slice(0, 15).forEach(a => {
    const student = a.studentId;
    const name = student ? `${student.firstName} ${student.lastName}` : 'A student';
    events.push({
      id: `assessment-${a._id}`,
      message: `${name} completed an assessment (score: ${a.score ?? a.percentage ?? 0}%)`,
      type: 'assessment',
      timestamp: a.submittedAt || a.createdAt,
    });
  });

  certificates.slice(0, 10).forEach(cert => {
    events.push({
      id: `cert-${cert._id}`,
      message: `${cert.studentName} earned certificate for "${cert.courseName}"`,
      type: 'certificate',
      timestamp: cert.issuedAt,
    });
  });

  documents.slice(0, 10).forEach(doc => {
    events.push({
      id: `doc-${doc._id}`,
      message: `Document "${doc.name}" uploaded (${doc.status})`,
      type: 'document',
      timestamp: doc.createdAt,
    });
  });

  return events
    .filter(e => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);
};

export const adminService = {
  async getDashboardSnapshot() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [users, courses, assessments, certificates, aiMessages, aiSessions, documents, bankQuestions, adminTests, testResults] =
      await Promise.all([
        User.find().select('-password').sort({ createdAt: -1 }),
        Course.find().populate('instructor', 'firstName lastName email').sort({ createdAt: -1 }),
        Assessment.find()
          .populate('studentId', 'firstName lastName email')
          .populate('courseId', 'title')
          .sort({ createdAt: -1 }),
        Certificate.find()
          .populate('studentId', 'firstName lastName email')
          .populate('courseId', 'title')
          .sort({ issuedAt: -1 }),
        AiChatMessage.find({ role: 'user' })
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(50),
        AiChatSession.find().populate('userId', 'firstName lastName email').sort({ updatedAt: -1 }),
        AiDocument.find().populate('userId', 'firstName lastName email').sort({ createdAt: -1 }),
        QuestionBank.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }),
        Test.find().populate('questions', 'subject question difficulty').sort({ createdAt: -1 }),
        TestResult.find()
          .populate('testId', 'title subject passingScore')
          .populate('studentId', 'firstName lastName email')
          .sort({ submittedAt: -1 })
          .limit(100),
      ]);

    const students = users.filter(u => u.role === 'STUDENT');
    const admins = users.filter(u => u.role === 'ADMIN');
    const activeUsers = users.filter(
      u => u.lastLogin && new Date(u.lastLogin) >= sevenDaysAgo
    ).length;

    let totalEnrolled = 0;
    let totalCompleted = 0;
    students.forEach(u => {
      (u.enrolledCourses || []).forEach(e => {
        totalEnrolled++;
        if ((e.progress || 0) >= 100 || e.certificateObtained) totalCompleted++;
      });
    });
    const completionRate =
      totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

    const categoryCounts = {};
    courses.forEach(c => {
      if (c.category) categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    const studentRows = students.map(u => ({
      id: u._id.toString(),
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      level: u.skillLevel || 'BEGINNER',
      progress: avgProgress(u.enrolledCourses),
      status: u.isActive === false ? 'Suspended' : 'Active',
      enrolled: u.enrolledCourses?.length || 0,
      attendance: u.lastLogin
        ? `${Math.min(100, Math.round((u.totalHoursLearned || 0) * 4))}%`
        : '—',
      hours: Math.round(u.totalHoursLearned || 0),
      risk: riskLevel(avgProgress(u.enrolledCourses), u.isActive !== false),
    }));

    const adminCourseCounts = {};
    courses.forEach(c => {
      const id = c.instructor?._id?.toString();
      if (id) adminCourseCounts[id] = (adminCourseCounts[id] || 0) + 1;
    });

    const teacherRows = admins.map(a => ({
      id: a._id.toString(),
      name: `${a.firstName} ${a.lastName}`,
      email: a.email,
      courses: adminCourseCounts[a._id.toString()] || 0,
      students: courses
        .filter(c => c.instructor?._id?.toString() === a._id.toString())
        .reduce((sum, c) => sum + (c.totalEnrollments || c.students?.length || 0), 0),
      rating: 4.8,
      status: a.isActive === false ? 'Inactive' : 'Active',
    }));

    const courseRows = courses.map(c => {
      const enrollments = c.totalEnrollments || c.students?.length || 0;
      return {
        id: c._id.toString(),
        title: c.title,
        instructor: c.instructor
          ? `${c.instructor.firstName} ${c.instructor.lastName}`
          : 'Unassigned',
        instructorId: c.instructor?._id?.toString(),
        category: c.category,
        level: c.level,
        students: enrollments,
        status: c.isPublished ? 'Published' : 'Draft',
        completionRate:
          enrollments > 0 ? `${Math.round(c.averageRating ? c.averageRating * 20 : 0)}%` : 'N/A',
      };
    });

    const categoryRows = Object.entries(categoryCounts).map(([name, count], index) => ({
      id: String(index + 1),
      name,
      count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

    const resourceRows = documents.map(d => ({
      id: d._id.toString(),
      filename: d.name,
      size: formatBytes(d.size),
      type: d.mimeType?.includes('pdf')
        ? 'PDF'
        : d.mimeType?.includes('image')
          ? 'Image'
          : 'Document',
      associatedCourse: d.metadata?.courseTitle || 'AI Workspace',
      uploadedBy: d.userId ? `${d.userId.firstName} ${d.userId.lastName}` : 'Unknown',
    }));

    const testRows = await Promise.all(
      adminTests.map(async test => {
        const attempts = testResults.filter(r => r.testId?._id?.toString() === test._id.toString()).length;
        const passed = testResults.filter(
          r =>
            r.testId?._id?.toString() === test._id.toString() &&
            (r.percentage ?? 0) >= (test.passingScore || 60)
        ).length;
        return {
          ...adminAssessmentService.formatTestRow(test),
          attempts,
          passingRate: attempts > 0 ? `${Math.round((passed / attempts) * 100)}%` : 'N/A',
        };
      })
    );

    const questionRows = bankQuestions.map(q => adminAssessmentService.formatQuestionRow(q));

    const resultRows = await adminAssessmentService.listResults();

    const certificateRows = certificates.map(c => ({
      id: c.certificateNumber || c._id.toString(),
      recipient: c.studentName || (c.studentId ? `${c.studentId.firstName} ${c.studentId.lastName}` : '—'),
      course: c.courseName || c.courseId?.title || '—',
      issueDate: c.issuedAt ? new Date(c.issuedAt).toISOString().split('T')[0] : '—',
      verified: c.isValid !== false,
      template: c.metadata?.templateId || 'Academic Standard',
    }));

    const aiLogRows = aiMessages.slice(0, 20).map(m => ({
      timestamp: new Date(m.createdAt).toLocaleTimeString(),
      student: m.userId ? `${m.userId.firstName} ${m.userId.lastName}` : 'Unknown',
      query: m.content?.slice(0, 80) + (m.content?.length > 80 ? '…' : ''),
      tokens: m.tokenEstimate || Math.round((m.content?.length || 0) / 4),
      responseTime: '—',
      status: 'Success',
    }));

    const roleRows = [
      {
        role: 'STUDENT',
        count: students.length,
        permissions: ['View Dashboard', 'Enroll Courses', 'Take Assessments', 'AI Chat'],
      },
      {
        role: 'ADMIN',
        count: admins.length,
        permissions: [
          'View Dashboard',
          'User Management',
          'Course Management',
          'System Settings',
          'View Platform Analytics',
          'AI Workspace Logs',
        ],
      },
    ];

    return {
      analytics: {
        totalUsers: users.length,
        studentsCount: students.length,
        adminsCount: admins.length,
        activeUsers,
        totalCourses: courses.length,
        totalAssessments: assessments.length,
        totalCertificates: certificates.length,
        completionRate,
        aiSessions: aiSessions.length,
        openSupportTickets: 0,
      },
      timeline: buildTimeline(users, courses, assessments, aiMessages),
      activities: buildActivities(users, courses, assessments, certificates, documents),
      students: studentRows,
      teachers: teacherRows,
      courses: courseRows,
      categories: categoryRows,
      resources: resourceRows,
      tests: testRows,
      questions: questionRows.slice(0, 50),
      results: resultRows.slice(0, 50),
      tasks: [],
      certificates: certificateRows,
      aiLogs: aiLogRows,
      roles: roleRows,
      lastUpdated: new Date().toISOString(),
    };
  },
};

export default adminService;
