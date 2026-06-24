import OpenAI from 'openai';
import AITutor from '../models/AITutor.js';

// Lazy-initialise so the module loads even when the key is absent
let _client = null;
const getClient = () => {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL || undefined,
      defaultHeaders: process.env.AI_BASE_URL?.includes('openrouter.ai')
        ? { 'HTTP-Referer': 'https://learnsphere.app', 'X-Title': 'LearnSphere' }
        : {},
    });
  }
  return _client;
};

const CHAT_MODEL = process.env.AI_CHAT_MODEL || 'deepseek/deepseek-chat';

class AITutorService {
  // Create a new AI tutor session
  static async createSession(userId, subject, courseId = null) {
    const session = new AITutor({
      userId,
      subject,
      courseId,
      messages: [
        {
          role: 'system',
          content: `You are a helpful ${subject} tutor. Your goal is to help the student learn in an interactive and engaging way. 
                   Ask questions to understand their current level and learning style. Provide explanations, examples, and practice 
                   problems as needed.`,
        },
      ],
    });

    return await session.save();
  }

  // Get an existing session
  static async getSession(sessionId, userId) {
    return await AITutor.findOne({ _id: sessionId, userId });
  }

  // Get all sessions for a user
  static async getUserSessions(userId, { limit = 10, page = 1, isActive } = {}) {
    const query = { userId };
    if (isActive !== undefined) query.isActive = isActive;

    const sessions = await AITutor.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AITutor.countDocuments(query);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Send a message to the AI tutor
  static async sendMessage(sessionId, userId, message) {
    const session = await AITutor.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to the conversation
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    let aiContent;

    if (!process.env.AI_API_KEY && !process.env.OPENAI_API_KEY) {
      aiContent = `I am your ${session.subject} tutor. I received your message: "${message}". (AI service is currently offline — please check your configuration to enable live responses.)`;
    } else {
      const response = await getClient().chat.completions.create({
        model: CHAT_MODEL,
        messages: session.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1000,
      });
      aiContent = response.choices[0].message.content;
    }

    // Add AI response to the conversation
    session.messages.push({
      role: 'assistant',
      content: aiContent,
      timestamp: new Date(),
    });

    session.updatedAt = new Date();
    await session.save();

    return {
      message: aiContent,
      sessionId: session._id,
    };
  }

  // End a tutoring session
  static async endSession(sessionId, userId) {
    const session = await AITutor.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Session not found');
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    return session;
  }

  // Generate a summary of the session
  static async generateSessionSummary(sessionId, userId) {
    const session = await AITutor.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Session not found');
    }

    if (!process.env.AI_API_KEY && !process.env.OPENAI_API_KEY) {
      return `Summary for ${session.subject} session (${session.messages.length - 1} messages exchanged). AI service not configured — live summaries unavailable.`;
    }

    const response = await getClient().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        {
          role: 'system',
          content:
            'Please provide a concise summary of this tutoring session, including key concepts covered, areas of strength, and suggestions for further study.',
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  }
}

export default AITutorService;
