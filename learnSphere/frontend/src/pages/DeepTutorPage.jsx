import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { StudentLayout } from '../components/Layout.jsx';
import { deeptutorService } from '../services/index.js';
import { Cpu, CheckCircle2, Activity, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';

function normalizeSessionPayload(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.sessions)) return body.sessions;
  return [];
}

const DeepTutorPage = () => {
  const { user } = useSelector(state => state.auth);
  const Layout = StudentLayout;

  const [status, setStatus] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [solveSessions, setSolveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [llmTestResult, setLlmTestResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [statusRes, chatRes, solveRes] = await Promise.all([
          deeptutorService.getStatus(),
          deeptutorService.getChatSessions(10),
          deeptutorService.getSolveSessions(10),
        ]);

        setStatus(statusRes.data);
        setChatSessions(normalizeSessionPayload(chatRes.data));
        setSolveSessions(normalizeSessionPayload(solveRes.data));
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to reach DeepTutor service');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRunLLMTest = async () => {
    setError('');
    setLlmTestResult(null);

    try {
      const response = await deeptutorService.testLLMConnection();
      setLlmTestResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'LLM test failed');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600 font-semibold">
              DeepTutor Integration
            </p>
            <h1 className="text-4xl font-bold text-slate-900 mt-3">AI Tutor Service</h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              This page shows the integrated DeepTutor service status and available sessions. It
              uses LearnSphere backend proxying to the DeepTutor API so the service works inside
              this platform.
            </p>
          </div>
          <button
            onClick={handleRunLLMTest}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles size={18} />
            Run LLM Test
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Cpu size={24} className="text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Service Status</h2>
                <p className="text-sm text-gray-500">DeepTutor API connectivity check</p>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading service status…</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Backend</p>
                  <p>{status?.backend?.status || 'unknown'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">LLM</p>
                  <p>
                    {status?.llm?.status || 'unknown'} · {status?.llm?.model || 'not configured'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Embeddings</p>
                  <p>{status?.embeddings?.status || 'unknown'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Search</p>
                  <p>{status?.search?.status || 'unknown'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 size={24} className="text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">LLM Test Result</h2>
                <p className="text-sm text-gray-500">
                  Quick connectivity check for the configured model
                </p>
              </div>
            </div>

            {!llmTestResult && (
              <p className="text-gray-500">Click the button above to run a test call.</p>
            )}
            {llmTestResult && (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Success</p>
                  <p>{llmTestResult.success ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Message</p>
                  <p>{llmTestResult.message}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium">Response Time</p>
                  <p>{llmTestResult.response_time_ms ?? 'N/A'} ms</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={24} className="text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Chat Sessions</h2>
                <p className="text-sm text-gray-500">Recent chat sessions managed by DeepTutor</p>
              </div>
            </div>
            {chatSessions.length === 0 ? (
              <p className="text-gray-500">No chat sessions available yet.</p>
            ) : (
              <div className="space-y-3">
                {chatSessions.map(session => (
                  <div
                    key={session.session_id ?? session.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="font-medium">
                      {session.title || session.session_id || 'Session'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.created_at || session.createdAt || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={24} className="text-amber-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Solve Sessions</h2>
                <p className="text-sm text-gray-500">
                  Recent solver sessions available in DeepTutor
                </p>
              </div>
            </div>
            {solveSessions.length === 0 ? (
              <p className="text-gray-500">No solve sessions available yet.</p>
            ) : (
              <div className="space-y-3">
                {solveSessions.map(session => (
                  <div
                    key={session.session_id ?? session.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="font-medium">
                      {session.title || session.session_id || 'Session'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.created_at || session.createdAt || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DeepTutor Chat Interface */}
        <div className="card border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} className="text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">AI Chat Interface</h2>
                <p className="text-sm text-gray-500">Talk directly with DeepTutor AI assistant</p>
              </div>
            </div>
            <a
              href="http://localhost:8001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white text-sm shadow-sm hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={16} />
              Open Full Interface
            </a>
          </div>
          
          <div className="p-6">
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <MessageCircle size={48} className="mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Chat!</h3>
              <p className="text-gray-600 mb-4">
                Click "Open Full Interface" to launch the complete DeepTutor chat experience in a new tab.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>✅ Intelligent conversations</p>
                <p>✅ Web search integration</p>
                <p>✅ Code execution</p>
                <p>✅ Math problem solving</p>
                <p>✅ Research assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DeepTutorPage;
