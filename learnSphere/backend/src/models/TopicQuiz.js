import mongoose from 'mongoose';

const topicQuizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    questions: [
      {
        id: String,
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function(v) {
              return v.length === 4;
            },
            message: 'Each question must have exactly 4 options',
          },
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          default: 'medium',
        },
        explanation: String,
      },
    ],
    passingScore: {
      type: Number,
      default: 60,
    },
    timeLimit: {
      type: Number,
      default: 10, // minutes
    },
    attempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
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

export default mongoose.model('TopicQuiz', topicQuizSchema);
