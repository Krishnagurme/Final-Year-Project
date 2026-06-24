import mongoose from 'mongoose';

const prerequisiteAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    answers: [
      {
        questionIndex: Number,
        selectedAnswer: String,
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    knowledgeLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 15,
    },
    correctCount: Number,
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

prerequisiteAttemptSchema.index({ studentId: 1, courseId: 1 });

export default mongoose.model('PrerequisiteAttempt', prerequisiteAttemptSchema);
