import React, { useState, useEffect, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { ProgressChart, SkillDistributionChart } from '../components/Charts.jsx';
import CourseCard from '../components/CourseCard.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import GamificationCard from '../components/GamificationCard.jsx';
import { courseService, userService } from '../services/index.js';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, BookOpen, Clock, Zap, ChevronRight } from 'lucide-react';

const emptyStats = {
  skillLevel: 'BEGINNER',
  totalCourses: 0,
  completedCourses: 0,
  completedAssessments: 0,
  hoursLearned: 0,
  averageCourseProgress: 0,
  averageAssessmentScore: 0,
  overallProgressPercent: 0,
  enrolledCourses: [],
  assessmentHistory: [],
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(emptyStats);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsResponse = await userService.getDashboardStats();
      const realStats = statsResponse.data?.data || {};
      setUserStats({
        ...emptyStats,
        ...realStats,
        enrolledCourses: realStats.enrolledCourses || [],
        assessmentHistory: realStats.assessmentHistory || [],
      });

      const coursesResponse = await courseService.getAllCourses({ limit: 6 });
      setCourses(coursesResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setUserStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const progressChart = useMemo(() => {
    const enrolled = userStats.enrolledCourses || [];
    if (enrolled.length > 0) {
      return {
        title: 'Your course progress',
        valueLabel: 'Course progress (%)',
        data: enrolled.slice(0, 8).map((c, i) => {
          const title = c.title || `Course ${i + 1}`;
          const name = title.length > 22 ? `${title.slice(0, 20)}…` : title;
          return {
            name,
            progress: Math.min(100, Math.round(Number(c.progress) || 0)),
          };
        }),
      };
    }

    const hist = [...(userStats.assessmentHistory || [])].sort(
      (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
    );
    if (hist.length === 0) {
      return {
        title: 'Your activity',
        valueLabel: 'Score (%)',
        data: [{ name: 'Enroll or take an assessment', progress: 0 }],
      };
    }
    return {
      title: 'Assessment scores (chronological)',
      valueLabel: 'Score (%)',
      data: hist.slice(-10).map((a, i) => {
        const raw = a.subject || `Run ${i + 1}`;
        const name = raw.length > 22 ? `${raw.slice(0, 20)}…` : raw;
        return {
          name,
          progress: Math.min(100, Math.round(Number(a.score) || 0)),
        };
      }),
    };
  }, [userStats.enrolledCourses, userStats.assessmentHistory]);

  const skillPieData = useMemo(() => {
    const history = userStats.assessmentHistory || [];
    if (history.length === 0) {
      return [{ name: 'No assessments yet', value: 1 }];
    }
    let low = 0;
    let mid = 0;
    let high = 0;
    for (const h of history) {
      const s = Number(h.score);
      if (Number.isNaN(s)) continue;
      if (s < 41) low += 1;
      else if (s <= 70) mid += 1;
      else high += 1;
    }
    const parts = [];
    if (low) parts.push({ name: 'Scores 0–40%', value: low });
    if (mid) parts.push({ name: 'Scores 41–70%', value: mid });
    if (high) parts.push({ name: 'Scores 71–100%', value: high });
    if (parts.length === 0) {
      return [{ name: 'No numeric scores', value: 1 }];
    }
    return parts;
  }, [userStats.assessmentHistory]);

  const hoursDisplay = Number(userStats.hoursLearned || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(Number(userStats.overallProgressPercent) || 0))
  );

  const metricCards = [
    {
      label: 'Total Courses',
      value: userStats.totalCourses,
      icon: BookOpen,
      iconColor: 'text-blue-600',
      subtitle: 'Open your course catalog',
      onClick: () => navigate('/student/courses'),
    },
    {
      label: 'Completed',
      value: userStats.completedCourses,
      icon: Award,
      iconColor: 'text-green-600',
      subtitle: 'See issued certificates',
      onClick: () => navigate('/student/certificates'),
    },
    {
      label: 'Assessments',
      value: userStats.completedAssessments,
      icon: Zap,
      iconColor: 'text-orange-600',
      subtitle: 'Open assessment reports',
      onClick: () => navigate('/student/assessment?view=reports'),
    },
    {
      label: 'Hours learned',
      value: hoursDisplay,
      icon: Clock,
      iconColor: 'text-yellow-600',
      subtitle: 'View progress logs',
      onClick: () => navigate('/student/progress'),
    },
    {
      label: 'Overall progress',
      value: `${progressPercent}%`,
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      subtitle:
        userStats.enrolledCourses?.length > 0
          ? 'Avg. course completion'
          : userStats.assessmentHistory?.length > 0
            ? 'Avg. assessment score'
            : 'Start learning',
      onClick: () => navigate('/student/progress'),
    },
  ];

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="text-gray-600 mt-2">Continue your learning journey</p>
          </div>
          <SkillBadge level={userStats.skillLevel} size="lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {metricCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={card.onClick}
                className="card text-center hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <Icon className={card.iconColor} size={32} />
                </div>
                <h3 className="text-gray-600 text-sm mb-2">{card.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </button>
            );
          })}
        </div>

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assessment Center</h2>
              <p className="text-gray-600 text-sm mt-1">
                Open assessment, results, logs, and reports directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/student/assessment?view=assessment')}
                className="btn btn-primary"
              >
                Start Assessment
              </button>
              <button
                onClick={() => navigate('/student/assessment?view=results')}
                className="btn btn-secondary"
              >
                Results
              </button>
              <button
                onClick={() => navigate('/student/assessment?view=logs')}
                className="btn btn-secondary"
              >
                Logs
              </button>
              <button
                onClick={() => navigate('/student/assessment?view=reports')}
                className="btn btn-secondary"
              >
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Gamification Card */}
        <GamificationCard />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgressChart
            data={progressChart.data}
            title={progressChart.title}
            valueLabel={progressChart.valueLabel}
          />
          <SkillDistributionChart
            data={skillPieData}
            title="Assessment results (score bands)"
          />
        </div>

        {/* Active Enrolled Courses */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Enrolled Courses</h2>
          {userStats.enrolledCourses.length === 0 ? (
            <div className="card text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-gray-500 font-medium">You are not enrolled in any courses yet.</p>
              <button 
                onClick={() => navigate('/student/courses')} 
                className="btn btn-primary mt-4 mx-auto"
              >
                Browse Course Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userStats.enrolledCourses.map((c) => (
                <div key={c.courseId} className="card flex flex-col justify-between hover:shadow-xl transition-shadow relative overflow-hidden">
                  <div className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 font-bold border-2 border-blue-100 text-lg">
                    {c.title ? c.title.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="pt-10">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-wider">{c.category}</p>
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">{c.shortDescription}</p>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2 mt-6">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Course Progress</span>
                        <span>{c.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      c.status === 'completed' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : !c.prerequisiteCompleted
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {c.status === 'completed'
                        ? 'Completed'
                        : !c.prerequisiteCompleted
                          ? 'Prerequisite Pending'
                          : 'Active'}
                    </span>
                    <button
                      onClick={() => navigate(`/student/courses/${c.courseId}`)}
                      className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      {c.status === 'completed' ? 'Review Syllabus' : 'Resume Learning'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
            <button onClick={() => navigate('/student/courses')} className="btn btn-secondary">
              View all courses
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map(course => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
