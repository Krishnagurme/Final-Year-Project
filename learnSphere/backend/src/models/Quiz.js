import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    questions: [
      {
        questionText: String,
        type: {
          type: String,
          enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'],
        },
        options: [String],
        correctAnswer: String,
        explanation: String,
        points: {
          type: Number,
          default: 1,
        },
      },
    ],
    totalPoints: Number,
    passingScore: {
      type: Number,
      default: 70,
    },
    timeLimit: Number, // in minutes
    isPublished: {
      type: Boolean,
      default: false,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    showAnswerExplanation: {
      type: Boolean,
      default: true,
    },
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

export default mongoose.model('Quiz', quizSchema);
