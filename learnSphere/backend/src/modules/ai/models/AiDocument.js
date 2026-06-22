import mongoose from 'mongoose';

const aiDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['UPLOAD'],
      default: 'UPLOAD',
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'READY', 'FAILED'],
      default: 'PROCESSING',
    },
    textPreview: {
      type: String,
      default: '',
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    tokenEstimate: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

aiDocumentSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('AiDocument', aiDocumentSchema);
