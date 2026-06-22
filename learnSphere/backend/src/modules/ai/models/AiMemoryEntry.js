import mongoose from 'mongoose';

const aiMemoryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiChatSession',
      default: null,
    },
    kind: {
      type: String,
      enum: ['preference', 'goal', 'profile', 'constraint', 'fact'],
      default: 'fact',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      default: 0.7,
    },
    lastReferencedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

aiMemoryEntrySchema.index({ userId: 1, updatedAt: -1 });
aiMemoryEntrySchema.index({ userId: 1, content: 1 }, { unique: true });

export default mongoose.model('AiMemoryEntry', aiMemoryEntrySchema);
