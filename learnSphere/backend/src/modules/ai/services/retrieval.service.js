import mongoose from 'mongoose';
import AiDocument from '../models/AiDocument.js';
import AiDocumentChunk from '../models/AiDocumentChunk.js';
import { embeddingService } from './embedding.service.js';
import { aiConfig } from '../utils/aiConfig.js';
import { cosineSimilarity } from '../utils/vector.js';

const castDocumentIds = documentIds =>
  (documentIds || [])
    .filter(Boolean)
    .map(value => new mongoose.Types.ObjectId(String(value)));

export const retrievalService = {
  async retrieve({ userId, query, documentIds = [] }) {
    const selectedIds = castDocumentIds(documentIds);
    const filter = {
      userId,
      ...(selectedIds.length ? { documentId: { $in: selectedIds } } : {}),
    };

    const queryEmbedding = await embeddingService.embedText(query);
    const chunks = await AiDocumentChunk.find(filter)
      .select('documentId chunkIndex text embedding tokenEstimate')
      .lean();

    if (!chunks.length) {
      return [];
    }

    const scored = chunks
      .map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding || []),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, aiConfig.retrievalLimit);

    const documents = await AiDocument.find({
      _id: { $in: scored.map(item => item.documentId) },
    })
      .select('name')
      .lean();

    const nameById = new Map(documents.map(doc => [String(doc._id), doc.name]));

    return scored.map(item => ({
      ...item,
      documentName: nameById.get(String(item.documentId)) || 'Document',
    }));
  },
};
