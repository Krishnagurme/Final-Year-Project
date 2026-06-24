export const getAiOverview = () => ({
  beginnerGuide: [
    {
      id: 'chat',
      title: 'AI Chat System',
      explanation:
        'This is the conversation layer. The user sends a message, your backend prepares context, the model writes a response, and the UI streams it back token by token.',
    },
    {
      id: 'rag',
      title: 'RAG',
      explanation:
        'RAG means the AI does not guess from memory alone. It first searches your uploaded notes or documents, then uses the best matching passages while answering.',
    },
    {
      id: 'memory',
      title: 'Context and Memory',
      explanation:
        'Memory stores useful facts about the learner and the ongoing conversation, such as goals, preferences, and previous topics, so every answer feels connected.',
    },
    {
      id: 'documents',
      title: 'Document Q&A',
      explanation:
        'The user uploads files like PDF or text. Your system extracts text, splits it into chunks, creates embeddings, and lets the chatbot answer from that material.',
    },
    {
      id: 'streaming',
      title: 'Streaming Responses',
      explanation:
        'Instead of waiting for the whole answer, the backend sends the response in small pieces. The frontend renders those pieces live for a typing effect.',
    },
  ],
  architecture: {
    backendServices: [
      'Session service to manage conversations and history',
      'Document ingestion service for parsing and chunking uploads',
      'Embedding service with remote provider support and local fallback',
      'Retrieval service to rank the most relevant chunks',
      'Memory service to keep stable learner facts and preferences',
      'Streaming controller to send server-sent events to the UI',
    ],
    apiDesign: [
      'GET /api/ai/overview',
      'GET /api/ai/sessions',
      'POST /api/ai/sessions',
      'GET /api/ai/sessions/:sessionId',
      'POST /api/ai/sessions/:sessionId/messages/stream',
      'GET /api/ai/documents',
      'POST /api/ai/documents/upload',
    ],
    dataFlow: [
      'Upload file -> parse text -> chunk content -> generate embeddings -> save chunks',
      'User asks question -> fetch memory -> embed question -> retrieve chunks -> build prompt',
      'Model streams answer -> save assistant message -> show citations and updated history',
    ],
  },
  folderStructure: {
    backend: [
      'src/modules/ai/models',
      'src/modules/ai/services',
      'src/modules/ai/utils',
      'src/routes/ai.routes.js',
    ],
    frontend: ['src/pages/AIWorkspacePage.jsx', 'src/services/index.js', 'src/components/Sidebar.jsx'],
  },
  optimizationTips: [
    'Chunk documents at semantic boundaries instead of fixed hard cuts only.',
    'Retrieve only the top few chunks and compress memory before prompt assembly.',
    'Keep recent chat history short and rely on stored summaries for older context.',
    'Store document embeddings once and reuse them for every future question.',
    'Use streaming so the UI feels fast even when the model is slower.',
  ],
  commonMistakes: [
    'Stuffing full documents into the prompt instead of retrieving only relevant chunks.',
    'Saving every user message as permanent memory without filtering importance.',
    'Mixing upload parsing, retrieval, prompting, and controller logic in one file.',
    'Ignoring source citations, which makes debugging and trust much harder.',
    'Using demo-only mock data paths that break once real files and real users appear.',
  ],
  freeToolSuggestions: [
    'Embeddings: nomic-embed-text via Ollama, sentence-transformers locally, or text-embedding-3-small for low paid usage',
    'Vector stores: Qdrant local mode, Chroma local mode, or MongoDB-backed cosine search for small projects',
    'LLM APIs: OpenRouter low-cost models, Groq for fast free-tier experiments, Ollama for fully local development',
  ],
});
