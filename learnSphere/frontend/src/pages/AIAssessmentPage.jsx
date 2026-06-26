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
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);

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
    // Refresh data when switching to reports view
    if (view === 'reports') {
      loadAssessmentData();
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
    let interval;
    if (stage === 'quiz' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timer]);

  useEffect(() => {
    const requestedSubject = getSubjectFromSearch(location.search);
    if (!requestedSubject) return;
    if (subjectsLoading) return;
    if (activeView !== 'assessment') return;
    if (stage !== 'subject') return;
    if (autoOpenedSubject === requestedSubject) return;

    setAutoOpenedSubject(requestedSubject);
    handleStartTest(requestedSubject);
  }, [location.search, subjectsLoading, activeView, stage, autoOpenedSubject]);

  const handleStartTest = async subject => {
    setSelectedSubject(subject);
    setLoading(true);
    setError('');
    try {
      const response = await assessmentService.generateTest(subject, { numberOfQuestions: 30 });
      const data = response.data?.data;
      if (!data || !Array.isArray(data.questions)) {
        throw new Error('Invalid test response received');
      }

      setPriorWeakTopics(data.personalization?.weakTopicsFromPriorAssessments || []);
      setQuizQuestions(data.questions);
      setStage('quiz');
      setAnswers({});
      setStartTime(new Date());
      setTimer(30 * 60); // 30 minutes in seconds
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
    setEndTime(new Date());
    
    console.log('Submit button clicked');
    console.log('Current answers state:', answers);
    console.log('Quiz questions:', quizQuestions);
    
    try {
      const answersWithMetadata = quizQuestions.map(question => {
        const studentAnswer = answers[question.id] || answers[question.index];
        console.log(`Question ${question.id}: studentAnswer =`, studentAnswer, 'correctAnswer =', question.correctAnswer);
        
        return {
          questionId: question.id || String(question.index),
          question: question.question,
          topic: question.topic,
          studentAnswer: studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect: studentAnswer === question.correctAnswer,
        };
      });

      console.log('Submitting assessment with answers:', answersWithMetadata);

      const evaluation = await assessmentService.evaluatePrerequisites({
        answers: answersWithMetadata,
        subject: selectedSubject,
        courseLevel: 'INTERMEDIATE',
      });

      console.log('Evaluation response:', evaluation);

      const evalPayload = evaluation.data || evaluation;
      const missedTopics = answersWithMetadata
        .filter(item => !item.isCorrect)
        .map(item => item.topic)
        .filter(Boolean);
      const weakTopics = [...new Set([...(evalPayload.weaknesses || []), ...missedTopics])];

      const timeSpentMinutes = startTime ? Math.round((new Date() - startTime) / 60000) : 0;

      await userService.updateAssessmentProgress({
        subject: selectedSubject,
        score: evalPayload.score,
        skillLevel: evalPayload.recommendedLevel || evalPayload.skillLevel,
        timeSpent: timeSpentMinutes,
        weakTopics,
        strengths: evalPayload.strengths || [],
      });

      setResults({
        ...evalPayload,
        subject: selectedSubject,
        totalQuestions: quizQuestions.length,
        correctAnswers: answersWithMetadata.filter(item => item.isCorrect).length,
        incorrectAnswers: answersWithMetadata.filter(item => !item.isCorrect).length,
        timestamp: new Date().toLocaleString(),
        timeSpent: timeSpentMinutes,
        attemptNumber: attemptNumber,
        answersWithMetadata,
      });
      setStage('results');
      setActiveView('results');
      setAttemptNumber(prev => prev + 1);
      await loadAssessmentData();
    } catch (submitError) {
      setError(`Error evaluating assessment: ${submitError.message}`);
      console.error('Evaluation error:', submitError);
      console.error('Error details:', submitError.response?.data);
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
        <h1 className="text-4xl font-bold text-gray-900">Assessment</h1>
        <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
          Select a subject to start your AI-powered assessment.
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
          {availableSubjects.map(subject => (
            <div key={subject.name} className="card">
              <div className="text-sm mb-3 text-blue-700 font-semibold">{subject.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
              <button
                onClick={() => handleStartTest(subject.name)}
                className="btn btn-primary w-full"
              >
                Start Assessment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuizView = () => {
    const formatTime = seconds => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).length;
    const totalCount = quizQuestions.length;
    const progress = (answeredCount / totalCount) * 100;

    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedSubject} Assessment</h2>
              <p className="text-gray-600">Questions: {totalCount} | Duration: 30 Minutes</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${timer === 0 ? 'text-red-600' : timer < 300 ? 'text-orange-600' : 'text-blue-600'}`}>
                {timer === 0 ? 'Time\'s Up!' : formatTime(timer)}
              </div>
              <p className="text-sm text-gray-600">{timer === 0 ? 'Please submit your answers' : 'Time Remaining'}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${timer === 0 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Answered: {answeredCount}/{totalCount}
          </p>
        </div>

        <div className="space-y-4">
          {quizQuestions.map((question, index) => (
            <div key={question.id} className="card">
              <div className="flex items-start gap-3 mb-4">
                <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{question.question}</p>
                  {question.topic && (
                    <p className="text-sm text-gray-500 mt-1">Topic: {question.topic}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 ml-12">
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      answers[question.id] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setStage('subject');
              setQuizQuestions([]);
              setAnswers({});
              setTimer(0);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={answeredCount < totalCount}
            className="btn btn-primary"
          >
            Submit Assessment
          </button>
        </div>
      </div>
    );
  };

  const renderResultsView = () => {
    if (stage === 'results' && results) {
      const passed = results.score >= 60;
      return (
        <div className="space-y-6">
          <div className="card">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {passed ? (
                  <CheckCircle className="text-green-600" size={64} />
                ) : (
                  <AlertCircle className="text-red-600" size={64} />
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Result</h2>
              <p className="text-gray-600">{results.subject}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-4xl font-bold text-gray-900">{results.score}%</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600">Correct</p>
              <p className="text-4xl font-bold text-green-600">{results.correctAnswers}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600">Incorrect</p>
              <p className="text-4xl font-bold text-red-600">{results.incorrectAnswers}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Passed ✅' : 'Failed ❌'}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Taken</p>
                <p className="text-lg font-bold text-gray-900">{results.timeSpent} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Attempt Number</p>
                <p className="text-lg font-bold text-gray-900">#{results.attemptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Knowledge Level</p>
                <p className="text-lg font-bold text-purple-600">{results.recommendedLevel}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Topic-wise Performance</h3>
            {results.answersWithMetadata && results.answersWithMetadata.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(
                  results.answersWithMetadata.reduce((acc, item) => {
                    const topic = item.topic || 'General';
                    if (!acc[topic]) {
                      acc[topic] = { correct: 0, total: 0 };
                    }
                    acc[topic].total++;
                    if (item.isCorrect) acc[topic].correct++;
                    return acc;
                  }, {})
                ).map(([topic, data]) => {
                  const percentage = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={topic}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{topic}</span>
                        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">No topic data available.</p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setStage('subject');
                setResults(null);
                setQuizQuestions([]);
                setAnswers({});
                setTimer(0);
              }}
              className="btn btn-primary"
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      );
    }

    return (
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
  };

  const renderLogsView = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Assessment Activity Log</h2>
        </div>
        {assessmentHistory.length === 0 ? (
          <p className="text-gray-600">No assessment logs available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="py-3 pr-4">Attempt #</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Subject</th>
                  <th className="py-3 pr-4">Start Time</th>
                  <th className="py-3 pr-4">End Time</th>
                  <th className="py-3 pr-4">Duration</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessmentHistory.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-900 font-bold">#{assessmentHistory.length - index}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatDate(row.date)}</td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">{row.subject}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatDateTime(row.date)}</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {row.date ? new Date(new Date(row.date).getTime() + (row.timeSpent || 15) * 60000).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 pr-4 text-gray-900">{row.timeSpent || 15} min</td>
                    <td className="py-3 pr-4 text-gray-900">{row.score}%</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.score >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.score >= 60 ? 'Submitted' : 'Failed'}
                      </span>
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

  const renderReportsView = () => {
    const latestAssessment = assessmentHistory[0];
    
    // Find matching prerequisite result with better matching logic
    const prereqForSubject = latestAssessment 
      ? prerequisiteResults.find(r => {
          const prereqTitle = r.courseTitle?.toLowerCase() || '';
          const assessSubject = latestAssessment.subject?.toLowerCase() || '';
          return prereqTitle.includes(assessSubject) || assessSubject.includes(prereqTitle);
        })
      : null;

    const calculateImprovement = () => {
      if (!latestAssessment || !prereqForSubject) return null;
      const prereqScore = Number(prereqForSubject.score) || 0;
      const currentScore = Number(latestAssessment.score) || 0;
      const improvement = currentScore - prereqScore;
      return {
        prereqScore,
        currentScore,
        improvement,
        percentageChange: prereqScore > 0 ? Math.round((improvement / prereqScore) * 100) : 0
      };
    };

    const improvement = calculateImprovement();

    const getStrengthsAndWeaknesses = () => {
      if (!latestAssessment) {
        return { strengths: [], weaknesses: [] };
      }
      
      // Use actual weak topics from assessment
      const weaknesses = Array.isArray(latestAssessment.weakTopics) 
        ? latestAssessment.weakTopics.filter(t => t && typeof t === 'string').map(t => t.trim())
        : [];
      
      // Get strengths from assessment if available, otherwise derive from weaknesses
      const assessmentStrengths = Array.isArray(latestAssessment.strengths)
        ? latestAssessment.strengths.filter(t => t && typeof t === 'string').map(t => t.trim())
        : [];
      
      // If no explicit strengths, use common topics not in weaknesses
      if (assessmentStrengths.length === 0 && weaknesses.length > 0) {
        const allTopics = ['Sets', 'Logic', 'Combinatorics', 'Graph Theory', 'Arrays', 'Linked Lists', 
                          'Trees', 'Sorting', 'CPU Architecture', 'Memory', 'Classes', 'Inheritance',
                          'Functions', 'Pointers', 'Recursion', 'Graphs', 'Algorithms'];
        const strengths = allTopics.filter(t => !weaknesses.includes(t));
        return { strengths: strengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5) };
      }
      
      return { strengths: assessmentStrengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5) };
    };

    const { strengths, weaknesses } = getStrengthsAndWeaknesses();

    const getNextCourse = () => {
      if (!latestAssessment) return null;
      const subjectOrder = [
        'Discrete Mathematics',
        'Data Structures and Algorithms',
        'Computer Organization and Architecture',
        'Object Oriented Programming',
        'Computer Graphics',
        'Database Management Systems',
        'Computer Networks',
        'Software Engineering and Project Management',
        'Machine Learning',
        'Information and Cyber Security'
      ];
      const currentIndex = subjectOrder.findIndex(s => {
        const subject = latestAssessment.subject?.toLowerCase() || '';
        const course = s.toLowerCase();
        return subject.includes(course) || course.includes(subject);
      });
      if (currentIndex >= 0 && currentIndex < subjectOrder.length - 1) {
        return subjectOrder[currentIndex + 1];
      }
      return null;
    };

    const nextCourse = getNextCourse();

    // Get topic-wise performance from the latest assessment
    const getTopicPerformance = () => {
      if (!latestAssessment || !latestAssessment.weakTopics) return [];
      
      const topicMap = {};
      const weakTopics = latestAssessment.weakTopics || [];
      const strengthTopics = latestAssessment.strengths || [];
      
      // Mark weak topics with lower scores
      weakTopics.forEach(topic => {
        if (topic) {
          topicMap[topic] = { score: 40, status: 'weak' };
        }
      });
      
      // Mark strength topics with higher scores
      strengthTopics.forEach(topic => {
        if (topic) {
          topicMap[topic] = { score: 85, status: 'strong' };
        }
      });
      
      return Object.entries(topicMap).map(([topic, data]) => ({
        topic,
        score: data.score,
        status: data.status
      }));
    };

    const topicPerformance = getTopicPerformance();

    return (
      <div className="space-y-6">
        {subjectsLoading ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">Loading report data...</p>
          </div>
        ) : (
          <>
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

            {latestAssessment && (
              <>
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-blue-600" size={24} />
                    <h2 className="text-xl font-bold text-gray-900">Topic-wise Performance</h2>
                  </div>
                  <div className="space-y-4">
                    {topicPerformance.length === 0 && reportData.subjects.length === 0 ? (
                      <p className="text-gray-600">No topic performance data yet. Take an assessment to generate one.</p>
                    ) : topicPerformance.length > 0 ? (
                      topicPerformance.map(item => (
                        <div key={item.topic} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                            <h3 className="font-semibold text-gray-900">{item.topic}</h3>
                            <p className="text-sm text-gray-600">
                              Score: {item.score}%
                            </p>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${item.score >= 70 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, item.score)}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-3">
                            Status:{' '}
                            <span className={`font-medium ${item.status === 'strong' ? 'text-green-700' : 'text-orange-700'}`}>
                              {item.status === 'strong' ? 'Strong' : 'Needs Improvement'}
                            </span>
                          </p>
                        </div>
                      ))
                    ) : (
                      reportData.subjects.map(row => (
                        <div key={row.subject} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                            <h3 className="font-semibold text-gray-900">{row.subject}</h3>
                            <p className="text-sm text-gray-600">
                              Attempts: {row.attempts} | Avg score: {row.average}%
                            </p>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${row.average >= 70 ? 'bg-green-500' : row.average >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      Strong Areas
                    </h3>
                    {strengths.length === 0 ? (
                      <p className="text-gray-600">Take more assessments to identify strengths.</p>
                    ) : (
                      <ul className="space-y-2">
                        {strengths.map((strength, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <span className="text-green-600">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="text-orange-600" size={20} />
                      Needs Improvement
                    </h3>
                    {weaknesses.length === 0 ? (
                      <p className="text-gray-600">Great job! No major weaknesses detected.</p>
                    ) : (
                      <ul className="space-y-2">
                        {weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <span className="text-orange-600">⚠</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="text-purple-600" size={20} />
                    AI Insights
                  </h3>
                  <div className="space-y-4">
                    {improvement ? (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-gray-700">
                          Your performance <span className={`font-bold ${improvement.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {improvement.improvement >= 0 ? 'improved' : 'decreased'} by {Math.abs(improvement.percentageChange)}%
                          </span> compared to the prerequisite assessment.
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Prerequisite: {improvement.prereqScore}% → Current: {improvement.currentScore}%
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-gray-600">
                          {prerequisiteResults.length > 0 
                            ? 'Complete an assessment for this subject to see performance comparison.'
                            : 'Complete a prerequisite quiz to see performance comparison.'}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg bg-purple-50 p-4">
                      <p className="text-sm text-gray-600">Knowledge Level</p>
                      <p className="text-2xl font-bold text-purple-900">{latestAssessment.level || 'Intermediate'}</p>
                    </div>

                    {nextCourse && (
                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-sm text-gray-600">Recommended Next Course</p>
                        <p className="text-xl font-bold text-green-900">{nextCourse}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Based on your current progress in {latestAssessment.subject}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {weaknesses.length > 0 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <p className="font-semibold text-gray-900 mb-2">Focus Areas</p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {weaknesses.slice(0, 3).map((weakness, index) => (
                            <li key={index}>• Review {weakness} module</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="font-semibold text-gray-900 mb-2">Study Tips</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Practice with more assessment questions</li>
                        <li>• Review incorrect answers from recent attempts</li>
                        <li>• Focus on topics below 70% performance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!latestAssessment && (
              <div className="card text-center py-12">
                <p className="text-gray-600">Take an assessment to generate detailed reports and AI insights.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {renderViewTabs()}
        {error && (
          <div className="bg-red-50 border-l-4 border-l-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {activeView === 'assessment' && (stage === 'subject' ? renderSubjectSelection() : renderQuizView())}
        {activeView === 'results' && renderResultsView()}
        {activeView === 'logs' && renderLogsView()}
        {activeView === 'reports' && renderReportsView()}
      </div>
    </StudentLayout>
  );
};

export default AIAssessmentPage;
