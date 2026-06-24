import AiMemoryEntry from '../models/AiMemoryEntry.js';

const sentenceCandidates = text =>
  (text || '')
    .split(/[\n.!?]+/)
    .map(item => item.trim())
    .filter(Boolean);

const classifyMemory = sentence => {
  const lower = sentence.toLowerCase();

  if (/(remember|prefer|like|dislike|style|format)/.test(lower)) {
    return 'preference';
  }
  if (/(goal|want to|trying to|need to|plan to)/.test(lower)) {
    return 'goal';
  }
  if (/(i am|i'm|my name is|i study|i work|my background)/.test(lower)) {
    return 'profile';
  }
  if (/(can't|cannot|do not|don't|limited|deadline)/.test(lower)) {
    return 'constraint';
  }
  return 'fact';
};

const extractMemoryStatements = text =>
  sentenceCandidates(text)
    .filter(sentence =>
      /(remember|i am|i'm|my name is|i prefer|i like|i need|i want|my goal|deadline|cannot|can't|i study|i work)/i.test(
        sentence
      )
    )
    .slice(0, 5)
    .map(sentence => ({
      content: sentence,
      kind: classifyMemory(sentence),
    }));

const scoreByOverlap = (query, content) => {
  const queryTerms = new Set((query || '').toLowerCase().split(/\W+/).filter(Boolean));
  const contentTerms = new Set((content || '').toLowerCase().split(/\W+/).filter(Boolean));

  let overlap = 0;
  queryTerms.forEach(term => {
    if (contentTerms.has(term)) {
      overlap += 1;
    }
  });

  return overlap / Math.max(queryTerms.size || 1, 1);
};

export const memoryService = {
  async captureFromMessage({ userId, sessionId, message }) {
    const candidates = extractMemoryStatements(message);
    if (!candidates.length) {
      return [];
    }

    const results = [];
    for (const candidate of candidates) {
      const existing = await AiMemoryEntry.findOne({
        userId,
        content: candidate.content,
      });

      if (existing) {
        existing.lastReferencedAt = new Date();
        existing.score = Math.min(existing.score + 0.05, 0.98);
        existing.kind = candidate.kind;
        await existing.save();
        results.push(existing);
      } else {
        try {
          const created = await AiMemoryEntry.create({
            userId,
            sessionId,
            kind: candidate.kind,
            content: candidate.content,
            score: 0.75,
          });
          results.push(created);
        } catch (err) {
          // Ignore E11000 duplicate key — another request already inserted it
          if (err.code !== 11000) throw err;
        }
      }
    }

    return results;
  },

  async getRelevant({ userId, query, limit = 5 }) {
    const entries = await AiMemoryEntry.find({ userId }).sort({ updatedAt: -1 }).limit(20).lean();

    return entries
      .map(entry => ({
        ...entry,
        relevance: scoreByOverlap(query, entry.content) + entry.score * 0.35,
      }))
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, limit);
  },
};
