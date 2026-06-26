import OpenAI from 'openai';
import { aiConfig, isRemoteLlmEnabled } from '../utils/aiConfig.js';

let _client = null;
let _clientKey = '';

/**
 * Returns an OpenAI-SDK client pointed at whatever gateway is configured.
 * Works with OpenRouter, standard OpenAI, or any OpenAI-compatible endpoint.
 */
const getClient = () => {
  const currentKey = `${aiConfig.apiKey}||${aiConfig.baseUrl}`;
  if (!_client || _clientKey !== currentKey) {
    _clientKey = currentKey;
    console.log('Creating new OpenAI client with config:', {
      baseUrl: aiConfig.baseUrl,
      chatModel: aiConfig.chatModel,
      provider: aiConfig.provider,
      hasApiKey: !!aiConfig.apiKey,
      apiKeyLength: aiConfig.apiKey?.length || 0
    });
    _client = new OpenAI({
      apiKey: aiConfig.apiKey,
      baseURL: aiConfig.baseUrl || undefined,
      // OpenRouter requires these headers to identify the calling app
      defaultHeaders: aiConfig.baseUrl?.includes('openrouter.ai')
        ? {
            'HTTP-Referer': 'https://learnsphere.app',
            'X-Title': 'LearnSphere',
          }
        : {},
    });
  }
  return _client;
};

// ─── Local fallback (no API key) ─────────────────────────────────────────────
const buildLocalResponse = ({ messages, retrievedChunks = [], memoryItems = [] }) => {
  const latest = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  const lead = retrievedChunks.length
    ? 'I found relevant context in your uploaded material and am grounding the answer in those notes.'
    : 'I do not have document context for this answer and am responding from the conversation alone.';

  const memoryLead = memoryItems.length
    ? ` I also kept in mind: ${memoryItems.map(i => i.content).join('; ')}.`
    : '';

  const evidenceLead = retrievedChunks.length
    ? ` Sources referenced: ${retrievedChunks.slice(0, 3).map(i => `${i.documentName} (chunk ${i.chunkIndex + 1})`).join(', ')}.`
    : '';

  return `${lead}${memoryLead}${evidenceLead}\n\nHere is a practical answer to your request:\n${latest}\n\n1. Start with the core concept.\n2. Tie it back to the uploaded learning material.\n3. Finish with a next step you can take immediately.`;
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Main service ─────────────────────────────────────────────────────────────
export const llmService = {
  async streamChatCompletion({ systemPrompt, messages, retrievedChunks = [], memoryItems = [], onToken }) {

    console.log('AI Config Check:', {
      apiKey: aiConfig.apiKey ? 'Present' : 'Missing',
      baseUrl: aiConfig.baseUrl,
      chatModel: aiConfig.chatModel,
      provider: aiConfig.provider,
      isRemoteEnabled: isRemoteLlmEnabled()
    });

    // ── Offline fallback ──────────────────────────────────────────────────────
    if (!isRemoteLlmEnabled()) {
      console.log('Using local fallback - AI API not configured');
      const fallback = buildLocalResponse({ messages, retrievedChunks, memoryItems });
      const parts = fallback.split(/(\s+)/).filter(Boolean);
      let fullText = '';
      for (const part of parts) {
        fullText += part;
        onToken(part);
        await wait(8);
      }
      return { content: fullText, provider: 'local-simulation', model: 'local-simulation' };
    }

    console.log('Using remote AI provider:', aiConfig.provider);

    // ── Real streaming call ───────────────────────────────────────────────────
    try {
      const stream = await getClient().chat.completions.create({
        model: aiConfig.chatModel,
        temperature: 0.4,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
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

      console.log('AI streaming completed, content length:', content.length);
      return {
        content,
        provider: aiConfig.provider,
        model: aiConfig.chatModel,
      };
    } catch (error) {
      console.error('AI streaming error:', error);
      throw error;
    }
  },
};
