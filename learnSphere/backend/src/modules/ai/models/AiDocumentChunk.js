import mongoose from 'mongoose';

const aiDocumentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiDocument',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    tokenEstimate: {
      type: Number,
      default: 0,
    },
    charStart: {
      type: Number,
      default: 0,
    },
    charEnd: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

aiDocumentChunkSchema.index({ userId: 1, documentId: 1, chunkIndex: 1 }, { unique: true });

export default mongoose.model('AiDocumentChunk', aiDocumentChunkSchema);
