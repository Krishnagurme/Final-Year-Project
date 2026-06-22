import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Brain,
  Database,
  FileText,
  FolderKanban,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { StudentLayout } from '../components/Layout.jsx';
import { aiService } from '../services/index.js';

const emptySessionState = {
  session: null,
  messages: [],
  documents: [],
};

const AIWorkspacePage = () => {
  const { user } = useSelector(state => state.auth);
  const Layout = StudentLayout;

  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(emptySessionState);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  const architectureCards = useMemo(
    () => [
      {
        title: 'Chat',
        icon: MessageSquare,
        items: overview?.beginnerGuide?.filter(item => item.id === 'chat') || [],
      },
      {
        title: 'RAG + Memory',
        icon: Brain,
        items:
          overview?.beginnerGuide?.filter(item => ['rag', 'memory'].includes(item.id)) || [],
      },
      {
        title: 'Documents + Streaming',
        icon: Database,
        items:
          overview?.beginnerGuide?.filter(item => ['documents', 'streaming'].includes(item.id)) ||
          [],
      },
    ],
    [overview]
  );

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError('');

      try {
        const [overviewRes, sessionsRes, documentsRes] = await Promise.all([
          aiService.getOverview(),
          aiService.getSessions(),
          aiService.getDocuments(),
        ]);

        const nextOverview = overviewRes.data.data;
        const nextSessions = sessionsRes.data.data;
        const nextDocuments = documentsRes.data.data;

        setOverview(nextOverview);
        setSessions(nextSessions);
        setDocuments(nextDocuments);

        if (nextSessions.length) {
          await loadSession(nextSessions[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load AI workspace');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const loadSession = async sessionId => {
    const response = await aiService.getSession(sessionId);
    const payload = response.data.data;
    setActiveSessionId(sessionId);
    setActiveSession(payload);
    setSelectedDocumentIds(payload.session?.selectedDocumentIds || []);
  };

  const handleCreateSession = async () => {
    setCreatingSession(true);
    setError('');

    try {
      const response = await aiService.createSession({
        documentIds: selectedDocumentIds,
      });
      const newSession = response.data.data;
      setSessions(current => [newSession, ...current]);
      setActiveSession({
        session: newSession,
        messages: [],
        documents: documents.filter(item => selectedDocumentIds.includes(item._id)),
      });
      setActiveSessionId(newSession._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to create a session');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await aiService.deleteSession(sessionId);
      setSessions(current => current.filter(s => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSession(emptySessionState);
        setActiveSessionId('');
      }
    } catch (err) {
      setError('Failed to delete session');
    }
  };

  const handleDeleteDocument = async (e, documentId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await aiService.deleteDocument(documentId);
      setDocuments(current => current.filter(d => d._id !== documentId));
      setSelectedDocumentIds(current => current.filter(id => id !== documentId));
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await aiService.uploadDocument(formData);
      const created = response.data.data;
      setDocuments(current => [created, ...current]);
      setSelectedDocumentIds(current => [...new Set([created._id, ...current])]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const toggleDocument = documentId => {
    setSelectedDocumentIds(current =>
      current.includes(documentId)
        ? current.filter(item => item !== documentId)
        : [...current, documentId]
    );
  };

  const handleSend = async () => {
    if (!composer.trim() || streaming) {
      return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      const response = await aiService.createSession({
        documentIds: selectedDocumentIds,
      });
      const newSession = response.data.data;
      setSessions(current => [newSession, ...current]);
      setActiveSessionId(newSession._id);
      sessionId = newSession._id;
    }

    const messageText = composer.trim();
    const userMessage = {
      _id: `local-user-${Date.now()}`,
      role: 'user',
      content: messageText,
      citations: [],
    };
    const assistantMessageId = `local-assistant-${Date.now()}`;

    setComposer('');
    setStreaming(true);
    setError('');
    setActiveSession(current => ({
      ...current,
      session: current.session || sessions.find(item => item._id === sessionId) || null,
      messages: [
        ...(current.messages || []),
        userMessage,
        {
          _id: assistantMessageId,
          role: 'assistant',
          content: '',
          citations: [],
        },
      ],
    }));

    try {
      await aiService.streamMessage({
        sessionId,
        message: messageText,
        documentIds: selectedDocumentIds,
        onEvent: (event, payload) => {
          if (event === 'token') {
            setActiveSession(current => ({
              ...current,
              messages: current.messages.map(message =>
                message._id === assistantMessageId
                  ? { ...message, content: `${message.content}${payload.token}` }
                  : message
              ),
            }));
          }

          if (event === 'complete') {
            setActiveSession(current => ({
              session: payload.session,
              messages: current.messages.map(message =>
                message._id === assistantMessageId ? payload.assistantMessage : message
              ),
              documents: current.documents,
            }));

            setSessions(current => {
              const withoutCurrent = current.filter(item => item._id !== payload.session._id);
              return [payload.session, ...withoutCurrent];
            });
          }
        },
      });

      await loadSession(sessionId);
    } catch (err) {
      setError(err.message || 'Streaming failed');
    } finally {
      setStreaming(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading AI workspace…</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* Left Sidebar */}
        <aside className="space-y-4 card flex flex-col h-[calc(100vh-8rem)] sticky top-24">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LearnSphere AI
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Workspace</h1>
              <p className="mt-1 text-xs text-slate-500">
                Chat, RAG, and memory in one intelligent interface.
              </p>
            </div>
            <Sparkles className="text-purple-600 mt-1" size={20} />
          </div>

          <button
            onClick={handleCreateSession}
            disabled={creatingSession}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
          >
            <Plus size={16} />
            {creatingSession ? 'Creating…' : 'New Conversation'}
          </button>

          <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Knowledge Base</h2>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white/80 hover:bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition">
                <Upload size={14} />
                {uploading ? 'Uploading…' : 'Upload'}
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {documents.length === 0 && (
                <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>
              )}
              {documents.map(document => (
                <label
                  key={document._id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 text-sm transition-all duration-300 ${
                    selectedDocumentIds.includes(document._id)
                      ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-100 bg-white/60 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocumentIds.includes(document._id)}
                    onChange={() => toggleDocument(document._id)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800 text-xs">{document.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {document.status} · {document.chunkCount || 0} chunks
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(e, document._id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {sessions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center">
                  History is empty.
                </p>
              )}
              {sessions.map(session => (
                <div
                  key={session._id}
                  onClick={() => loadSession(session._id)}
                  className={`group flex items-center justify-between w-full cursor-pointer rounded-2xl border p-3 text-left transition-all duration-300 ${
                    activeSessionId === session._id
                      ? 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-[1.02]'
                      : 'border-white bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm">{session.title}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        activeSessionId === session._id ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {session.messageCount || 0} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0 ${
                      activeSessionId === session._id ? 'text-white hover:text-red-200' : 'text-slate-400 hover:text-red-500'
                    }`}
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Main Chat */}
        <section className="flex flex-col h-[calc(100vh-8rem)] rounded-3xl glass border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-white/20 bg-white/40 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {activeSession.session?.title || 'Start a new conversation'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs text-slate-500 font-medium">System Ready</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-white">
                <Database size={12} className="text-indigo-500" />
                {overview?.stats?.documents || 0} Docs
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            )}

            {activeSession.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto opacity-80">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Bot className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  How can I help you learn today?
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Ask me to summarize uploaded documents, test your knowledge, or explain complex architectures.
                </p>
              </div>
            )}

            {activeSession.messages.map(message => (
              <div
                key={message._id}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`relative px-5 py-4 rounded-3xl max-w-[85%] sm:max-w-[75%] shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'glass border border-white text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    message.role === 'user' ? 'text-blue-100' : 'text-indigo-500'
                  }`}>
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </p>
                  
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 prose-strong:text-indigo-900 prose-a:text-blue-600">
                      <ReactMarkdown>{message.content || 'Thinking…'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  )}

                  {message.citations?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-md p-3 shadow-inner">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">
                        Retrieved Context
                      </p>
                      <div className="space-y-2">
                        {message.citations.map(citation => (
                          <div key={citation.chunkId} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs">
                            <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                              <FileText size={12} className="text-indigo-400" />
                              {citation.documentName}
                            </p>
                            <p className="text-slate-500 leading-relaxed italic border-l-2 border-indigo-200 pl-2">"{citation.snippet}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/30">
            <div className="relative rounded-3xl glass border border-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              <textarea
                value={composer}
                onChange={event => setComposer(event.target.value)}
                placeholder="Ask about a topic, or hit Enter to send..."
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between px-3 pb-1 border-t border-slate-100/50 pt-2 mt-1">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${selectedDocumentIds.length > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {selectedDocumentIds.length} sources active
                  </p>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!composer.trim() || streaming}
                  className="btn btn-primary px-5 py-2 text-sm font-semibold rounded-xl flex items-center gap-2"
                >
                  {streaming ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-4 hidden xl:block">
          <div className="card h-full">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FolderKanban className="text-purple-600" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Architecture</h2>
                <p className="text-xs text-slate-500 font-medium">Production-focused hints</p>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
              {architectureCards.map(section => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="rounded-2xl bg-slate-50/50 border border-slate-100 p-4 hover:shadow-sm transition">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={16} className="text-indigo-500" />
                      <p className="font-bold text-slate-800 text-sm">{section.title}</p>
                    </div>
                    <div className="space-y-3">
                      {section.items.map(item => (
                         <div key={item.id} className="relative pl-3 border-l-2 border-indigo-100">
                          <p className="text-xs font-bold text-slate-700">{item.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default AIWorkspacePage;
