import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/Layout.jsx';
import { assessmentService, courseService, userService } from '../services/index.js';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  ClipboardList,
  FileText,
  ListChecks,
  TrendingUp,
} from 'lucide-react';

const VIEW_KEYS = ['assessment', 'results', 'logs', 'reports'];

const normalizeView = raw => (VIEW_KEYS.includes(raw) ? raw : 'results');

const getViewFromSearch = search => {
  const value = new URLSearchParams(search).get('view');
  return normalizeView(value);
};

const getSubjectFromSearch = search => {
  const value = new URLSearchParams(search).get('subject');
  return value ? String(value).trim() : '';
};

const formatDateTime = value => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const formatDate = value => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const AIAssessmentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [stage, setStage] = useState('subject');
  const [activeView, setActiveView] = useState(getViewFromSearch(location.search));
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [autoOpenedSubject, setAutoOpenedSubject] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [assessmentLogs, setAssessmentLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [priorWeakTopics, setPriorWeakTopics] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [prerequisiteResults, setPrerequisiteResults] = useState([]);

  const syncViewFromUrl = () => {
    const next = getViewFromSearch(location.search);
    setActiveView(next);
  };

  useEffect(syncViewFromUrl, [location.search]);

  const updateView = viewKey => {
    const view = normalizeView(viewKey);
    const params = new URLSearchParams(location.search);
    params.set('view', view);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    setActiveView(view);
    if (stage !== 'subject') {
      setStage('subject');
    }
  };

  const loadAssessmentData = async () => {
    setSubjectsLoading(true);
    try {
      const [statsRes, courseRes, logsRes, analyticsRes, prereqRes] = await Promise.allSettled([
        userService.getDashboardStats(),
        courseService.getAllCourses({ limit: 100 }),
        assessmentService.getMyAssessments(),
        assessmentService.getAnalytics(),
        courseService.getPrerequisiteResults(),
      ]);

      const stats = statsRes.status === 'fulfilled' ? statsRes.value.data?.data : null;
      const courses = courseRes.status === 'fulfilled' ? courseRes.value.data?.data || [] : [];
      const logs = logsRes.status === 'fulfilled' ? logsRes.value.data?.data || [] : [];
      const analyticsPayload =
        analyticsRes.status === 'fulfilled' ? analyticsRes.value.data?.data || null : null;
      const prereqData = prereqRes.status === 'fulfilled' ? prereqRes.value.data?.data || [] : [];

      const historyRows = (stats?.assessmentHistory || [])
        .map((item, index) => ({
          id: `${item.completedAt || Date.now()}-${index}`,
          subject: item.subject || 'General',
          level: item.skillLevel || '-',
          score: Number(item.score) || 0,
          date: item.completedAt,
          weakTopics: Array.isArray(item.weakTopics) ? item.weakTopics : [],
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setAssessmentHistory(historyRows);

      const titles = new Set();
      historyRows.forEach(item => {
        if (item.subject) titles.add(String(item.subject).trim());
      });
      // Only include enrolled courses, not all available courses
      (stats?.enrolledCourses || []).forEach(item => {
        if (item.title) titles.add(String(item.title).trim());
      });

      setAvailableSubjects(
        [...titles].sort((a, b) => a.localeCompare(b)).map(name => ({
          name,
          icon: 'Topic',
          description: 'Generated from your enrolled courses and assessment history',
        }))
      );
      setAssessmentLogs(logs);
      setAnalytics(analyticsPayload);
      setPrerequisiteResults(prereqData);
    } catch (loadError) {
      console.error('Error loading assessment data:', loadError);
      setAvailableSubjects([]);
      setAssessmentHistory([]);
      setAssessmentLogs([]);
      setAnalytics(null);
      setPrerequisiteResults([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentData();
  }, []);

  useEffect(() => {
    const requestedSubject = getSubjectFromSearch(location.search);
    if (!requestedSubject) return;
    if (subjectsLoading) return;
    if (activeView !== 'assessment') return;
    if (stage !== 'subject') return;
    if (autoOpenedSubject === requestedSubject) return;

    setAutoOpenedSubject(requestedSubject);
    handleSubjectSelect(requestedSubject);
  }, [location.search, subjectsLoading, activeView, stage, autoOpenedSubject]);

  const handleSubjectSelect = async subject => {
    setSelectedSubject(subject);
    setLoading(true);
    setError('');
    try {
      const response = await assessmentService.generateTest(subject, { numberOfQuestions: 5 });
      const data = response.data?.data;
      if (!data || !Array.isArray(data.questions)) {
        throw new Error('Invalid test response received');
      }

      setPriorWeakTopics(data.personalization?.weakTopicsFromPriorAssessments || []);
      setQuizQuestions(data.questions);
      setStage('quiz');
      setAnswers({});
    } catch (requestError) {
      setError('Failed to generate test. Please try again.');
      console.error('Error generating test:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(current => ({
      ...current,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const answersWithMetadata = quizQuestions.map(question => ({
        questionId: question.id,
        question: question.question,
        topic: question.topic,
        studentAnswer: answers[question.id],
        correctAnswer: question.correctAnswer,
        isCorrect: answers[question.id] === question.correctAnswer,
      }));

      const evaluation = await assessmentService.evaluatePrerequisites({
        answers: answersWithMetadata,
        subject: selectedSubject,
        courseLevel: 'INTERMEDIATE',
      });

      const evalPayload = evaluation.data;
      const missedTopics = answersWithMetadata
        .filter(item => !item.isCorrect)
        .map(item => item.topic)
        .filter(Boolean);
      const weakTopics = [...new Set([...(evalPayload.weaknesses || []), ...missedTopics])];

      await userService.updateAssessmentProgress({
        subject: selectedSubject,
        score: evalPayload.score,
        skillLevel: evalPayload.recommendedLevel,
        timeSpent: 15,
        weakTopics,
        strengths: evalPayload.strengths || [],
      });

      setResults({
        ...evalPayload,
        subject: selectedSubject,
        totalQuestions: quizQuestions.length,
        correctAnswers: answersWithMetadata.filter(item => item.isCorrect).length,
        timestamp: new Date().toLocaleString(),
      });
      setStage('results');
      await loadAssessmentData();
    } catch (submitError) {
      setError(`Error evaluating assessment: ${submitError.message}`);
      console.error('Evaluation error:', submitError);
    } finally {
      setLoading(false);
    }
  };

  const reportData = useMemo(() => {
    const fromHistory = assessmentHistory;
    const total = fromHistory.length;
    const avgScore =
      total > 0 ? Math.round(fromHistory.reduce((sum, item) => sum + item.score, 0) / total) : 0;
    const highest = total > 0 ? Math.max(...fromHistory.map(item => item.score)) : 0;

    const subjectMap = {};
    for (const row of fromHistory) {
      const key = row.subject || 'General';
      if (!subjectMap[key]) {
        subjectMap[key] = { scores: [], weakTopics: [] };
      }
      subjectMap[key].scores.push(row.score);
      subjectMap[key].weakTopics.push(...row.weakTopics);
    }

    const subjectRows = Object.entries(subjectMap)
      .map(([subject, value]) => {
        const average = Math.round(
          value.scores.reduce((sum, score) => sum + score, 0) / value.scores.length
        );
        const weakTopicCounts = {};
        value.weakTopics.forEach(topic => {
          const normalized = String(topic).trim();
          if (!normalized) return;
          weakTopicCounts[normalized] = (weakTopicCounts[normalized] || 0) + 1;
        });
        const topWeakTopics = Object.entries(weakTopicCounts)
          .sort((left, right) => right[1] - left[1])
          .slice(0, 3)
          .map(item => item[0]);

        return {
          subject,
          attempts: value.scores.length,
          average,
          topWeakTopics,
        };
      })
      .sort((left, right) => right.attempts - left.attempts);

    return {
      total,
      avgScore,
      highest,
      analytics: analytics || {},
      subjects: subjectRows,
    };
  }, [assessmentHistory, analytics]);

  const latestResult = assessmentHistory[0] || null;

  const renderViewTabs = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button
        onClick={() => updateView('assessment')}
        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          activeView === 'assessment'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        Assessment
      </button>
      <button
        onClick={() => updateView('results')}
        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          activeView === 'results'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        Results
      </button>
      <button
        onClick={() => updateView('logs')}
        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          activeView === 'logs'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        Logs
      </button>
      <button
        onClick={() => updateView('reports')}
        className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          activeView === 'reports'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        Reports
      </button>
    </div>
  );

  const renderSubjectSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Brain className="text-blue-600" size={56} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Enrolled Subjects</h1>
        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
          View your enrolled courses and their prerequisite quiz status.
        </p>
      </div>

      {subjectsLoading ? (
        <div className="text-center py-12 text-gray-600">Loading subjects...</div>
      ) : availableSubjects.length === 0 ? (
        <div className="card text-center py-12 max-w-xl mx-auto">
          <p className="text-gray-700 mb-4">
            No enrolled courses yet. Enroll in a course to see it here.
          </p>
          <Link to="/student/courses" className="btn btn-primary inline-block">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableSubjects.map(subject => {
            const prereqResult = prerequisiteResults.find(r => r.courseTitle === subject.name);
            return (
              <div
                key={subject.name}
                className="card"
              >
                <div className="text-sm mb-3 text-blue-700 font-semibold">{subject.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                {prereqResult ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Prerequisite Quiz</span>
                      <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className="text-lg font-bold text-gray-900">{prereqResult.score}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Level</span>
                      <span className="text-sm font-semibold text-purple-600">{prereqResult.knowledgeLevel}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                      Prerequisite quiz not completed
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderResultsView = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <ListChecks className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Latest AI assessment result</h2>
        </div>
        {!latestResult ? (
          <p className="text-gray-600">No AI assessment result yet. Take your first assessment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Subject</p>
              <p className="text-lg font-bold text-gray-900">{latestResult.subject}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-lg font-bold text-gray-900">{latestResult.score}%</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-lg font-bold text-gray-900">{latestResult.level}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(latestResult.date)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Prerequisite quiz results (Enrolled courses)</h2>
        </div>
        {prerequisiteResults.length === 0 ? (
          <p className="text-gray-600">No prerequisite quiz results yet. Enroll in a course and complete the prerequisite quiz.</p>
        ) : (
          <div className="space-y-3">
            {prerequisiteResults.map(row => (
              <div
                key={row.courseId}
                className="rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{row.courseTitle}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(row.completedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">
                    {row.knowledgeLevel}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{row.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">All AI assessment results</h2>
        </div>
        {assessmentHistory.length === 0 ? (
          <p className="text-gray-600">No completed AI assessments yet.</p>
        ) : (
          <div className="space-y-3">
            {assessmentHistory.map(row => (
              <div
                key={row.id}
                className="rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{row.subject}</p>
                  <p className="text-sm text-gray-600">{formatDateTime(row.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                    {row.level}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{row.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLogsView = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Assessment logs</h2>
        </div>
        {assessmentHistory.length === 0 ? (
          <p className="text-gray-600">No assessment logs available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Subject</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Level</th>
                  <th className="py-3 pr-4">Weak topics</th>
                </tr>
              </thead>
              <tbody>
                {assessmentHistory.map(row => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-700">{formatDateTime(row.date)}</td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">{row.subject}</td>
                    <td className="py-3 pr-4 text-gray-900">{row.score}%</td>
                    <td className="py-3 pr-4 text-gray-900">{row.level}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {row.weakTopics.length > 0 ? row.weakTopics.join(', ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Stored assessment attempts</h2>
        </div>
        {assessmentLogs.length === 0 ? (
          <p className="text-gray-600">No persisted attempts found in assessment storage yet.</p>
        ) : (
          <div className="space-y-3">
            {assessmentLogs.map(log => (
              <div
                key={log._id}
                className="rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{log.type || 'Assessment'}</p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(log.createdAt)} | Status: {log.status || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-lg font-bold text-gray-900">{Math.round(log.score || 0)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total assessments</p>
          <p className="text-3xl font-bold text-gray-900">{reportData.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Average score</p>
          <p className="text-3xl font-bold text-gray-900">{reportData.avgScore}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Highest score</p>
          <p className="text-3xl font-bold text-gray-900">{reportData.highest}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Recent assessments</p>
          <p className="text-3xl font-bold text-gray-900">
            {reportData.analytics.recentAssessments?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Subject performance report</h2>
        </div>
        {reportData.subjects.length === 0 ? (
          <p className="text-gray-600">No subject report yet. Take an assessment to generate one.</p>
        ) : (
          <div className="space-y-4">
            {reportData.subjects.map(row => (
              <div key={row.subject} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">{row.subject}</h3>
                  <p className="text-sm text-gray-600">
                    Attempts: {row.attempts} | Avg score: {row.average}%
                  </p>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.min(100, row.average)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Weak-focus topics:{' '}
                  <span className="font-medium text-gray-900">
                    {row.topWeakTopics.length ? row.topWeakTopics.join(', ') : 'None detected'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {renderViewTabs()}
        {error && (
          <div className="bg-red-50 border-l-4 border-l-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {activeView === 'assessment' && renderSubjectSelection()}
        {activeView === 'results' && renderResultsView()}
        {activeView === 'logs' && renderLogsView()}
        {activeView === 'reports' && renderReportsView()}
      </div>
    </StudentLayout>
  );
};

export default AIAssessmentPage;
