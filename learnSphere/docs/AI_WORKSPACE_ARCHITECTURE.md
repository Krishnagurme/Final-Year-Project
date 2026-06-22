# LearnSphere AI Workspace Architecture

## Step 1: Simple Feature Explanations

### 1. AI Chat System
This is the main conversation engine. A learner sends a message, your backend prepares the right context, the model generates a reply, and the frontend shows it like a modern chat app.

### 2. RAG
RAG means Retrieval-Augmented Generation. Instead of asking the model to answer from general memory only, your system first searches useful passages from uploaded learning material, then adds those passages into the prompt.

### 3. Context and Memory
Context is the short-term conversation window. Memory is the long-term user-specific knowledge such as preferences, goals, constraints, and recurring study topics.

### 4. Document Q&A
Learners upload PDFs or text files. The backend extracts the text, splits it into chunks, creates embeddings, stores those embeddings, and uses retrieval so answers can cite the uploaded material.

### 5. Streaming Responses
The backend sends the answer token by token or chunk by chunk. The frontend renders those updates live, which makes the experience feel fast and conversational.

## Step 2: Architecture Design

### Backend services
- Session service: owns chat sessions, titles, summaries, and message history
- Document ingestion service: handles upload, parsing, chunking, and embedding generation
- Retrieval service: scores chunks against the current question and returns the best evidence
- Memory service: stores stable user facts and preferences from important user messages
- LLM service: abstracts model calls and streaming behavior
- API layer: exposes clean endpoints for sessions, uploads, overview data, and streaming

### API design
```text
GET    /api/ai/overview
GET    /api/ai/sessions
POST   /api/ai/sessions
GET    /api/ai/sessions/:sessionId
POST   /api/ai/sessions/:sessionId/messages/stream
GET    /api/ai/documents
POST   /api/ai/documents/upload
```

### Data flow
```text
User uploads file
-> extract text
-> chunk text
-> generate embeddings
-> save document + chunks

User sends message
-> load session history
-> fetch relevant memory
-> embed user query
-> retrieve top chunks
-> build system prompt
-> stream model output
-> save assistant response + citations
```

### How chat, RAG, and memory fit together
- Chat gives the conversational shell
- RAG injects relevant document knowledge at request time
- Memory injects persistent user knowledge at request time
- The prompt combines both, so answers are personalized and grounded

## Step 3: Backend Implementation Summary

### Implemented in LearnSphere
- `backend/src/modules/ai/models`
- `backend/src/modules/ai/services`
- `backend/src/modules/ai/utils`
- `backend/src/routes/ai.routes.js`

### Included backend capabilities
- Session creation and retrieval
- Streaming chat endpoint
- Document upload pipeline
- Text chunking
- Embedding abstraction with local fallback
- Mongo-backed chunk storage
- Retrieval by cosine similarity
- Durable memory entries

### Free vector database options
- Qdrant local mode
- Chroma local mode
- MongoDB plus application-side cosine search for early-stage projects

## Step 4: Frontend Implementation Summary

### Implemented in LearnSphere
- `frontend/src/pages/AIWorkspacePage.jsx`
- `frontend/src/services/index.js`
- `frontend/src/components/Sidebar.jsx`

### Included frontend capabilities
- ChatGPT-style workspace layout
- Session list
- File upload panel
- Document selection for RAG
- Streaming assistant output
- Chat history rendering
- Citation blocks for grounded answers

## Step 5: Recommended Folder Structure

```text
learnSphere/
  backend/
    src/
      modules/
        ai/
          models/
          services/
          utils/
      routes/
        ai.routes.js
  frontend/
    src/
      pages/
        AIWorkspacePage.jsx
      services/
        index.js
      components/
        Sidebar.jsx
```

## Step 6: Free and Cheap Tool Suggestions

### Embeddings
- `nomic-embed-text` through Ollama for local development
- `sentence-transformers` for local CPU/GPU experimentation
- `text-embedding-3-small` when you want low-cost hosted embeddings

### Vector databases
- Qdrant local mode
- Chroma local mode
- MongoDB-backed vectors with app-side ranking for smaller portfolios

### LLM providers
- Ollama for fully local demos and privacy-first testing
- Groq for fast free-tier experimentation
- OpenRouter for inexpensive access to multiple hosted models

## Step 7: Optimization Strategy

### Performance
- Chunk documents once and reuse stored embeddings
- Limit retrieval to top few chunks
- Keep message history windows short
- Prefer semantic chunk boundaries over raw fixed-size splitting

### Token usage
- Summarize older chat instead of sending the entire thread
- Pass only top-ranked chunks to the model
- Store memory selectively, not every user sentence

### Scalability
- Move embeddings and retrieval into background jobs as traffic grows
- Swap application-side vector scoring for a dedicated vector store when collections become large
- Add queue-based ingestion for large documents

## Step 8: Common Mistakes

### Mistakes to avoid
- Sending whole documents to the LLM instead of retrieving only relevant passages
- Treating every user message as durable memory
- Mixing upload parsing, retrieval, memory, and controllers in one large file
- Hiding citations from the UI, which makes debugging hard
- Building only for mock data instead of real sessions and persisted documents

### Better approach
- Keep services separated by responsibility
- Add provider abstractions so your code survives model changes
- Design the UI and API around long-lived conversations, not one-off prompts
