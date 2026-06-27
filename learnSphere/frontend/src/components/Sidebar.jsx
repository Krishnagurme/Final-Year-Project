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
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { userService, aiService } from '../services/index.js';
import '../styles/Sidebar.css';

const StudentSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <div 
      className={`student-sidebar ${isOpen ? 'open' : ''} bg-white/80 backdrop-blur-2xl flex flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50`}
      style={{ width: isCollapsed ? '88px' : '240px', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Floating Toggle Button for desktop */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="hidden md:flex absolute -right-3 top-6 p-1.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all z-50"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Close button for mobile */}
      {isOpen && (
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-50">
          <X size={20} />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : item.badgeTitle || undefined}
              className={`relative flex items-center justify-between px-3 py-3 mx-1 rounded-xl transition-all duration-300 group overflow-hidden
                ${active 
                  ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/50 text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                ${isCollapsed ? 'justify-center px-0 mx-2' : ''}`}
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 rounded-r-full transition-all duration-300 bg-blue-600 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-blue-300'}`}></div>

              <div className={`flex items-center gap-3.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : 'ml-2'}`}>
                <Icon size={20} className={`shrink-0 transition-transform duration-300 ${active ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-blue-500 group-hover:scale-110'}`} />
                {!isCollapsed && (
                  <span className={`truncate transition-colors ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                )}
              </div>
              
              {!isCollapsed && item.badge != null && item.badge !== '' && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm
                    ${item.badge === '●'
                      ? 'bg-emerald-100 text-emerald-600 border border-emerald-200/50'
                      : item.badge === '!'
                        ? 'bg-amber-100 text-amber-600 border border-amber-200/50'
                        : 'bg-blue-100 text-blue-600 border border-blue-200/50'
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`mt-auto p-4 border-t border-gray-100/60 flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
        <Link 
          to="/student/profile" 
          className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all group ${isCollapsed ? 'justify-center w-full' : ''}`}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings size={20} className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-90 duration-500" />
          {!isCollapsed && <span className="font-medium">Settings</span>}
        </Link>
        <button 
          onClick={() => dispatch(logout())} 
          className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-all group w-full ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="shrink-0 text-red-400 group-hover:text-red-600 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};
export { StudentSidebar };
