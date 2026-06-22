import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiDocument',
      required: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiDocumentChunk',
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    snippet: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const contextSnapshotSchema = new mongoose.Schema(
  {
    memoryItems: [{ type: String }],
    retrievedChunkIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AiDocumentChunk',
      },
    ],
  },
  { _id: false }
);

const aiChatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiChatSession',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
    contextSnapshot: contextSnapshotSchema,
    tokenEstimate: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

aiChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model('AiChatMessage', aiChatMessageSchema);
