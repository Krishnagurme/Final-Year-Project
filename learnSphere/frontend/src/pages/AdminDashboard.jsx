import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  BookOpen,
  Folders,
  FileText,
  Sparkles,
  Brain,
  Terminal,
  Award,
  Bell,
  Settings,
  LogOut,
  FileSpreadsheet,
  HelpCircle,
  TrendingUp,
  ClipboardList,
  CheckSquare,
  Database,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
  RefreshCw,
  Filter,
  Clock,
  ArrowUpRight,
  Activity,
  Sliders,
  AlertTriangle,
  Info,
  Calendar,
  Key,
  Shield,
  Palette,
  HardDriveDownload,
  BookOpenCheck,
  Send,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { logout } from '../store/authSlice.js';
import { adminService } from '../services/index.js';
import useAdminData from '../hooks/useAdminData.js';
import useRuntimeMetrics from '../hooks/useRuntimeMetrics.js';
import RuntimeMetrics from '../components/RuntimeMetrics.jsx';
import AdminAssessmentSection from '../components/AdminAssessmentSection.jsx';

const formatRelativeTime = value => {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const {
    analytics,
    timeline,
    activities,
    students,
    teachers,
    courses,
    categories,
    resources,
    tests,
    questions,
    results,
    tasks,
    certificates,
    aiLogs,
    roles,
    settings,
    support,
    blogs,
    loading,
    refreshing,
    error,
    live,
    lastUpdated,
    refresh,
  } = useAdminData();

  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
    resetMetrics,
  } = useRuntimeMetrics();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modelSettings, setModelSettings] = useState(null);
  const [actionError, setActionError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const [expandedMenus, setExpandedMenus] = useState({
    users: true,
    courses: true,
    assessments: false,
    aiCenter: false,
    cms: false,
    aiModel: false,
  });

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('');

  useEffect(() => {
    if (settings) setModelSettings(settings);
  }, [settings]);

  // Sidebar toggle helper
  const toggleMenu = menu => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isTabActive = tab => activeTab === tab;

  const handleAddStudent = async e => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;
    setActionError('');
    const [firstName, ...rest] = newStudentName.trim().split(' ');
    const lastName = rest.join(' ') || 'User';
    try {
      await adminService.createUser({
        firstName,
        lastName,
        email: newStudentEmail,
        password: 'Student@123',
        role: 'STUDENT',
      });
      setNewStudentName('');
      setNewStudentEmail('');
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create student');
    }
  };

  const handleAddCourse = async e => {
    e.preventDefault();
    if (!newCourseTitle) return;
    setActionError('');
    try {
      await adminService.createCourse({
        title: newCourseTitle,
        description: newCourseTitle,
        category: newCourseCategory || 'General',
        level: 'BEGINNER',
      });
      setNewCourseTitle('');
      setNewCourseInstructor('');
      setNewCourseCategory('');
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteStudent = async id => {
    try {
      await adminService.deleteUser(id);
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleDeleteCourse = async id => {
    try {
      await adminService.deleteCourse(id);
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const handleSuspendStudent = async id => {
    try {
      await adminService.suspendUser(id);
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update student status');
    }
  };

  const handleSaveSettings = async () => {
    if (!modelSettings) return;
    setSavingSettings(true);
    setActionError('');
    try {
      await adminService.saveSettings(modelSettings);
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResolveTicket = async id => {
    try {
      await adminService.updateSupportTicket(id, { status: 'Resolved' });
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update ticket');
    }
  };

  // Tabs router render
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderOverview();
      case 'students':
        return renderStudents();
      case 'teachers':
        return renderTeachers();
      case 'roles':
        return renderRoles();
      case 'courses':
        return renderCourses();
      case 'categories':
        return renderCategories();
      case 'resources':
        return renderResources();
      case 'tests':
        return renderTests();
      case 'question-bank':
        return renderQuestionBank();
      case 'results':
        return renderResults();
      case 'ai-performance':
        return renderAIPerformance();
      case 'progress':
        return renderProgressMonitoring();
      case 'tasks':
        return renderTasksAndAssignments();
      case 'certificates':
        return renderCertificates();
      case 'cms':
        return renderCMS();
      case 'ai-model-settings':
        return renderAIModelSettings();
      case 'reports':
        return renderReports();
      case 'notifications':
        return renderNotifications();
      case 'support':
        return renderSupport();
      case 'runtime':
        return renderRuntimeMetrics();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    const engagement =
      analytics.studentsCount > 0
        ? Math.round((analytics.activeUsers / analytics.studentsCount) * 100)
        : 0;

    return (
      <div className="space-y-6">
        {(error || actionError) && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
            {actionError || error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics.studentsCount}</h3>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> {analytics.totalUsers} total users
              </p>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <GraduationCap size={24} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users (7d)</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics.activeUsers}</h3>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <Activity size={12} /> {engagement}% engagement
              </p>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity size={24} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Courses</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics.totalCourses}</h3>
              <p className="text-xs text-purple-600 mt-1">{categories.length} categories</p>
            </div>
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificates Issued</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics.totalCertificates}</h3>
              <p className="text-xs text-blue-600 mt-1">Completed learning paths</p>
            </div>
            <div className="p-4 bg-pink-50 text-pink-600 rounded-2xl">
              <Award size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Completion Rate</span>
            <div className="flex items-end justify-between mt-2">
              <h4 className="text-2xl font-black text-slate-800">{analytics.completionRate}%</h4>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5"><TrendingUp size={12} /> Live</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${analytics.completionRate}%` }} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Sessions</span>
            <div className="flex items-end justify-between mt-2">
              <h4 className="text-2xl font-black text-slate-800">{analytics.aiSessions}</h4>
              <span className="text-xs font-semibold text-amber-600">Active workspace</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, analytics.aiSessions * 10)}%` }} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Assessment Stats</span>
            <div className="flex items-end justify-between mt-2">
              <h4 className="text-2xl font-black text-slate-800">{analytics.totalAssessments} Taken</h4>
              <span className="text-xs font-semibold text-purple-600">{analytics.totalCertificates} certs</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: analytics.totalAssessments > 0 ? '100%' : '0%' }} />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Platform Growth Timeline (7 days)</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Students" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                <Area type="monotone" dataKey="Courses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorCourses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Recent Activities</h4>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">No recent platform activity yet.</p>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${index === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-slate-800 font-semibold">{activity.message}</p>
                    <span className="text-xs text-slate-400">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. User Management
  const renderStudents = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl lg:col-span-2">
          <h4 className="text-lg font-bold text-slate-800 mb-4">View Students</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3 text-slate-650">{s.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>{s.status}</span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => handleSuspendStudent(s.id)} className="text-xs font-bold text-amber-600 hover:text-amber-800">
                        {s.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteStudent(s.id)} className="text-xs font-bold text-red-650 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Add Student Account</h4>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
              <input type="text" className="input" placeholder="e.g. John Doe" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
              <input type="email" className="input" placeholder="name@company.com" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} required />
            </div>
            <button type="submit" className="w-full btn btn-primary py-2.5 rounded-xl font-bold">Add Student</button>
          </form>
        </div>
      </div>
    );
  };

  const renderTeachers = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <h4 className="text-lg font-bold text-slate-800 mb-4">View Teachers</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Courses</th>
                <th className="pb-3">Students</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 font-semibold text-slate-800">{t.name}</td>
                  <td className="py-3.5 text-slate-655">{t.email}</td>
                  <td className="py-3.5 text-center">{t.courses}</td>
                  <td className="py-3.5 text-center font-semibold text-indigo-700">{t.students}</td>
                  <td className="py-3.5 text-amber-500 font-semibold">★ {t.rating}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRoles = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Role Management Matrix</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(r => (
            <div key={r.role} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">{r.role}</span>
                  <span className="text-xs text-slate-400">{r.count} users</span>
                </div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Granted Permissions</h5>
                <ul className="space-y-1.5">
                  {r.permissions.map(perm => (
                    <li key={perm} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-500" /> {perm}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="mt-6 w-full text-center border border-slate-200 hover:bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all">
                Modify Permissions
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. Course Management
  const renderCourses = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl lg:col-span-2">
          <h4 className="text-lg font-bold text-slate-800 mb-4">View/Update Courses</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Instructor</th>
                  <th className="pb-3">Level</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {courses.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{c.title}</td>
                    <td className="py-3 text-slate-600">{c.instructor}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold">{c.level}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => handleDeleteCourse(c.id)} className="text-xs font-bold text-red-650 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Create Course</h4>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course Title</label>
              <input type="text" className="input" placeholder="e.g. Advanced Javascript" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assign Instructor</label>
              <input type="text" className="input" placeholder="e.g. Dr. Sarah Connor" value={newCourseInstructor} onChange={e => setNewCourseInstructor(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
              <select className="input" value={newCourseCategory} onChange={e => setNewCourseCategory(e.target.value)}>
                <option value="Programming">Programming</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Database">Database</option>
              </select>
            </div>
            <button type="submit" className="w-full btn btn-primary py-2.5 rounded-xl font-bold">Create Course</button>
          </form>
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Manage Course Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <div>
                  <h5 className="font-bold text-slate-850 text-sm">{cat.name}</h5>
                  <span className="text-xs text-slate-400">{cat.count} courses</span>
                </div>
              </div>
              <button className="text-red-650 hover:text-red-800 p-1 hover:bg-slate-100 rounded"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResources = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Upload Learning Materials</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Filename</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Associated Course</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {resources.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-800">{res.filename}</td>
                  <td className="py-3 text-slate-500">{res.size}</td>
                  <td className="py-3 font-bold text-blue-600">{res.type}</td>
                  <td className="py-3 text-slate-650">{res.associatedCourse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTests = () => <AdminAssessmentSection section="tests" onDataChange={refresh} />;

  const renderQuestionBank = () => <AdminAssessmentSection section="questions" onDataChange={refresh} />;

  const renderResults = () => <AdminAssessmentSection section="results" onDataChange={refresh} />;

  // 5. AI Analytics Center
  const renderAIPerformance = () => {
    const riskData = [
      { name: 'Low Risk', value: 3, color: '#10b981' },
      { name: 'Medium Risk', value: 1, color: '#f59e0b' },
      { name: 'High Risk', value: 1, color: '#ef4444' },
    ];

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Performance Analysis</span>
            <div className="h-[180px] mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="AI_Requests" name="AI Score Improvement" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Risk Analysis</span>
            <div className="h-[140px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {riskData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2 text-xs font-semibold">
              <span className="text-emerald-600">Low (3)</span>
              <span className="text-amber-600">Med (1)</span>
              <span className="text-red-650">High (1)</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personalized Recommendations Analytics</span>
              <div className="mt-4 space-y-2 text-xs font-medium">
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-650">Weak Topic Injection Rate</span>
                  <span className="font-bold text-slate-800">84%</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-650">Dropout Prediction Model Accuracy</span>
                  <span className="font-bold text-slate-800">92.4%</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-start gap-2 mt-4">
              <AlertTriangle size={16} className="shrink-0" />
              <span><strong>Dropout Alert:</strong> David Brown has had 0 activity in the past 7 days and is flagged as High Risk.</span>
            </div>
          </div>
        </div>

        {/* Detailed Dropout Prediction List */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Dropout Prediction & Weak Topic Detection</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Dropout Risk Score</th>
                  <th className="pb-3">Detected Weak Topics</th>
                  <th className="pb-3">Last AI Prompt Date</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3">
                      <span className={`font-bold ${s.risk === 'High' ? 'text-red-650' : s.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {s.risk === 'High' ? 'High Risk (92%)' : s.risk === 'Medium' ? 'Medium Risk (45%)' : 'Low Risk (12%)'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">
                      {s.level === 'BEGINNER' ? 'Variables, Conditional Logic' : s.level === 'INTERMEDIATE' ? 'Recursion, Big O Analysis' : 'Optimization Algorithms'}
                    </td>
                    <td className="py-3 text-slate-400">2026-06-18</td>
                    <td className="py-3">
                      <button className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg">Trigger AI Nudge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 6. Progress Monitoring
  const renderProgressMonitoring = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Track Student Progress & Completion Reports</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Course Progress</th>
                  <th className="pb-3">Attendance Rate</th>
                  <th className="pb-3">Total Learning Hours</th>
                  <th className="pb-3">Completion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="font-bold text-xs text-slate-650">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-600">{s.attendance}</td>
                    <td className="py-3.5 font-bold text-indigo-700">{s.hours} hrs</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        s.progress >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.progress >= 90 ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Attendance & Learning Hours Trends</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="AI_Requests" name="AI Interactions" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Courses" name="New courses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // 7. Task & Assignment Management
  const renderTasksAndAssignments = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-slate-800">Assignments & Grading Dashboard</h4>
          <button className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1">
            <Plus size={14} /> Create Assignment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Title</th>
                <th className="pb-3">Course</th>
                <th className="pb-3">Submissions</th>
                <th className="pb-3">Grading status</th>
                <th className="pb-3">Deadline</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 font-bold text-slate-800">{t.title}</td>
                  <td className="py-3.5 text-slate-600">{t.course}</td>
                  <td className="py-3.5 font-bold text-indigo-700">{t.submissions}</td>
                  <td className="py-3.5 font-semibold text-emerald-600">{t.graded} graded</td>
                  <td className="py-3.5 text-slate-400">{t.deadline}</td>
                  <td className="py-3.5 text-right">
                    <button className="text-xs font-bold text-blue-650 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg">Grade Work</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 8. Certification Management
  const renderCertificates = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-slate-800">Certification Center</h4>
          <button className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1">
            <Plus size={14} /> New Certificate Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Certificate ID</th>
                <th className="pb-3">Recipient</th>
                <th className="pb-3">Course</th>
                <th className="pb-3">Issue Date</th>
                <th className="pb-3">Template</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {certificates.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-semibold text-indigo-600">{c.id}</td>
                  <td className="py-3 font-semibold text-slate-800">{c.recipient}</td>
                  <td className="py-3 text-slate-655">{c.course}</td>
                  <td className="py-3 text-slate-400">{c.issueDate}</td>
                  <td className="py-3 font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded max-w-fit block mt-1">{c.template}</td>
                  <td className="py-3 text-right space-x-2">
                    <button className="text-xs font-bold text-blue-650">Verify</button>
                    <button className="text-xs font-bold text-slate-600">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 9. Content Management System (CMS)
  const renderCMS = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-slate-800">Content Management (CMS)</h4>
          <button className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1">
            <Plus size={14} /> Add Content Post
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Title</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {blogs.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-800">{b.title}</td>
                  <td className="py-3 text-slate-600">{b.author}</td>
                  <td className="py-3 text-slate-500">{b.category}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      b.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{b.status}</span>
                  </td>
                  <td className="py-3 text-slate-400">{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 10. AI Model Management
  const renderAIModelSettings = () => {
    if (!modelSettings) {
      return <p className="text-slate-500">Loading AI settings…</p>;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">AI Model & Settings Management</h4>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSaveSettings(); }}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Model Selection</label>
              <select className="input" value={modelSettings.activeModel} onChange={e => setModelSettings({ ...modelSettings, activeModel: e.target.value })}>
                <option value="gpt-4-turbo-preview">gpt-4-turbo-preview</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fallback Model Selection</label>
              <select className="input" value={modelSettings.fallbackModel} onChange={e => setModelSettings({ ...modelSettings, fallbackModel: e.target.value })}>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">AI Prompt System Template</label>
              <textarea className="input min-h-[100px] text-xs font-mono py-2" value={modelSettings.promptTemplate} onChange={e => setModelSettings({ ...modelSettings, promptTemplate: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Temperature</label>
                <input type="number" step="0.1" max="1" min="0" className="input" value={modelSettings.temperature} onChange={e => setModelSettings({ ...modelSettings, temperature: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Tokens Limit</label>
                <input type="number" className="input" value={modelSettings.maxTokens} onChange={e => setModelSettings({ ...modelSettings, maxTokens: parseInt(e.target.value) })} />
              </div>
            </div>
            <button type="submit" disabled={savingSettings} className="w-full btn btn-primary py-2.5 rounded-xl font-bold disabled:opacity-50">
              {savingSettings ? 'Saving…' : 'Apply Model settings'}
            </button>
          </form>
        </div>

        {/* AI Usage Analytics & logs */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Usage Analytics</span>
            <div className="h-[140px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="AI_Requests" name="Tokens (k)" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl max-h-[220px] overflow-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Feedback & Trace Logs</span>
            <div className="space-y-3 mt-3">
              {aiLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No AI chat logs yet.</p>
              ) : (
                aiLogs.map((log, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 font-mono text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-400 border-b border-slate-100 pb-1">
                      <span>{log.timestamp}</span>
                      <span className="text-emerald-600 font-bold">{log.status}</span>
                    </div>
                    <p className="text-slate-800 leading-normal"><strong>{log.student}:</strong> "{log.query}"</p>
                    <p className="text-slate-500"><strong>Tokens:</strong> {log.tokens}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 11. Reports & Insights
  const renderReports = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl max-w-md">
        <h4 className="text-lg font-bold text-slate-800 mb-2">Compile Platform Reports</h4>
        <p className="text-sm text-slate-500 mb-6">Download aggregated statistics and charts compiled for administrative audit.</p>
        <form onSubmit={e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Report Type</label>
            <select className="input">
              <option>Student Performance Reports</option>
              <option>Course Engagement Reports</option>
              <option>Assessment Scores Distribution</option>
              <option>AI Workspace Activity Reports</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Export Format</label>
            <select className="input">
              <option>PDF Document</option>
              <option>Excel Worksheet (XLSX)</option>
              <option>CSV Raw Data</option>
            </select>
          </div>
          <button className="w-full btn btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
            <HardDriveDownload size={16} /> Compile and Download
          </button>
        </form>
      </div>
    );
  };

  // 12. Notifications Center
  const renderNotifications = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl max-w-lg">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Send Broadcast Notification</h4>
        <form onSubmit={e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Broadcast Medium</label>
            <select className="input">
              <option>Platform In-App Alert</option>
              <option>Email Broadcast (Send to all users)</option>
              <option>Course Announcement (Specify course)</option>
              <option>Assignment Reminder</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
            <input type="text" className="input" placeholder="e.g. Schedule Update" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message body</label>
            <textarea className="input min-h-[120px] py-2" placeholder="Write message..." required />
          </div>
          <button className="w-full btn btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5">
            <Send size={14} /> Send Broadcast
          </button>
        </form>
      </div>
    );
  };

  // 13. Support & Feedback
  const renderSupport = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Student Queries & Sentiment Analysis</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3">Ticket ID</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Issue Details</th>
                  <th className="pb-3">AI Sentiment Analysis</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {support.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-semibold text-indigo-600">{s.id}</td>
                    <td className="py-3 font-semibold text-slate-800">{s.user}</td>
                    <td className="py-3 text-slate-655 max-w-xs truncate">{s.message}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        s.sentiment === 'Frustrated' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.sentiment === 'Frustrated' ? '😠 Frustrated' : '😐 Neutral'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{s.status}</span>
                    </td>
                    <td className="py-3 text-right">
                      {s.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolveTicket(s.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 14. Settings
  const renderSettings = () => {
    return (
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl max-w-xl">
        <h4 className="text-lg font-bold text-slate-800 mb-6">Global Settings</h4>
        <form onSubmit={e => e.preventDefault()} className="space-y-6">
          {/* Security */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2"><Shield size={16} /> Security Settings</h5>
            <div className="flex items-center justify-between py-1 text-sm font-semibold text-slate-700">
              <span>Enable Two-Factor Authentication</span>
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
            </div>
            <div className="flex items-center justify-between py-1 text-sm font-semibold text-slate-700">
              <span>Restrict registration domains</span>
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
            </div>
          </div>

          {/* API Keys */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2"><Key size={16} /> API Keys</h5>
            <div>
              <label className="block text-xs font-semibold text-slate-655 mb-1">OpenAI API Key</label>
              <input type="password" value="••••••••••••••••••••••••••••" className="input" disabled />
            </div>
          </div>

          {/* Backup */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2"><HardDriveDownload size={16} /> Backup & Restore</h5>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors">Export Backup</button>
              <button className="flex-1 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors">Restore Point</button>
            </div>
          </div>

          <button type="submit" className="w-full btn btn-primary py-2.5 rounded-xl font-bold">Apply System Settings</button>
        </form>
      </div>
    );
  };

  const renderRuntimeMetrics = () => {
    return (
      <div className="space-y-6">
        {(error || actionError || metricsError) && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
            {actionError || error || metricsError}
          </div>
        )}
        <RuntimeMetrics
          metrics={metrics}
          loading={metricsLoading}
          onRefresh={refetchMetrics}
          onReset={resetMetrics}
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50/50">
      {/* Sidebar */}
      <div className="w-[280px] bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0 border-r border-slate-800 shadow-2xl relative z-20">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-extrabold text-white text-md shadow-lg shadow-blue-500/20">
              LS
            </div>
            <div>
              <h3 className="font-extrabold text-white tracking-tight leading-tight">LearnSphere</h3>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">System Admin</span>
            </div>
          </div>

          {/* Navigation Menu (14 sections) */}
          <nav className="p-4 space-y-1 flex-1">
            {/* 1. Dashboard Overview */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('dashboard') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Admin Dashboard</span>
            </button>

            {/* 2. User Management */}
            <div>
              <button
                onClick={() => toggleMenu('users')}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span>User Management</span>
                </div>
                {expandedMenus.users ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedMenus.users && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('students') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <GraduationCap size={14} /> Students
                  </button>
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('teachers') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Briefcase size={14} /> Teachers
                  </button>
                  <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('roles') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <ShieldCheck size={14} /> Roles
                  </button>
                </div>
              )}
            </div>

            {/* 3. Course Management */}
            <div>
              <button
                onClick={() => toggleMenu('courses')}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={18} />
                  <span>Course Management</span>
                </div>
                {expandedMenus.courses ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedMenus.courses && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('courses') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <BookOpen size={14} /> Courses
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('categories') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Folders size={14} /> Categories
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('resources') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <FileText size={14} /> Resources
                  </button>
                </div>
              )}
            </div>

            {/* 4. Assessment Management */}
            <div>
              <button
                onClick={() => toggleMenu('assessments')}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={18} />
                  <span>Assessment Management</span>
                </div>
                {expandedMenus.assessments ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedMenus.assessments && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('tests') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <CheckSquare size={14} /> Tests
                  </button>
                  <button
                    onClick={() => setActiveTab('question-bank')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('question-bank') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Database size={14} /> Question Bank
                  </button>
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isTabActive('results') ? 'text-blue-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <FileCheck size={14} /> Results
                  </button>
                </div>
              )}
            </div>

            {/* 5. AI Analytics Center */}
            <button
              onClick={() => setActiveTab('ai-performance')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('ai-performance') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain size={18} />
              <span>AI Analytics Center</span>
            </button>

            {/* 6. Progress Monitoring */}
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('progress') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp size={18} />
              <span>Progress Monitoring</span>
            </button>

            {/* 7. Task & Assignment */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('tasks') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList size={18} />
              <span>Tasks & Assignments</span>
            </button>

            {/* 8. Certification Management */}
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('certificates') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award size={18} />
              <span>Certification Center</span>
            </button>

            {/* 9. CMS */}
            <button
              onClick={() => setActiveTab('cms')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('cms') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet size={18} />
              <span>Content Manager (CMS)</span>
            </button>

            {/* 10. AI Model Management */}
            <button
              onClick={() => setActiveTab('ai-model-settings')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('ai-model-settings') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={18} />
              <span>AI Model Settings</span>
            </button>

            {/* 11. Reports & Insights */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('reports') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={18} />
              <span>Reports & Insights</span>
            </button>

            {/* 12. Notifications Center */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('notifications') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell size={18} />
              <span>Notifications Center</span>
            </button>

            {/* 13. Support & Feedback */}
            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('support') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle size={18} />
              <span>Support & Feedback</span>
            </button>

            {/* 14. Runtime Metrics */}
            <button
              onClick={() => setActiveTab('runtime')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('runtime') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={18} />
              <span>Runtime Metrics</span>
            </button>

            {/* 15. Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isTabActive('settings') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings size={18} />
              <span>Global Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${live ? 'text-emerald-400 bg-slate-800/40' : 'text-amber-400 bg-slate-800/40'}`}>
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{live ? 'Live — realtime sync' : 'Reconnecting…'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800/60 transition-all"
          >
            <LogOut size={16} />
            <span>Logout Account</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto relative flex flex-col">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.012] pointer-events-none"></div>

        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/50 px-6 md:px-8 flex justify-between items-center bg-white/40 backdrop-blur-md sticky top-0 z-15">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace(/-/g, ' ')}</h1>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white/70 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">{user?.firstName || 'System'} {user?.lastName || 'Admin'}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Administrator</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md ring-2 ring-white">
              {user?.firstName?.slice(0, 1) || 'A'}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-6 md:p-8 flex-1 relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
              <RefreshCw size={20} className="animate-spin" />
              Loading live admin data…
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
