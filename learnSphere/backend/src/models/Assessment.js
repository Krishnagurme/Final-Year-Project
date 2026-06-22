import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    type: {
      type: String,
      enum: ['PREREQUISITE', 'QUIZ', 'FINAL_EXAM'],
      required: true,
    },
    questions: [
      {
        question: String,
        type: {
          type: String,
          enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'],
        },
        options: [String],
        correctAnswer: String,
        points: Number,
      },
    ],
    answers: [
      {
        questionId: String,
        studentAnswer: String,
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    aiEvaluation: {
      skillLevel: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      },
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      feedback: String,
      confidenceScore: Number,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED'],
      default: 'NOT_STARTED',
    },
    timeTaken: Number, // in minutes
    attemptNumber: {
      type: Number,
      default: 1,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startedAt: Date,
    submittedAt: Date,
    evaluatedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Assessment', assessmentSchema);
