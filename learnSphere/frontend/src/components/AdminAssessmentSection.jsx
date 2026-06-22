import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/index.js';
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Calendar } from 'lucide-react';

const emptyQuestion = {
  subject: '',
  question: '',
  type: 'MULTIPLE_CHOICE',
  options: ['', '', '', ''],
  correctAnswer: '',
  difficulty: 'MEDIUM',
};

const emptyTest = {
  title: '',
  subject: '',
  description: '',
  difficulty: 'MEDIUM',
  passingScore: 60,
  timeLimit: 30,
  schedule: 'ALWAYS',
  scheduledAt: '',
  status: 'DRAFT',
  questions: [],
};

const statusClass = status => {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'ARCHIVED') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-100 text-amber-700';
};

const AdminAssessmentSection = ({ section, onDataChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [testForm, setTestForm] = useState(emptyTest);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingTestId, setEditingTestId] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [testsRes, questionsRes, resultsRes] = await Promise.all([
        adminService.getTests(),
        adminService.getQuestions(),
        adminService.getResults(subjectFilter ? { subject: subjectFilter } : {}),
      ]);
      setTests(testsRes.data?.data || []);
      setQuestions(questionsRes.data?.data || []);
      setResults(resultsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notifyChange = () => {
    onDataChange?.();
    loadData();
  };

  const handleSaveQuestion = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      ...questionForm,
      options: questionForm.options.filter(Boolean),
    };
    try {
      if (editingQuestionId) {
        await adminService.updateQuestion(editingQuestionId, payload);
      } else {
        await adminService.createQuestion(payload);
      }
      setQuestionForm(emptyQuestion);
      setEditingQuestionId(null);
      setShowQuestionForm(false);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question');
    }
  };

  const handleEditQuestion = q => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      subject: q.subject,
      question: q.question,
      type: q.type || 'MULTIPLE_CHOICE',
      options: [...(q.options || []), '', '', '', ''].slice(0, 4),
      correctAnswer: q.correct,
      difficulty: q.difficulty || 'MEDIUM',
    });
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async id => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await adminService.deleteQuestion(id);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleSaveTest = async e => {
    e.preventDefault();
    setError('');
    const payload = {
      title: testForm.title,
      subject: testForm.subject,
      description: testForm.description,
      difficulty: testForm.difficulty,
      passingScore: Number(testForm.passingScore),
      timeLimit: Number(testForm.timeLimit),
      schedule: testForm.schedule,
      scheduledAt: testForm.schedule === 'SCHEDULED' && testForm.scheduledAt ? testForm.scheduledAt : null,
      status: testForm.status,
      questions: testForm.questions,
    };
    try {
      if (editingTestId) {
        await adminService.updateTest(editingTestId, payload);
      } else {
        await adminService.createTest(payload);
      }
      setTestForm(emptyTest);
      setEditingTestId(null);
      setShowTestForm(false);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test');
    }
  };

  const handleEditTest = t => {
    setEditingTestId(t.id);
    setTestForm({
      title: t.title || t.subject,
      subject: t.subject,
      description: t.description || '',
      difficulty: t.difficulty || 'MEDIUM',
      passingScore: t.passingScore || 60,
      timeLimit: t.timeLimit || 30,
      schedule: t.scheduleType || (t.schedule === 'Always Available' ? 'ALWAYS' : 'SCHEDULED'),
      scheduledAt: t.scheduledAt ? new Date(t.scheduledAt).toISOString().slice(0, 16) : '',
      status: t.status || 'DRAFT',
      questions: t.questionIds || [],
    });
    setShowTestForm(true);
  };

  const handleDeleteTest = async id => {
    if (!window.confirm('Delete this test and its results?')) return;
    try {
      await adminService.deleteTest(id);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete test');
    }
  };

  const handleTestStatus = async (id, status) => {
    try {
      await adminService.updateTestStatus(id, status);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test status');
    }
  };

  const handleDeleteResult = async (id, source) => {
    if (source === 'history') {
      setError('Practice history records cannot be deleted from here.');
      return;
    }
    if (!window.confirm('Delete this result record?')) return;
    try {
      await adminService.deleteResult(id, source);
      notifyChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete result');
    }
  };

  const toggleTestQuestion = questionId => {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.includes(questionId)
        ? prev.questions.filter(id => id !== questionId)
        : [...prev.questions, questionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 gap-2">
        <RefreshCw size={18} className="animate-spin" />
        Loading assessment data…
      </div>
    );
  }

  const renderQuestionForm = () => (
    <form onSubmit={handleSaveQuestion} className="space-y-4 p-5 border border-slate-100 rounded-2xl bg-slate-50/40">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
          <input className="input" value={questionForm.subject} onChange={e => setQuestionForm({ ...questionForm, subject: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Difficulty</label>
          <select className="input" value={questionForm.difficulty} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question</label>
        <textarea className="input min-h-[80px]" value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questionForm.options.map((opt, i) => (
          <div key={i}>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Option {i + 1}</label>
            <input
              className="input"
              value={opt}
              onChange={e => {
                const options = [...questionForm.options];
                options[i] = e.target.value;
                setQuestionForm({ ...questionForm, options });
              }}
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Correct answer</label>
        <input className="input" value={questionForm.correctAnswer} onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} required />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary px-4 py-2 text-sm font-semibold">
          {editingQuestionId ? 'Update question' : 'Add question'}
        </button>
        <button
          type="button"
          className="btn btn-secondary px-4 py-2 text-sm"
          onClick={() => {
            setShowQuestionForm(false);
            setEditingQuestionId(null);
            setQuestionForm(emptyQuestion);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderTestForm = () => (
    <form onSubmit={handleSaveTest} className="space-y-4 p-5 border border-slate-100 rounded-2xl bg-slate-50/40">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Test title</label>
          <input className="input" value={testForm.title} onChange={e => setTestForm({ ...testForm, title: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
          <input className="input" value={testForm.subject} onChange={e => setTestForm({ ...testForm, subject: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Difficulty</label>
          <select className="input" value={testForm.difficulty} onChange={e => setTestForm({ ...testForm, difficulty: e.target.value })}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Passing score (%)</label>
          <input type="number" min="0" max="100" className="input" value={testForm.passingScore} onChange={e => setTestForm({ ...testForm, passingScore: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Time limit (minutes)</label>
          <input type="number" min="1" className="input" value={testForm.timeLimit} onChange={e => setTestForm({ ...testForm, timeLimit: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Schedule</label>
          <select className="input" value={testForm.schedule} onChange={e => setTestForm({ ...testForm, schedule: e.target.value })}>
            <option value="ALWAYS">Always available</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        {testForm.schedule === 'SCHEDULED' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Scheduled date & time</label>
            <input type="datetime-local" className="input" value={testForm.scheduledAt} onChange={e => setTestForm({ ...testForm, scheduledAt: e.target.value })} />
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Select questions from bank ({testForm.questions.length} selected)</label>
        <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-3 bg-white">
          {questions.length === 0 ? (
            <p className="text-xs text-slate-500">Add questions to the bank first.</p>
          ) : (
            questions.map(q => (
              <label key={q.id} className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input type="checkbox" checked={testForm.questions.includes(q.id)} onChange={() => toggleTestQuestion(q.id)} className="mt-1" />
                <span>
                  <span className="text-xs font-bold text-blue-600">{q.subject}</span>
                  <span className="block text-slate-700">{q.question}</span>
                </span>
              </label>
            ))
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary px-4 py-2 text-sm font-semibold" disabled={testForm.questions.length === 0}>
          {editingTestId ? 'Update test' : 'Create test'}
        </button>
        <button
          type="button"
          className="btn btn-secondary px-4 py-2 text-sm"
          onClick={() => {
            setShowTestForm(false);
            setEditingTestId(null);
            setTestForm(emptyTest);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  if (section === 'tests') {
    return (
      <div className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800">Create & Manage Tests</h4>
          <button
            onClick={() => {
              setShowTestForm(!showTestForm);
              setEditingTestId(null);
              setTestForm(emptyTest);
            }}
            className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1"
          >
            <Plus size={14} /> {showTestForm ? 'Close form' : 'New test'}
          </button>
        </div>
        {showTestForm && renderTestForm()}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="pb-3">Title</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Difficulty</th>
                <th className="pb-3">Questions</th>
                <th className="pb-3">Schedule</th>
                <th className="pb-3">Pass rate</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tests.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-500">No tests yet. Create your first test.</td></tr>
              ) : (
                tests.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-800">{t.title}</td>
                    <td className="py-3">{t.subject}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-semibold">{t.difficulty}</span></td>
                    <td className="py-3 text-center">{t.totalQuestions}</td>
                    <td className="py-3 text-slate-500 flex items-center gap-1"><Calendar size={14} /> {t.schedule}</td>
                    <td className="py-3 font-semibold text-indigo-700">{t.passingRate}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(t.status)}`}>{t.status}</span></td>
                    <td className="py-3 text-right space-x-2">
                      {t.status !== 'PUBLISHED' && (
                        <button onClick={() => handleTestStatus(t.id, 'PUBLISHED')} className="text-xs font-bold text-emerald-600">Publish</button>
                      )}
                      {t.status === 'PUBLISHED' && (
                        <button onClick={() => handleTestStatus(t.id, 'ARCHIVED')} className="text-xs font-bold text-slate-600">Archive</button>
                      )}
                      <button onClick={() => handleEditTest(t)} className="text-xs font-bold text-blue-600 inline-flex items-center gap-0.5"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handleDeleteTest(t.id)} className="text-xs font-bold text-red-600 inline-flex items-center gap-0.5"><Trash2 size={12} /> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'questions') {
    return (
      <div className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800">Question Bank</h4>
          <button
            onClick={() => {
              setShowQuestionForm(!showQuestionForm);
              setEditingQuestionId(null);
              setQuestionForm(emptyQuestion);
            }}
            className="btn btn-primary px-4 py-2 text-sm flex items-center gap-1"
          >
            <Plus size={14} /> {showQuestionForm ? 'Close form' : 'Add question'}
          </button>
        </div>
        {showQuestionForm && renderQuestionForm()}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500 p-6 bg-white/80 rounded-2xl border">No questions in the bank yet.</p>
          ) : (
            questions.map(q => (
              <div key={q.id} className="p-4 border border-slate-100 rounded-xl bg-white/80 shadow-sm">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{q.subject}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{q.difficulty}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEditQuestion(q)} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-xs font-bold text-red-600 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
                <h5 className="font-bold text-slate-800 mb-3">{q.question}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(q.options || []).map(o => (
                    <div key={o} className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${o === q.correct ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950 font-bold' : 'border-slate-200 text-slate-600'}`}>
                      <span>{o}</span>
                      {o === q.correct && <Check size={12} />}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h4 className="text-lg font-bold text-slate-800">Result Management</h4>
        <div className="flex items-center gap-2">
          <input
            className="input py-2 text-sm w-48"
            placeholder="Filter by subject…"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
          />
          <button onClick={loadData} className="btn btn-secondary px-3 py-2 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-semibold">
              <th className="pb-3">Student</th>
              <th className="pb-3">Test / Assessment</th>
              <th className="pb-3">Subject</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">Level</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Source</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {results.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500">No results recorded yet.</td></tr>
            ) : (
              results.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-semibold text-slate-800">{r.student}</td>
                  <td className="py-3 text-slate-600">{r.testTitle}</td>
                  <td className="py-3">{r.subject}</td>
                  <td className="py-3 font-bold text-indigo-700">{r.score}%</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">{r.level}</span></td>
                  <td className="py-3 text-slate-400">{r.date}</td>
                  <td className="py-3 text-xs uppercase text-slate-500">{r.source}</td>
                  <td className="py-3 text-right">
                    {r.source !== 'history' && (
                      <button onClick={() => handleDeleteResult(r.id, r.source)} className="text-xs font-bold text-red-600 flex items-center gap-1 ml-auto"><Trash2 size={12} /> Delete</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAssessmentSection;
