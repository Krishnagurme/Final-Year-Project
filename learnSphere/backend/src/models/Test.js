import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionBank',
      },
    ],
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    timeLimit: {
      type: Number,
      default: 30,
      min: 1,
    },
    schedule: {
      type: String,
      enum: ['ALWAYS', 'SCHEDULED'],
      default: 'ALWAYS',
    },
    scheduledAt: Date,
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Test', testSchema);
