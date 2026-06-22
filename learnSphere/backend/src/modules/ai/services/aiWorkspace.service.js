import mongoose from 'mongoose';
import multer from 'multer';
import AiChatSession from '../models/AiChatSession.js';
import AiChatMessage from '../models/AiChatMessage.js';
import AiDocument from '../models/AiDocument.js';
import AiDocumentChunk from '../models/AiDocumentChunk.js';
import { aiConfig } from '../utils/aiConfig.js';
import { chunkText, estimateTokens } from '../utils/textChunker.js';
import { extractDocumentText } from '../utils/documentParser.js';
import { embeddingService } from './embedding.service.js';
import { retrievalService } from './retrieval.service.js';
import { memoryService } from './memory.service.js';
import { llmService } from './llm.service.js';
import { getAiOverview } from './overview.service.js';

const buildSessionTitle = message =>
  (message || 'New AI Conversation')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(' ')
    .slice(0, 60);

const ensureOwnerSession = async (userId, sessionId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error('Invalid session id');
  }

  const session = await AiChatSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new Error('AI session not found');
  }

  return session;
};

const uniqueObjectIds = values =>
  [...new Set((values || []).filter(Boolean).map(value => String(value)))].map(
    value => new mongoose.Types.ObjectId(value)
  );

const buildSystemPrompt = ({ memoryItems, retrievedChunks }) => {
  const memorySection = memoryItems.length
    ? `Learner memory:\n${memoryItems.map(item => `- ${item.content}`).join('\n')}`
    : 'Learner memory:\n- No durable learner memory available yet.';

  const retrievalSection = retrievedChunks.length
    ? `Retrieved study context:\n${retrievedChunks
        .map(
          (chunk, index) =>
            `[${index + 1}] ${chunk.documentName} (chunk ${chunk.chunkIndex + 1}): ${chunk.text}`
        )
        .join('\n\n')}`
    : 'Retrieved study context:\n- No document evidence matched this question.';

  return `You are the original LearnSphere AI tutor. Be accurate, encouraging, and practical.
Use the retrieved study context when it is relevant.
If the answer depends on a document, mention the source naturally.
Keep responses structured and helpful for learners.

${memorySection}

${retrievalSection}`;
};

const buildRollingSummary = messages =>
  messages
    .slice(-6)
    .map(message => `${message.role}: ${message.content}`)
    .join('\n')
    .slice(0, 1000);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: aiConfig.maxUploadSizeBytes,
  },
});

export const aiWorkspaceService = {
  async getOverview() {
    return getAiOverview();
  },

  async createSession(userId, payload = {}) {
    const session = await AiChatSession.create({
      userId,
      title: payload.title?.trim() || 'New AI Conversation',
      selectedDocumentIds: uniqueObjectIds(payload.documentIds),
    });

    return session.toObject();
  },

  async listSessions(userId) {
    return AiChatSession.find({ userId }).sort({ updatedAt: -1 }).lean();
  },

  async getSession(userId, sessionId) {
    const session = await ensureOwnerSession(userId, sessionId);
    const messages = await AiChatMessage.find({ sessionId }).sort({ createdAt: 1 }).lean();
    const documents = await AiDocument.find({ _id: { $in: session.selectedDocumentIds } })
      .select('name status chunkCount createdAt')
      .lean();

    return {
      session: session.toObject(),
      messages,
      documents,
    };
  },

  async deleteSession(userId, sessionId) {
    const session = await ensureOwnerSession(userId, sessionId);
    await AiChatMessage.deleteMany({ sessionId: session._id });
    await AiChatSession.deleteOne({ _id: session._id, userId });
    return { success: true };
  },

  async listDocuments(userId) {
    return AiDocument.find({ userId }).sort({ updatedAt: -1 }).lean();
  },

  async uploadDocument(userId, file) {
    if (!file) {
      throw new Error('File upload is required');
    }

    const document = await AiDocument.create({
      userId,
      name: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      status: 'PROCESSING',
    });

    try {
      const text = await extractDocumentText(file);
      const cleanedText = text.trim();

      if (!cleanedText) {
        throw new Error('No readable text was extracted from the uploaded document');
      }

      const chunks = chunkText(cleanedText, {
        chunkSize: aiConfig.chunkSize,
        chunkOverlap: aiConfig.chunkOverlap,
      });

      const embeddings = await embeddingService.embedMany(chunks.map(chunk => chunk.text));
      const chunkDocs = chunks.map((chunk, index) => ({
        documentId: document._id,
        userId,
        chunkIndex: index,
        text: chunk.text,
        tokenEstimate: chunk.tokenEstimate,
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
        embedding: embeddings[index] || [],
      }));

      await AiDocumentChunk.insertMany(chunkDocs);

      document.status = 'READY';
      document.chunkCount = chunkDocs.length;
      document.tokenEstimate = estimateTokens(cleanedText);
      document.textPreview = cleanedText.slice(0, 220);
      document.metadata = {
        fileExtension: file.originalname.split('.').pop()?.toLowerCase() || '',
      };
      await document.save();

      return document.toObject();
    } catch (error) {
      document.status = 'FAILED';
      document.metadata = { error: error.message };
      await document.save();
      throw error;
    }
  },

  async deleteDocument(userId, documentId) {
    const document = await AiDocument.findOne({ _id: documentId, userId });
    if (!document) {
      throw new Error('Document not found');
    }
    await AiDocumentChunk.deleteMany({ documentId: document._id });
    await AiDocument.deleteOne({ _id: document._id, userId });
    
    // Remove document from all sessions that selected it
    await AiChatSession.updateMany(
      { userId, selectedDocumentIds: document._id },
      { $pull: { selectedDocumentIds: document._id } }
    );
    return { success: true };
  },

  async streamMessage({ userId, sessionId, message, documentIds = [], onToken }) {
    const session = await ensureOwnerSession(userId, sessionId);
    const activeDocumentIds = documentIds.length
      ? uniqueObjectIds(documentIds)
      : session.selectedDocumentIds;

    if (documentIds.length) {
      session.selectedDocumentIds = activeDocumentIds;
      await session.save();
    }

    await AiChatMessage.create({
      sessionId: session._id,
      userId,
      role: 'user',
      content: message,
      tokenEstimate: estimateTokens(message),
    });

    await memoryService.captureFromMessage({
      userId,
      sessionId: session._id,
      message,
    });

    const [memoryItems, retrievedChunks] = await Promise.all([
      memoryService.getRelevant({
        userId,
        query: message,
        limit: aiConfig.maxMemoryItems,
      }),
      retrievalService.retrieve({
        userId,
        query: message,
        documentIds: activeDocumentIds,
      }),
    ]);

    const recentMessages = await AiChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(aiConfig.maxSessionMessages)
      .lean();

    const chatMessages = recentMessages.reverse().map(item => ({
      role: item.role,
      content: item.content,
    }));

    const assistantResult = await llmService.streamChatCompletion({
      systemPrompt: buildSystemPrompt({
        memoryItems,
        retrievedChunks,
      }),
      messages: chatMessages,
      retrievedChunks,
      memoryItems,
      onToken,
    });

    const citations = retrievedChunks.map(chunk => ({
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkId: chunk._id,
      chunkIndex: chunk.chunkIndex,
      score: Number(chunk.score.toFixed(4)),
      snippet: chunk.text.slice(0, 180),
    }));

    const assistantMessage = await AiChatMessage.create({
      sessionId: session._id,
      userId,
      role: 'assistant',
      content: assistantResult.content,
      citations,
      contextSnapshot: {
        memoryItems: memoryItems.map(item => item.content),
        retrievedChunkIds: retrievedChunks.map(chunk => chunk._id),
      },
      tokenEstimate: estimateTokens(assistantResult.content),
    });

    session.messageCount += 2;
    session.lastMessageAt = new Date();
    session.model = assistantResult.model;
    if (session.title === 'New AI Conversation') {
      session.title = buildSessionTitle(message);
    }

    const messageWindow = await AiChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .lean();
    session.summary = buildRollingSummary(messageWindow);
    await session.save();

    return {
      session: session.toObject(),
      assistantMessage: assistantMessage.toObject(),
      citations,
      memoryItems,
      retrievedChunks: retrievedChunks.map(chunk => ({
        id: chunk._id,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkIndex: chunk.chunkIndex,
        score: Number(chunk.score.toFixed(4)),
        snippet: chunk.text.slice(0, 180),
      })),
    };
  },
};
