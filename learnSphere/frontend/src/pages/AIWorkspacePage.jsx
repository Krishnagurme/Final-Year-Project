import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  Bot, Brain, Briefcase, Calendar, ChevronRight, Download,
  Lightbulb, Loader2, MessageSquare, Mic, PenLine, Plus,
  Send, Sparkles, Trash2, TrendingUp, Upload, X, Zap,
  Award, BookOpen, Clock, Target, MoreVertical,
} from 'lucide-react';
import { StudentLayout } from '../components/Layout.jsx';
import { aiService, userService } from '../services/index.js';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'assistant',  label: 'Personal Assistant', icon: Bot,         bg: 'from-blue-500 to-indigo-600',    ring: 'ring-blue-400'    },
  { id: 'notes',      label: 'Notes Generator',    icon: PenLine,     bg: 'from-violet-500 to-purple-600',  ring: 'ring-violet-400'  },
  { id: 'quiz',       label: 'Quiz Generator',     icon: Brain,       bg: 'from-amber-500 to-orange-500',   ring: 'ring-amber-400'   },
  { id: 'planner',    label: 'Study Planner',      icon: Calendar,    bg: 'from-emerald-500 to-teal-600',   ring: 'ring-emerald-400' },
  { id: 'tutor',      label: 'AI Tutor',           icon: Lightbulb,   bg: 'from-pink-500 to-rose-600',      ring: 'ring-pink-400'    },
  { id: 'insights',   label: 'Learning Insights',  icon: TrendingUp,  bg: 'from-cyan-500 to-blue-600',      ring: 'ring-cyan-400'    },
  { id: 'interview',  label: 'Interview Coach',    icon: Mic,         bg: 'from-indigo-500 to-violet-600',  ring: 'ring-indigo-400'  },
  { id: 'careers',    label: 'Career Guide',       icon: Briefcase,   bg: 'from-rose-500 to-pink-600',      ring: 'ring-rose-400'    },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const emptySession = { session: null, messages: [], documents: [] };

// ─── SSE stream helper ────────────────────────────────────────────────────────
async function sseStream({ sessionId, message, documentIds = [], onToken, onComplete }) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai/sessions/${sessionId}/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, documentIds }),
  });
  if (!res.ok || !res.body) throw new Error(`Stream error: ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  const processChunk = raw => {
    const segments = raw.split('\n\n');
    segments.forEach(seg => {
      let evtName = 'message', dataStr = '';
      seg.split('\n').forEach(line => {
        if (line.startsWith('event:')) evtName = line.slice(6).trim();
        if (line.startsWith('data:'))  dataStr = line.slice(5).trim();
      });
      if (!dataStr) return;
      try {
        const payload = JSON.parse(dataStr);
        if (evtName === 'token' && payload.token) onToken?.(payload.token);
        if (evtName === 'complete') onComplete?.(payload);
      } catch { /* ignore parse errors */ }
    });
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    if (parts.length) processChunk(parts.join('\n\n'));
  }
  if (buf.trim()) processChunk(buf);
}

// ─── Shared: ChatMessages ─────────────────────────────────────────────────────
const ChatMessages = ({ messages, streaming, hint }) => {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (messages.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 opacity-60">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="text-indigo-500" size={26} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{hint || 'Ask me anything!'}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">Start a conversation to get intelligent responses.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 py-4 px-1">
      {messages.map(msg => (
        <div key={msg._id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm max-w-[80%] ${
            msg.role === 'user'
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none'
              : 'bg-white/90 border border-slate-100 text-slate-800 rounded-bl-none'
          }`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${
              msg.role === 'user' ? 'text-blue-200' : 'text-indigo-400'
            }`}>{msg.role === 'user' ? 'You' : '✦ AI'}</p>

            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-bold prose-headings:text-slate-800 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded">
                <ReactMarkdown>{msg.content || (streaming ? '…' : '')}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            )}

            {msg.citations?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sources</p>
                {msg.citations.map(c => (
                  <div key={c.chunkId} className="rounded-xl bg-indigo-50/70 border border-indigo-100 px-3 py-2 text-xs">
                    <p className="font-semibold text-indigo-700 mb-0.5">{c.documentName}</p>
                    <p className="text-slate-500 italic">"{c.snippet?.slice(0, 120)}…"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

// ─── Shared: Composer ─────────────────────────────────────────────────────────
const Composer = ({ onSend, streaming, placeholder }) => {
  const [text, setText] = useState('');
  const submit = () => { if (text.trim() && !streaming) { onSend(text.trim()); setText(''); } };
  return (
    <div className="flex items-end gap-2 bg-white/80 border border-slate-200 rounded-2xl shadow px-3 py-2">
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder={placeholder || 'Type a message… (Enter to send, Shift+Enter for newline)'}
        rows={2}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        className="flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 leading-relaxed"
      />
      <button onClick={submit} disabled={!text.trim() || streaming}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition shadow">
        {streaming ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
        <span className="hidden sm:inline">Send</span>
      </button>
    </div>
  );
};

// ─── Shared: SessionSidebar ───────────────────────────────────────────────────
const SessionSidebar = ({ sessions, activeId, onLoad, onNew, onDelete, creating }) => (
  <div className="w-52 sm:w-52 shrink-0 flex flex-col gap-2">
    <button onClick={onNew} disabled={creating}
      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow hover:opacity-90 disabled:opacity-50 transition">
      {creating ? <Loader2 className="animate-spin" size={13} /> : <Plus size={13} />} New Chat
    </button>
    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 px-1 mt-1">Conversations</p>
    <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
      {sessions.length === 0 && <p className="text-xs text-slate-400 italic px-1 mt-2">No sessions yet.</p>}
      {sessions.map(s => (
        <div key={s._id} onClick={() => onLoad(s._id)}
          className={`group flex items-center justify-between gap-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
            activeId === s._id
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
              : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-100 hover:border-slate-200'
          }`}>
          <span className="truncate flex-1">{s.title || 'Untitled'}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(s._id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-red-400 p-0.5">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ─── Shared: FullChatTab (used by Personal Assistant + AI Tutor) ──────────────
const FullChatTab = ({ hint, placeholder, sessions, activeId, activeSession,
  streaming, creating, error, onSend, onNew, onLoad, onDelete }) => (
  <div className="flex gap-4 h-full min-h-0 flex-col lg:flex-row">
    <SessionSidebar sessions={sessions} activeId={activeId} onLoad={onLoad} onNew={onNew} onDelete={onDelete} creating={creating} />
    <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-white/80 border border-slate-200 shadow overflow-hidden">
      {error && <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 shrink-0">{error}</div>}
      <div className="flex-1 overflow-y-auto px-4">
        <ChatMessages messages={activeSession.messages} streaming={streaming} hint={hint} />
      </div>
      <div className="shrink-0 px-4 pb-4 pt-2">
        <Composer onSend={onSend} streaming={streaming} placeholder={placeholder} />
      </div>
    </div>
  </div>
);

// ─── Shared: ToolOutput (for generator tabs) ──────────────────────────────────
const ToolOutput = ({ result, label, accent = 'text-violet-500' }) => {
  if (!result) return null;
  return (
    <div className="flex-1 overflow-y-auto rounded-2xl bg-white/90 border border-slate-200 shadow p-4 sm:p-5 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[9px] font-black uppercase tracking-widest ${accent}`}>{label}</p>
        <button onClick={() => navigator.clipboard?.writeText(result)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
          <Download size={13} /> <span className="hidden sm:inline">Copy</span>
        </button>
      </div>
      <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    </div>
  );
};

// ─── Tab: Notes Generator ─────────────────────────────────────────────────────
const NotesTab = ({ onGenerate, streaming }) => {
  const [topic, setTopic]   = useState('');
  const [style, setStyle]   = useState('detailed');
  const [result, setResult] = useState('');
  const [busy, setBusy]     = useState(false);

  const go = async () => {
    if (!topic.trim() || busy) return;
    console.log('Notes generator starting with topic:', topic, 'style:', style);
    setBusy(true); setResult('');
    const prompt = `Generate ${style} study notes for: "${topic}". Use clear headings (##), bullet points, **key terms**, code examples if relevant, and a summary section. Markdown format.`;
    console.log('Sending prompt to AI:', prompt);
    try {
      await onGenerate(prompt, tok => {
        console.log('Received token:', tok.substring(0, 20));
        setResult(r => r + tok);
      });
      console.log('Notes generation completed');
    } catch (error) {
      console.error('Notes generation error:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-4 sm:p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><PenLine size={16} className="text-violet-500" /> Notes Generator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==='Enter' && go()}
              placeholder="e.g. Binary Search Trees, React Hooks, Normalization…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400">
              <option value="long">Long</option>
              <option value="short">Short</option>
              <option value="revision">Revision</option>
              <option value="flashcard">Flashcard</option>
              <option value="mindmap">Mindmap</option>
            </select>
          </div>
        </div>
        <button onClick={go} disabled={!topic.trim() || busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
          {busy ? <><Loader2 className="animate-spin" size={14}/> Generating…</> : <><Sparkles size={14}/> Generate Notes</>}
        </button>
      </div>
      <ToolOutput result={result} label={`Notes — ${style}`} accent="text-violet-500" />
    </div>
  );
};

// ─── Tab: Quiz Generator ──────────────────────────────────────────────────────
const QuizTab = ({ onGenerate, streaming }) => {
  const [topic, setTopic]           = useState('');
  const [count, setCount]           = useState('5');
  const [difficulty, setDifficulty] = useState('mixed');
  const [quizText, setQuizText]     = useState('');
  const [studentAnswers, setStudentAnswers] = useState('');
  const [answerKey, setAnswerKey]   = useState('');
  const [busy, setBusy]             = useState(false);
  const [stage, setStage]           = useState('ready');

  const generateQuiz = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setQuizText('');
    setAnswerKey('');
    setStudentAnswers('');
    setStage('generating');
    let buffer = '';
    const prompt = `Create ${count} Multiple Choice Questions (MCQ) about "${topic}" at ${difficulty} difficulty in a formal course test style. For each question: use numbered headings (Question 1, Question 2, etc.), show the question text, and list exactly 4 answer options labeled A., B., C., D. Use a clear MCQ layout with bullet-style or lettered option formatting. Do NOT include the correct answer or answer key. Separate each question with a blank line.`;
    await onGenerate(prompt, tok => { buffer += tok; });
    setQuizText(buffer);
    setStage('answering');
    setBusy(false);
  };

  const submitAnswers = async () => {
    if (!quizText.trim() || !studentAnswers.trim() || busy) return;
    setBusy(true);
    setAnswerKey('');
    setStage('grading');
    let buffer = '';
    const prompt = `Here are the quiz questions:
${quizText}

Student answers:
${studentAnswers}

Now provide the answer key only. For each question, list the correct option letter as a bullet point with a short explanation if needed. Do NOT repeat the full question text.`;
    await onGenerate(prompt, tok => { buffer += tok; });
    setAnswerKey(buffer);
    setStage('completed');
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-4 sm:p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Brain size={16} className="text-amber-500" /> Quiz Generator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==='Enter' && generateQuiz()}
              placeholder="e.g. Sorting Algorithms, SQL JOINs…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Questions</label>
            <select value={count} onChange={e => setCount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400">
              {['3','5','8','10','15'].map(n => <option key={n} value={n}>{n} Qs</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400">
              <option value="easy">Easy</option><option value="medium">Medium</option>
              <option value="hard">Hard</option><option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
        <button onClick={generateQuiz} disabled={!topic.trim() || busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
          {busy && stage === 'generating' ? <><Loader2 className="animate-spin" size={14}/> Generating…</> : <><Zap size={14}/> Generate Quiz</>}
        </button>
      </div>

      {quizText && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] h-full min-h-0">
          <ToolOutput result={quizText} label="Quiz Questions" accent="text-amber-500" />
          <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="rounded-2xl bg-white/90 border border-slate-200 shadow p-4 sm:p-5 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-slate-500 mb-2 block">Student Answers</label>
              <textarea value={studentAnswers} onChange={e => setStudentAnswers(e.target.value)}
                placeholder="Enter your answers here (e.g. 1. A, 2. C, 3. B)"
                className="flex-1 min-h-[220px] resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              <button onClick={submitAnswers} disabled={!studentAnswers.trim() || busy}
                className="mt-4 self-start px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
                {busy && stage === 'grading' ? 'Generating Answer Key…' : 'Submit Answers'}
              </button>
            </div>
            {answerKey && (
              <ToolOutput result={answerKey} label="Answer Key" accent="text-orange-600" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Study Planner ───────────────────────────────────────────────────────
const PlannerTab = ({ onGenerate }) => {
  const [goal, setGoal]     = useState('');
  const [weeks, setWeeks]   = useState('4');
  const [hours, setHours]   = useState('2');
  const [result, setResult] = useState('');
  const [busy, setBusy]     = useState(false);

  const go = async () => {
    if (!goal.trim() || busy) return;
    setBusy(true); setResult('');
    const prompt = `Build a detailed ${weeks}-week study plan for: "${goal}". The student can study ${hours} hours/day. Include: weekly goals, daily task breakdown, milestones, review checkpoints, and consistency tips. Format clearly in Markdown with week headings.`;
    await onGenerate(prompt, tok => setResult(r => r + tok));
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Calendar size={16} className="text-emerald-500" /> Study Planner</h3>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Learning Goal</label>
          <input value={goal} onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Master React, Prepare for DBMS final exam, Learn DSA for placement…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration (weeks)</label>
            <select value={weeks} onChange={e => setWeeks(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400">
              {['1','2','3','4','6','8','12'].map(w => <option key={w} value={w}>{w} {w==='1'?'week':'weeks'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Hours / Day</label>
            <select value={hours} onChange={e => setHours(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400">
              {['1','1.5','2','3','4','5','6'].map(h => <option key={h} value={h}>{h} hrs</option>)}
            </select>
          </div>
        </div>
        <button onClick={go} disabled={!goal.trim() || busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
          {busy ? <><Loader2 className="animate-spin" size={14}/> Building Plan…</> : <><Calendar size={14}/> Generate Plan</>}
        </button>
      </div>
      <ToolOutput result={result} label="Your Study Plan" accent="text-emerald-600" />
    </div>
  );
};

// ─── Tab: Learning Insights ───────────────────────────────────────────────────
const InsightsTab = ({ onGenerate }) => {
  const [topic, setTopic]   = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy]     = useState(false);
  const quick = ['Machine Learning','React Hooks','Database Indexing','Big-O Complexity','Neural Networks'];

  const go = async (t = topic) => {
    if (!t.trim() || busy) return;
    setBusy(true); setResult('');
    const prompt = `Give deep learning insights on "${t}": core concepts, common misconceptions, real-world uses, connections to related topics, exam tips, and 3 resources for further study. Be structured and educational.`;
    await onGenerate(prompt, tok => setResult(r => r + tok));
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><TrendingUp size={16} className="text-cyan-500" /> Learning Insights</h3>
        <div className="flex gap-2">
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==='Enter' && go()}
            placeholder="Enter any topic to get deep insights…"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-400" />
          <button onClick={() => go()} disabled={!topic.trim() || busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
            {busy ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} Analyze
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 self-center">Try:</span>
          {quick.map(t => (
            <button key={t} onClick={() => { setTopic(t); go(t); }}
              className="text-xs px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 transition">{t}</button>
          ))}
        </div>
      </div>
      <ToolOutput result={result} label={`Insights${topic ? ` — ${topic}` : ''}`} accent="text-cyan-600" />
    </div>
  );
};

// ─── Tab: Interview Coach ─────────────────────────────────────────────────────
const InterviewTab = ({ onGenerate }) => {
  const [role, setRole]     = useState('');
  const [round, setRound]   = useState('technical');
  const [mode, setMode]     = useState('questions');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy]     = useState(false);

  const go = async () => {
    if (!role.trim() || busy) return;
    setBusy(true); setResult('');
    let p = '';
    if (mode === 'questions') {
      if (round === 'system design') {
        p = `Generate 5 System Design interview questions for a "${role}" role. For each question, include the key evaluation criteria, expected architecture components, and the type of trade-offs interviewers want to hear. Format the questions in a clean numbered list.`;
      } else if (round === 'behavioral') {
        p = `Generate 10 behavioral interview questions for a "${role}" role. For each question, include what interviewers look for in a strong STAR-style answer.`;
      } else {
        p = `Generate 10 ${round} interview questions for a "${role}" role. For each question include what interviewers look for in a good answer.`;
      }
    } else if (mode === 'mock') {
      if (round === 'system design') {
        p = `Conduct a mock System Design interview for "${role}". Ask one open-ended system design question at a time as if you are the interviewer, then pause for the candidate's answer and follow up with clarifying questions about architecture, scalability, data flow, and trade-offs. Start now.`;
      } else if (round === 'behavioral') {
        p = `Conduct a mock Behavioral interview for "${role}". Ask one behavioral question at a time and prompt the candidate to answer with the STAR method. Start now.`;
      } else {
        p = `Conduct a mock ${round} interview for "${role}". Ask one question at a time as if you are the interviewer. Start now.`;
      }
    } else {
      if (round === 'system design') {
        p = `I am applying for "${role}". Review my system design answer below and give structured feedback on architecture, scalability, reliability, performance, and trade-offs. Highlight improvements and weaknesses clearly.\n\n${answer}`;
      } else if (round === 'behavioral') {
        p = `I am applying for "${role}". Review my answer below and give structured feedback on clarity, impact, and STAR storytelling. Suggest improvements and stronger phrasing.\n\n${answer}`;
      } else {
        p = `I am applying for "${role}". Review my answer below and give structured feedback on clarity, depth, and areas to improve:\n\n${answer}`;
      }
    }
    await onGenerate(p, tok => setResult(r => r + tok));
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Mic size={16} className="text-indigo-500" /> Interview Coach</h3>
        <div className="flex gap-2 flex-wrap">
          {[['questions','Question Bank'],['mock','Mock Interview'],['review','Answer Review']].map(([v,l]) => (
            <button key={v} onClick={() => setMode(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${mode===v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>{l}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Role</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Software Engineer, Data Analyst…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Round Type</label>
            <select value={round} onChange={e => setRound(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="technical">Technical</option><option value="behavioral">Behavioral (STAR)</option>
              <option value="system design">System Design</option><option value="HR">HR / Culture Fit</option>
            </select>
          </div>
        </div>
        {mode === 'review' && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Your Answer</label>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} placeholder="Paste your answer here…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        )}
        <button onClick={go} disabled={!role.trim() || busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
          {busy ? <><Loader2 className="animate-spin" size={14}/> Processing…</> : <><Mic size={14}/> Start Session</>}
        </button>
      </div>
      <ToolOutput result={result} label="Interview Session" accent="text-indigo-600" />
    </div>
  );
};

// ─── Tab: Career Guide ────────────────────────────────────────────────────────
const CareerTab = ({ onGenerate }) => {
  const [field, setField]   = useState('');
  const [skills, setSkills] = useState('');
  const [level, setLevel]   = useState('entry');
  const [result, setResult] = useState('');
  const [busy, setBusy]     = useState(false);
  const popular = ['Full Stack Dev','Data Science','AI/ML Engineer','DevOps','Cybersecurity','Product Manager'];

  const go = async (f = field) => {
    if (!f.trim() || busy) return;
    setBusy(true); setResult('');
    const p = `Career guide for ${level}-level "${f}". Current skills: ${skills||'beginner'}. Include: skill roadmap, recommended certifications, portfolio project ideas, salary range, top hiring companies, and step-by-step next actions. Be specific and practical.`;
    await onGenerate(p, tok => setResult(r => r + tok));
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 shadow p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Briefcase size={16} className="text-rose-500" /> Career Guide</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Career Field</label>
            <input value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Full Stack Developer…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400">
              <option value="entry">Entry (0–2 yrs)</option><option value="mid">Mid (2–5 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option><option value="lead">Lead / Manager</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Current Skills (optional)</label>
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. HTML, CSS, basic JavaScript…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 self-center">Popular:</span>
          {popular.map(f => (
            <button key={f} onClick={() => { setField(f); go(f); }}
              className="text-xs px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition">{f}</button>
          ))}
        </div>
        <button onClick={() => go()} disabled={!field.trim() || busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shadow">
          {busy ? <><Loader2 className="animate-spin" size={14}/> Generating…</> : <><Briefcase size={14}/> Build Career Path</>}
        </button>
      </div>
      <ToolOutput result={result} label={`Career Roadmap${field ? ` — ${field}` : ''}`} accent="text-rose-500" />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AIWorkspacePage = () => {
  const [tab, setTab]                       = useState('assistant');
  const [sessions, setSessions]             = useState([]);
  const [activeId, setActiveId]             = useState('');
  const [activeSession, setActiveSession]   = useState(emptySession);
  const [streaming, setStreaming]           = useState(false);
  const [creating, setCreating]             = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // Bootstrap
  useEffect(() => {
    (async () => {
      try {
        const [sRes, _dRes] = await Promise.all([aiService.getSessions(), aiService.getDocuments()]);
        const list = sRes.data?.data || [];
        setSessions(list);
        if (list.length) await loadSession(list[0]._id);
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load workspace');
      } finally { setLoading(false); }
    })();
  }, []);

  const loadSession = async id => {
    const res = await aiService.getSession(id);
    const p   = res.data?.data || emptySession;
    setActiveId(id);
    setActiveSession(p);
    setSelectedDocIds(p.session?.selectedDocumentIds || []);
  };

  const handleNew = async () => {
    setCreating(true);
    try {
      const res = await aiService.createSession({ documentIds: selectedDocIds });
      const s   = res.data?.data;
      setSessions(c => [s, ...c]);
      setActiveId(s._id);
      setActiveSession({ session: s, messages: [], documents: [] });
    } catch (e) { setError('Failed to create session'); }
    finally { setCreating(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this session?')) return;
    await aiService.deleteSession(id).catch(() => {});
    setSessions(c => c.filter(s => s._id !== id));
    if (activeId === id) { setActiveId(''); setActiveSession(emptySession); }
  };

  // Main send (used by chat tabs)
  const handleSend = async text => {
    setError('');
    let sessId = activeId;
    if (!sessId) {
      const res = await aiService.createSession({ documentIds: selectedDocIds });
      const s   = res.data?.data;
      setSessions(c => [s, ...c]);
      setActiveId(s._id);
      sessId = s._id;
    }
    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    setActiveSession(c => ({
      ...c,
      messages: [...(c.messages||[]),
        { _id: uid, role: 'user',      content: text, citations: [] },
        { _id: aid, role: 'assistant', content: '',   citations: [] },
      ],
    }));
    setStreaming(true);
    try {
      await sseStream({
        sessionId: sessId, message: text, documentIds: selectedDocIds,
        onToken: tok => setActiveSession(c => ({
          ...c,
          messages: c.messages.map(m => m._id === aid ? { ...m, content: m.content + tok } : m),
        })),
        onComplete: payload => {
          setActiveSession(c => ({
            session: payload.session,
            messages: c.messages.map(m => m._id === aid ? payload.assistantMessage : m),
            documents: c.documents,
          }));
          setSessions(c => {
            const rest = c.filter(s => s._id !== payload.session?._id);
            return payload.session ? [payload.session, ...rest] : rest;
          });
        },
      });
    } catch (e) { setError(e.message || 'Stream failed'); }
    finally { setStreaming(false); }
  };

  // One-shot generator for tool tabs — creates a session if none exists
  const makeGenerator = () => async (prompt, onToken) => {
    setError('');
    let sessId = activeId;
    if (!sessId) {
      try {
        const res = await aiService.createSession({ documentIds: [] });
        const s   = res.data?.data;
        setSessions(c => [s, ...c]);
        setActiveId(s._id);
        sessId = s._id;
      } catch (e) {
        console.error('Failed to create session:', e);
        setError('Failed to create AI session. Please try again.');
        return;
      }
    }
    try {
      await sseStream({ sessionId: sessId, message: prompt, documentIds: selectedDocIds, onToken });
    } catch (e) {
      console.error('Generation failed:', e);
      setError(e.message || 'Generation failed');
    }
  };

  const generate = makeGenerator();

  const tabMeta = TABS.find(t => t.id === tab) || TABS[0];
  const Icon    = tabMeta.icon;

  const [assistantSummary, setAssistantSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [studentStats, setStudentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { user } = useSelector(state => state.auth);
  
  // Fetch summary and keep it live-updated when assistant tab is open
  useEffect(() => {
    let timer = null;
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await aiService.getAssistantSummary();
        setAssistantSummary(res.data?.data || null);
      } catch (e) { setAssistantSummary(null); }
      finally { setSummaryLoading(false); }
    };

    if (tab === 'assistant') {
      fetchSummary();
      timer = setInterval(fetchSummary, 5000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [tab]);

  // Fetch dynamic student stats
  useEffect(() => {
    const fetchStudentStats = async () => {
      setStatsLoading(true);
      try {
        const res = await userService.getDashboardStats();
        setStudentStats(res.data?.data || null);
      } catch (e) { setStudentStats(null); }
      finally { setStatsLoading(false); }
    };

    if (tab === 'assistant') {
      fetchStudentStats();
    }
  }, [tab]);

  const chatTabProps = {
    sessions, activeId, activeSession, streaming, creating, error,
    onSend: handleSend, onNew: handleNew, onLoad: loadSession, onDelete: handleDelete,
  };

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={20} /> Loading AI Workspace…
        </div>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="flex gap-0 flex-col lg:flex-row" style={{ height: 'calc(100vh - 130px)', minHeight: 500 }}>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 border border-slate-200 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${tabMeta.bg} shadow shrink-0`}>
              <Icon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 leading-tight truncate">AI Workspace</p>
              <p className="text-[10px] text-slate-400 truncate">{tabMeta.label}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
            {sidebarOpen ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
        </div>

        {/* ── Vertical Nav Sidebar ── */}
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex w-56 shrink-0 flex-col bg-white/80 border border-slate-200 rounded-t-none lg:rounded-2xl shadow-sm lg:mr-4 overflow-hidden absolute lg:relative z-50 lg:z-auto h-full lg:h-auto`}>

          {/* Brand header */}
          <div className="hidden lg:block px-4 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${tabMeta.bg} shadow shrink-0`}>
                <Icon size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 leading-tight truncate">AI Workspace</p>
                <p className="text-[10px] text-slate-400 truncate">Intelligent Learning Suite</p>
              </div>
            </div>
            {/* AI status pill */}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AI Online
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 pb-2">Tools</p>
            {TABS.map(t => {
              const TIcon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                    active
                      ? `bg-gradient-to-r ${t.bg} text-white shadow-md`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                    active
                      ? 'bg-white/20'
                      : 'bg-slate-100 group-hover:bg-white/80'
                  }`}>
                    <TIcon size={14} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} />
                  </span>
                  <span className="truncate">{t.label}</span>
                  {active && (
                    <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer hint */}
          <div className="hidden lg:block px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Select a tool from the menu to get started.
            </p>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Content Panel ── */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {tab === 'assistant' && (
            <div>
              <div className="px-4 pb-3">
                {/* Student Profile Card */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow p-5 mb-4">
                  {statsLoading ? (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Loader2 className="animate-spin" size={16} /> Loading your profile…
                    </div>
                  ) : studentStats ? (
                    <div className="space-y-4">
                      {/* Student Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Target className="text-blue-600" size={18} />
                            Welcome, {user?.name || 'Student'}!
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">Here's your learning journey at a glance</p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            {studentStats.skillLevel || 'BEGINNER'}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="text-blue-500" size={14} />
                            <span className="text-[10px] uppercase font-bold text-slate-400">Courses</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{studentStats.totalCourses || 0}</p>
                          <p className="text-[10px] text-slate-500">{studentStats.completedCourses || 0} completed</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="text-emerald-500" size={14} />
                            <span className="text-[10px] uppercase font-bold text-slate-400">Assessments</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{studentStats.completedAssessments || 0}</p>
                          <p className="text-[10px] text-slate-500">{studentStats.averageAssessmentScore?.toFixed(1) || 0}% avg</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="text-amber-500" size={14} />
                            <span className="text-[10px] uppercase font-bold text-slate-400">Hours</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{Number(studentStats.hoursLearned || 0).toFixed(1)}</p>
                          <p className="text-[10px] text-slate-500">total learned</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="text-purple-500" size={14} />
                            <span className="text-[10px] uppercase font-bold text-slate-400">Progress</span>
                          </div>
                          <p className="text-xl font-black text-slate-900">{studentStats.overallProgressPercent || 0}%</p>
                          <p className="text-[10px] text-slate-500">overall</p>
                        </div>
                      </div>

                      {/* Enrolled Courses Preview */}
                      {studentStats.enrolledCourses && studentStats.enrolledCourses.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-700 mb-2">📚 Active Enrollments</p>
                          <div className="space-y-2">
                            {studentStats.enrolledCourses.slice(0, 3).map((course, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{course.title}</p>
                                  <p className="text-[10px] text-slate-500">{course.category}</p>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="text-xs font-bold text-blue-600">{course.progress || 0}%</p>
                                  <div className="w-12 h-1 bg-slate-100 rounded-full mt-1">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${course.progress || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Activity Summary */}
                      {assistantSummary && (
                        <div className="bg-white rounded-xl p-3 border border-indigo-100">
                          <p className="text-xs font-bold text-slate-700 mb-2">🤖 AI Workspace Activity</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Sessions:</span>
                              <span className="font-bold text-slate-900">{assistantSummary.counts?.mySessionCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Messages:</span>
                              <span className="font-bold text-slate-900">{assistantSummary.counts?.myMessageCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Documents:</span>
                              <span className="font-bold text-slate-900">{assistantSummary.counts?.myDocumentCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Status:</span>
                              <span className="font-bold text-emerald-600">Active</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Unable to load profile data.</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {tab === 'notes'     && <NotesTab    onGenerate={generate} streaming={streaming} />}
          {tab === 'quiz'      && <QuizTab     onGenerate={generate} streaming={streaming} />}
          {tab === 'planner'   && <PlannerTab  onGenerate={generate} />}
          {tab === 'tutor'     && <FullChatTab {...chatTabProps}
            hint="Your AI tutor — ask about any concept and get step-by-step explanations."
            placeholder="Ask your tutor to explain something…" />}
          {tab === 'insights'  && <InsightsTab  onGenerate={generate} />}
          {tab === 'interview' && <InterviewTab onGenerate={generate} />}
          {tab === 'careers'   && <CareerTab    onGenerate={generate} />}
        </div>

      </div>
    </StudentLayout>
  );
};

export default AIWorkspacePage;
