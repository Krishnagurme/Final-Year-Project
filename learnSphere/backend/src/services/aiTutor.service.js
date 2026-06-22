import AITutor from '../models/AITutor.js';
import { Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from 'uuid';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

class AITutorService {
  // Create a new AI tutor session
  static async createSession(userId, subject, courseId = null) {
    const session = new AITutor({
      userId,
      subject,
      courseId,
      messages: [{
        role: 'system',
        content: `You are a helpful ${subject} tutor. Your goal is to help the student learn in an interactive and engaging way. 
                 Ask questions to understand their current level and learning style. Provide explanations, examples, and practice 
                 problems as needed.`
      }]
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
      totalPages: Math.ceil(total / limit)
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
      timestamp: new Date()
    });

    // Get AI response
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiMessage = response.data.choices[0].message;
    
    // Add AI response to the conversation
    session.messages.push({
      role: 'assistant',
      content: aiMessage.content,
      timestamp: new Date()
    });
    
    session.updatedAt = new Date();
    await session.save();
    
    return {
      message: aiMessage.content,
      sessionId: session._id
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
    
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        ...session.messages,
        {
          role: 'system',
          content: 'Please provide a concise summary of this tutoring session, including key concepts covered, areas of strength, and suggestions for further study.'
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    });
    
    return response.data.choices[0].message.content;
  }
}

export default AITutorService;
