import mongoose from 'mongoose';

const aiChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New AI Conversation',
      trim: true,
    },
    model: {
      type: String,
      default: 'local-simulation',
    },
    selectedDocumentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AiDocument',
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

aiChatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('AiChatSession', aiChatSessionSchema);
