import React, { useEffect, useState, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { userService } from '../services/index.js';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

function streakFromAssessmentHistory(history) {
  if (!history?.length) return 0;
  const days = new Set();
  for (const h of history) {
    const d = new Date(h.completedAt);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      days.add(d.getTime());
    }
  }
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.getTime())) streak += 1;
    else break;
  }
  return streak;
}

function buildAchievements(stats) {
  const out = [];
  const h = stats?.assessmentHistory || [];
  const enrolled = stats?.enrolledCourses || [];
  if (h.length >= 1) {
    out.push({
      id: 'a1',
      title: 'First assessment',
      description: 'You completed your first AI assessment.',
      icon: '🎯',
    });
  }
  if (h.length >= 5) {
    out.push({
      id: 'a2',
      title: 'Assessment regular',
      description: 'Five or more assessments completed.',
      icon: '⚡',
    });
  }
  if ((stats?.completedCourses || 0) >= 1) {
    out.push({
      id: 'c1',
      title: 'Course finisher',
      description: 'At least one course marked complete.',
      icon: '🏅',
    });
  }
  if (enrolled.length >= 3) {
    out.push({
      id: 'c2',
      title: 'Explorer',
      description: 'Enrolled in three or more courses.',
      icon: '📚',
    });
  }
  if ((stats?.hoursLearned || 0) >= 10) {
    out.push({
      id: 't1',
      title: 'Dedicated learner',
      description: 'Ten or more hours logged on the platform.',
      icon: '⏱️',
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'placeholder',
      title: 'Keep going',
      description: 'Complete a course or an assessment to unlock achievements.',
      icon: '✨',
    });
  }
  return out;
}

const ProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getDashboardStats();
        if (!cancelled) setStats(res.data?.data || null);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Failed to load progress');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const progressData = useMemo(() => {
    if (!stats) {
      return {
        overallProgress: 0,
        coursesCompleted: 0,
        totalCourses: 0,
        averageScore: 0,
        studyTime: 0,
        streak: 0,
        recentAchievements: [],
      };
    }
    const streak = streakFromAssessmentHistory(stats.assessmentHistory);
    const achievements = buildAchievements(stats);
    return {
      overallProgress: Math.min(100, Math.round(Number(stats.overallProgressPercent) || 0)),
      coursesCompleted: stats.completedCourses || 0,
      totalCourses: stats.totalCourses || 0,
      averageScore: Math.round(Number(stats.averageAssessmentScore) || 0),
      studyTime: Number(stats.hoursLearned) || 0,
      streak,
      recentAchievements: achievements,
    };
  }, [stats]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600">Loading your progress…</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your progress</h1>
          <p className="mt-2 text-gray-600">Live totals from your enrollments and assessments.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall progress</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.overallProgress}%</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses completed</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.coursesCompleted}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours learned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressData.studyTime.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="rounded-lg bg-orange-100 p-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assessment streak</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.streak} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Course completion</h2>
            <span className="text-sm text-gray-600">
              {progressData.coursesCompleted}/{progressData.totalCourses} courses
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-gray-200">
            <div
              className="h-4 rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${
                  progressData.totalCourses > 0
                    ? Math.min(
                        100,
                        (progressData.coursesCompleted / progressData.totalCourses) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Avg. assessment score:{' '}
            <span className="font-semibold text-gray-900">{progressData.averageScore}%</span> (
            {stats?.completedAssessments ?? 0} runs)
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Per-course progress</h2>
          {(stats?.enrolledCourses || []).length === 0 ? (
            <p className="text-sm text-gray-600">Enroll in a course to track topic-level progress here.</p>
          ) : (
            <div className="space-y-4">
              {stats.enrolledCourses.map(course => (
                <div key={course.courseId} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-xs text-gray-500">
                        {course.prerequisiteCompleted
                          ? `Knowledge level: ${course.knowledgeLevel || 'N/A'} · Prerequisite: ${course.prerequisiteScore || 0}%`
                          : 'Prerequisite assessment pending'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        course.status === 'completed'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {course.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Progress</span>
                    <span>{course.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        course.status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                  {course.certificateEligible && !course.certificateObtained && (
                    <p className="text-xs text-emerald-600 font-semibold mt-2">
                      Certificate eligible — claim it from the Certificates page.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Milestones</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {progressData.recentAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center">
                  <span className="mr-3 text-2xl">{achievement.icon}</span>
                  <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProgressPage;
