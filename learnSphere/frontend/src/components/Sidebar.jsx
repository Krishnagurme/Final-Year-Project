import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Home,
  PlusCircle,
  Users,
  TrendingUp,
  Cpu,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { userService, aiService } from '../services/index.js';
import '../styles/Sidebar.css';

const StudentSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [counts, setCounts] = useState({
    courses: 0,
    assessments: 0,
    certificates: 0,
    aiOnline: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [statsRes, aiRes] = await Promise.allSettled([
          userService.getDashboardStats(),
          aiService.getOverview(),
        ]);

        if (cancelled) return;

        const stats = statsRes.status === 'fulfilled' ? statsRes.value.data?.data : null;
        const enrolled = stats?.enrolledCourses || [];
        const certs = enrolled.filter(
          course =>
            course.certificateEligible ||
            (course.progress || 0) >= 100 ||
            course.certificateObtained
        ).length;
        const aiOk =
          aiRes.status === 'fulfilled' && aiRes.value?.status === 200 && aiRes.value?.data != null;

        setCounts({
          courses: enrolled.length,
          assessments: stats?.completedAssessments ?? 0,
          certificates: certs,
          aiOnline: aiOk,
        });
      } catch {
        if (!cancelled) {
          setCounts({ courses: 0, assessments: 0, certificates: 0, aiOnline: false });
        }
      }
    };

    load();
    const timer = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard', badge: null },
    {
      icon: BookOpen,
      label: 'My Courses',
      path: '/student/courses',
      badge: counts.courses > 0 ? counts.courses : null,
    },
    {
      icon: Zap,
      label: 'AI Assessment',
      path: '/student/assessment',
      badge: counts.assessments > 0 ? counts.assessments : null,
    },
    { icon: BarChart3, label: 'Progress', path: '/student/progress', badge: null },
    {
      icon: Home,
      label: 'Certificates',
      path: '/student/certificates',
      badge: counts.certificates > 0 ? counts.certificates : null,
    },
    { icon: CheckSquare, label: 'Tasks', path: '/student/todos', badge: null },
    { icon: FileText, label: 'Notes', path: '/student/notes', badge: null },
    {
      icon: Cpu,
      label: 'AI Workspace',
      path: '/ai/workspace',
      badge: counts.aiOnline === true ? '●' : counts.aiOnline === false ? '!' : null,
      badgeTitle:
        counts.aiOnline === true ? 'Service reachable' : counts.aiOnline === false ? 'Service offline' : '',
    },
  ];

  const isActive = path => location.pathname === path;

  return (
    <div className={`student-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3 className="text-lg font-bold text-blue-600">LearnSphere</h3>
        {isOpen && (
          <button onClick={onClose} className="close-btn md:hidden">
            ×
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.badgeTitle || undefined}
              className={`nav-item justify-between w-full ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon size={20} />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge != null && item.badge !== '' && (
                <span
                  className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                    item.badge === '●'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.badge === '!'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/student/profile" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button onClick={() => dispatch(logout())} className="nav-item logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
export { StudentSidebar };
