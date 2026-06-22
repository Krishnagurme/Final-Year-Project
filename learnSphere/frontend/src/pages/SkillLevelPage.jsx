import React, { useEffect, useState, useMemo } from 'react';
import { StudentLayout } from '../components/Layout.jsx';
import { userService } from '../services/index.js';
import { TrendingUp, Award, Target, BookOpen, Clock, Star, Zap } from 'lucide-react';
import SkillBadge from '../components/SkillBadge.jsx';

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

function xpFromStats(stats) {
  const hours = Number(stats?.hoursLearned) || 0;
  const assessments = stats?.completedAssessments || 0;
  const coursesDone = stats?.completedCourses || 0;
  return Math.min(99999, Math.round(hours * 12 + assessments * 150 + coursesDone * 400));
}

function nextXpThreshold(currentLevel, totalXP) {
  if (currentLevel === 'BEGINNER') return Math.max(1500, totalXP + 400);
  if (currentLevel === 'INTERMEDIATE') return Math.max(4500, totalXP + 600);
  return Math.max(totalXP + 800, 10000);
}

function subjectRowsFromHistory(history) {
  const by = {};
  for (const h of history || []) {
    const sub = h.subject || 'General';
    if (!by[sub]) by[sub] = { scores: [], levels: [] };
    const sc = Number(h.score);
    if (!Number.isNaN(sc)) by[sub].scores.push(sc);
    if (h.skillLevel) by[sub].levels.push(h.skillLevel);
  }
  return Object.entries(by)
    .map(([name, v]) => {
      const avg = v.scores.length ? v.scores.reduce((a, b) => a + b, 0) / v.scores.length : 0;
      let level = 'BEGINNER';
      if (avg >= 71) level = 'ADVANCED';
      else if (avg >= 41) level = 'INTERMEDIATE';
      return { name, level, progress: Math.round(avg) };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 12);
}

function buildRuntimeAchievements(stats) {
  const rows = [];
  const h = stats?.assessmentHistory || [];
  if (h.length >= 1) {
    rows.push({
      title: 'Assessment starter',
      description: 'You completed at least one AI assessment.',
      icon: Star,
      tone: 'yellow',
    });
  }
  if ((stats?.completedCourses || 0) >= 1) {
    rows.push({
      title: 'Course complete',
      description: 'Finished at least one enrolled course.',
      icon: Award,
      tone: 'blue',
    });
  }
  if ((stats?.hoursLearned || 0) >= 5) {
    rows.push({
      title: 'Time invested',
      description: 'Logged five or more learning hours.',
      icon: TrendingUp,
      tone: 'green',
    });
  }
  if (rows.length === 0) {
    rows.push({
      title: 'Next step',
      description: 'Take an assessment or enroll in a course to build your profile.',
      icon: Target,
      tone: 'blue',
    });
  }
  return rows;
}

const SkillLevelPage = () => {
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
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Failed to load skills');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const model = useMemo(() => {
    if (!stats) {
      return {
        currentLevel: 'BEGINNER',
        totalXP: 0,
        nextLevelXP: 1500,
        completedCourses: 0,
        totalCourses: 0,
        hoursLearned: 0,
        streak: 0,
        achievements: 0,
        skills: [],
        achievementRows: [],
      };
    }
    const currentLevel = stats.skillLevel || 'BEGINNER';
    const totalXP = xpFromStats(stats);
    const nextLevelXP = nextXpThreshold(currentLevel, totalXP);
    const skills = subjectRowsFromHistory(stats.assessmentHistory);
    const achievementRows = buildRuntimeAchievements(stats);
    return {
      currentLevel,
      totalXP,
      nextLevelXP,
      completedCourses: stats.completedCourses || 0,
      totalCourses: stats.totalCourses || 0,
      hoursLearned: Number(stats.hoursLearned) || 0,
      streak: streakFromAssessmentHistory(stats.assessmentHistory),
      achievements: achievementRows.length,
      skills,
      achievementRows,
    };
  }, [stats]);

  const xpPercent = Math.min(100, Math.round((model.totalXP / model.nextLevelXP) * 100));

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600">Loading your skill data…</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-gray-900">Your skill level</h1>
          <p className="mt-2 text-gray-600">Derived from your live enrollments and assessments.</p>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Current level</h2>
              <p className="mt-1 text-gray-600">XP bar is estimated from hours, courses, and quizzes.</p>
            </div>
            <SkillBadge level={model.currentLevel} size="xl" />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>{model.totalXP} XP</span>
              <span>{model.nextLevelXP} XP target</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-600">
              {Math.max(0, model.nextLevelXP - model.totalXP)} XP to next target
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{model.completedCourses}</p>
              <p className="text-sm text-gray-600">Courses completed</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">
                {model.hoursLearned.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <p className="text-sm text-gray-600">Hours learned</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 text-center">
              <Zap className="mx-auto mb-2 h-8 w-8 text-orange-600" />
              <p className="text-2xl font-bold text-gray-900">{model.streak}</p>
              <p className="text-sm text-gray-600">Day streak (assessments)</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <Award className="mx-auto mb-2 h-8 w-8 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{stats?.completedAssessments ?? 0}</p>
              <p className="text-sm text-gray-600">Assessments</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Subject mix (from assessments)</h2>
          {model.skills.length === 0 ? (
            <p className="text-gray-600">Complete an AI assessment to see per-subject strength here.</p>
          ) : (
            <div className="space-y-4">
              {model.skills.map(skill => (
                <div key={skill.name} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                      <span
                        className={`ml-3 rounded-full px-2 py-1 text-xs font-medium ${
                          skill.level === 'ADVANCED'
                            ? 'bg-purple-100 text-purple-800'
                            : skill.level === 'INTERMEDIATE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {skill.level}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">Avg. score {skill.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        skill.level === 'ADVANCED'
                          ? 'bg-purple-600'
                          : skill.level === 'INTERMEDIATE'
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(100, skill.progress)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Milestones</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {model.achievementRows.map((row, idx) => {
              const Icon = row.icon;
              const border =
                row.tone === 'yellow'
                  ? 'border-yellow-200 bg-yellow-50'
                  : row.tone === 'green'
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50';
              const iconColor =
                row.tone === 'yellow' ? 'text-yellow-600' : row.tone === 'green' ? 'text-green-600' : 'text-blue-600';
              return (
                <div key={idx} className={`flex items-center rounded-lg border p-4 ${border}`}>
                  <Icon className={`mr-3 h-8 w-8 ${iconColor}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{row.title}</p>
                    <p className="text-sm text-gray-600">{row.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default SkillLevelPage;
