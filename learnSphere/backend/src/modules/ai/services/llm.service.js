import OpenAI from 'openai';
import { aiConfig, isRemoteLlmEnabled } from '../utils/aiConfig.js';

let client = null;

const getClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: aiConfig.apiKey,
      baseURL: aiConfig.baseUrl || undefined,
    });
  }
  return client;
};

const buildLocalResponse = ({ messages, retrievedChunks = [], memoryItems = [] }) => {
  const latestUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content || '';
  const lead = retrievedChunks.length
    ? 'I found relevant context in your uploaded material, so I am grounding the answer in those notes.'
    : 'I do not have document context for this answer, so I am responding from the conversation alone.';

  const memoryLead = memoryItems.length
    ? ` I also kept in mind: ${memoryItems.map(item => item.content).join('; ')}.`
    : '';

  const evidenceLead = retrievedChunks.length
    ? ` Source highlights: ${retrievedChunks
        .slice(0, 3)
        .map(item => `${item.documentName} chunk ${item.chunkIndex + 1}`)
        .join(', ')}.`
    : '';

  return `${lead}${memoryLead}${evidenceLead}\n\nHere is a practical answer to your request:\n${latestUserMessage}\n\n1. Start with the core concept.\n2. Tie it back to the uploaded learning material.\n3. Finish with a next step the learner can take immediately.`;
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const llmService = {
  async streamChatCompletion({ systemPrompt, messages, retrievedChunks, memoryItems, onToken }) {
    if (!isRemoteLlmEnabled()) {
      const fallback = buildLocalResponse({ messages, retrievedChunks, memoryItems });
      const parts = fallback.split(/(\s+)/).filter(Boolean);
      let fullText = '';

      for (const part of parts) {
        fullText += part;
        onToken(part);
        await wait(10);
      }

      return {
        content: fullText,
        provider: 'local-simulation',
        model: 'local-simulation',
      };
    }

    const stream = await getClient().chat.completions.create({
      model: aiConfig.chatModel,
      temperature: 0.3,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    let content = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        content += delta;
        onToken(delta);
      }
    }

    return {
      content,
      provider: aiConfig.provider,
      model: aiConfig.chatModel,
    };
  },
};
